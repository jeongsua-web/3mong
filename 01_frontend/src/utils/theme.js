const STORAGE_KEY = 'fluento_theme';

export function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'system';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.dataset.theme = 'dark';
  } else if (theme === 'light') {
    delete root.dataset.theme;
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) root.dataset.theme = 'dark';
    else delete root.dataset.theme;
  }
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}
