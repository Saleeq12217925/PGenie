import { createContext, useReducer, useEffect, useCallback } from 'react';
import api, { setAccessToken, setUnauthorizedHandler, setTokenRefreshedHandler } from '../lib/axios.js';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: null,
  status: 'loading', // loading | authenticated | unauthenticated
};

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { ...state, user: action.user, accessToken: action.accessToken, status: 'authenticated' };
    case 'AUTH_FAIL':
      return { ...state, user: null, accessToken: null, status: 'unauthenticated' };
    case 'TOKEN_REFRESHED':
      return { ...state, accessToken: action.accessToken };
    case 'LOGOUT':
      return { ...state, user: null, accessToken: null, status: 'unauthenticated' };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Called by the axios interceptor when refresh fails
  const handleUnauthorized = useCallback(() => {
    setAccessToken(null);
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Called by the axios interceptor when token is refreshed
  const handleTokenRefreshed = useCallback((token) => {
    dispatch({ type: 'TOKEN_REFRESHED', accessToken: token });
  }, []);

  // On mount: try to restore session via refresh cookie → GET /auth/me
  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    setTokenRefreshedHandler(handleTokenRefreshed);

    async function restoreSession() {
      try {
        // First refresh to get a new access token (uses httpOnly cookie)
        const { data: refreshData } = await api.post('/auth/refresh');
        setAccessToken(refreshData.accessToken);
        // Then fetch user profile
        const { data: meData } = await api.get('/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', user: meData.user, accessToken: refreshData.accessToken });
      } catch {
        dispatch({ type: 'AUTH_FAIL' });
      }
    }

    restoreSession();
  }, [handleUnauthorized, handleTokenRefreshed]);

  // Keep axios in sync whenever accessToken changes
  useEffect(() => {
    setAccessToken(state.accessToken);
  }, [state.accessToken]);

  const setTokens = useCallback((accessToken, user) => {
    setAccessToken(accessToken);
    dispatch({ type: 'AUTH_SUCCESS', user, accessToken });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear local state regardless
    }
    setAccessToken(null);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', user: data.user, accessToken: state.accessToken });
    } catch {
      // ignore
    }
  }, [state.accessToken]);

  return (
    <AuthContext.Provider value={{ ...state, setTokens, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
