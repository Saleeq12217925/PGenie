import { createContext, useCallback, useEffect, useState } from 'react';

export const ThemeContext = createContext({ dark: false, toggle: () => {} });

/**
 * Manages dark / light mode.
 * Priority: localStorage → system preference → light.
 * Applies `.dark` class on <html> so CSS `:root.dark` selectors activate.
 */
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('pgenie-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pgenie-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
