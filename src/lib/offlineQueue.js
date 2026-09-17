import { get, set } from "idb-keyval";
import { apiFetch } from "./api.js";

const QUEUE_KEY = "khaatabook:sync-queue";

// Set once (from a top-level hook, see hooks/useOnlineStatus.js) so this
// module - which has no React context of its own - can still make
// authenticated requests when flushing the queue.
let tokenGetter = null;
export function registerTokenGetter(fn) {
  tokenGetter = fn;
}

async function readQueue() {
  return (await get(QUEUE_KEY)) || [];
}

async function writeQueue(queue) {
  await set(QUEUE_KEY, queue);
}

/**
 * enqueueMutation
 * ----------------------------------------------------------------------
 * Called by mutation hooks when `navigator.onLine` is false (or a request
 * fails due to a network error). Persists the intended API call into
 * IndexedDB so it survives page reloads / app kills, to be replayed once
 * connectivity returns.
 * ----------------------------------------------------------------------
 */
export async function enqueueMutation(mutation) {
  const queue = await readQueue();
  queue.push({
    id: crypto.randomUUID(),
    queuedAt: Date.now(),
    ...mutation, // { path, method, body, isFormData }
  });
  await writeQueue(queue);
  return queue;
}

export async function getQueue() {
  return readQueue();
}

export async function clearQueueItem(id) {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

/**
 * flushQueue
 * ----------------------------------------------------------------------
 * Replays every queued mutation against the backend SEQUENTIALLY (not in
 * parallel) so dependent writes - e.g. a customer created offline, then a
 * transaction recorded against that same offline-created customer - land
 * in the correct order.
 * ----------------------------------------------------------------------
 */
export async function flushQueue(queryClient) {
  if (!navigator.onLine) return;
  const queue = await readQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      await apiFetch(item.path, {
        method: item.method,
        body: item.body,
        isFormData: item.isFormData,
        getToken: tokenGetter,
      });
      await clearQueueItem(item.id);
    } catch (err) {
      console.error("[offlineQueue] failed to replay mutation, will retry later:", err);
      // Stop on first failure to preserve ordering; remaining items stay
      // queued for the next 'online' event or manual retry.
      break;
    }
  }

  // Refresh cached data now that the server has the authoritative state.
  queryClient?.invalidateQueries({ queryKey: ["customers"] });
  queryClient?.invalidateQueries({ queryKey: ["transactions"] });
}

/**
 * initOfflineSync
 * ----------------------------------------------------------------------
 * Registers the `online` listener once at app boot. Also attempts an
 * initial flush in case the app was launched already online with items
 * left over from a previous offline session.
 * ----------------------------------------------------------------------
 */
export function initOfflineSync(queryClient) {
  window.addEventListener("online", () => flushQueue(queryClient));
  if (navigator.onLine) flushQueue(queryClient);
}
