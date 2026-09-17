/**
 * Mirrors backend/src/config/plan.js - the paid plan's advertised customer
 * capacity and billing model, shown in the paywall modal so the shop owner
 * sees exactly what they're getting: capacity as a concrete number, and a
 * one-time payment (not an auto-charging subscription) as the billing model.
 * Keep this in sync with the backend constants.
 */
export const CUSTOMER_LIMIT = 1000;
export const BILLING_PERIOD_DAYS = 30;
