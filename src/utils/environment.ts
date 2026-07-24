/**
 * Detects whether we're running in a browser-like environment with a usable
 * `localStorage`, as opposed to Node.js where `conf` (backed by `node:fs`)
 * should be used instead.
 *
 * Implemented as a function (rather than a module-scope constant) so it can
 * be re-evaluated on every call, which keeps it testable and avoids caching
 * a stale result at import time.
 */
export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && window.localStorage !== undefined
