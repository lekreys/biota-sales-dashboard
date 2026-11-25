import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | null;

function storedTheme(): Theme {
  try {
    const theme = localStorage.getItem('theme');
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
}

function saveTheme(theme: Theme): void {
  try {
    if (theme) localStorage.setItem('theme', theme);
    else localStorage.removeItem('theme');
  } catch {
    return;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(storedTheme);

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    saveTheme(theme);
  }, [theme]);

  const isDark = theme === 'dark' || (theme === null && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return { isDark, toggleTheme };
}
