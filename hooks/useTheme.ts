
import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

function useTheme(): [Theme, () => void] {
  const readValue = (): Theme => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    try {
      const item = window.localStorage.getItem('comic-creator-theme');
      return item ? (item as Theme) : 'dark';
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
      return 'dark';
    }
  };

  const [theme, setTheme] = useState<Theme>(readValue);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);

    try {
      window.localStorage.setItem('comic-creator-theme', theme);
    } catch (error) {
      console.warn('Error setting theme in localStorage:', error);
    }
  }, [theme]);

  return [theme, toggleTheme];
}

export default useTheme;