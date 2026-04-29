import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

export function useTheme() {
  return useContext(ThemeContext);
}
