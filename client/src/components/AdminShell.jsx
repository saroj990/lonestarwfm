import { useEffect } from 'react';

/** Applies monochrome admin theme to the document while mounted. */
export function AdminShell({ children }) {
  useEffect(() => {
    document.body.classList.add('theme-admin');
    return () => document.body.classList.remove('theme-admin');
  }, []);
  return children;
}
