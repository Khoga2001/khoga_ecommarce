/**
 * KHOGA API Client — Axios instance with auth interceptors
 */
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Session ID for guest cart
const SESSION_KEY = 'khoga_session_id';
function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Request interceptor — attach auth token + session id
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('khoga_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Session-Id'] = getSessionId();
  return config;
});

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('khoga_token');
      localStorage.removeItem('khoga_user');
      // Don't redirect here — let AuthContext handle it
    }
    return Promise.reject(err);
  }
);

export { getSessionId };
export default apiClient;
