import axios from 'axios';

// Module-level token store — set by AuthContext after login/refresh
let _accessToken = null;
let _onUnauthorized = null;
let _onTokenRefreshed = null;
let _refreshPromise = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function setUnauthorizedHandler(fn) {
  _onUnauthorized = fn;
}

export function setTokenRefreshedHandler(fn) {
  _onTokenRefreshed = fn;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly refresh cookie on every request
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// On 401: attempt one silent refresh, then retry original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // If a refresh is already in progress, wait for it
        if (!_refreshPromise) {
          _refreshPromise = axios.post('/api/auth/refresh', {}, { withCredentials: true })
            .then(({ data }) => {
              _accessToken = data.accessToken;
              if (_onTokenRefreshed) _onTokenRefreshed(data.accessToken);
              return data.accessToken;
            })
            .finally(() => { _refreshPromise = null; });
        }
        const newToken = await _refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        _accessToken = null;
        if (_onUnauthorized) _onUnauthorized();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
