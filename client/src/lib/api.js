/**
 * Re-export the Axios instance and helpers from the canonical location.
 * New code imports from 'lib/api.js'; existing code imports from 'api/client.js'.
 * Both resolve to the same module-level singleton.
 */
export {
  default,
  setAccessToken,
  getAccessToken,
  setNavigateCallback,
  setTokenExpiredCallback
} from '../api/client.js'
