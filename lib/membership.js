/**
 * Paid memberships are switched OFF. Everything on the site is free.
 *
 * This is a deliberate kill switch rather than a deletion: the Stripe routes,
 * the subscriptions table and the premium flags on listings and posts all
 * still exist, so turning paid plans back on is a one-line change here plus
 * re-checking the copy on /pricing.
 *
 * While this is false:
 *   - every visitor is treated as having full access, signed in or not
 *   - the daily free-view cap does not apply
 *   - /pricing explains that everything is free instead of selling a plan
 *   - /api/stripe/create-checkout refuses to start a subscription
 *   - the community needs an account, but no payment
 */
export const MEMBERSHIPS_ENABLED = false;
