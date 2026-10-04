/**
 * Centralized API Configuration
 * 
 * Provides validated base URL for backend API requests.
 * Throws in production builds if REACT_APP_API_URL was omitted at build time,
 * avoiding silent fallbacks to unreachable localhost addresses.
 */

const RAW_API_URL = process.env.REACT_APP_API_URL;

if (!RAW_API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REACT_APP_API_URL is not set in this production build.');
}

// Strip any trailing slashes to guarantee clean path concatenation
const sanitizedUrl = RAW_API_URL ? RAW_API_URL.trim().replace(/\/+$/, '') : '';

export const BASE_URL = sanitizedUrl || 'http://localhost:3500';
export const API_BASE_URL = BASE_URL;
export const API_URL = BASE_URL;

export default BASE_URL;
