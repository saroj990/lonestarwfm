import { useEffect } from 'react';

/** Applies admin shell styling (panels, feed, map chrome) while mounted. */
export function AdminShell({ children }) {
  useEffect(() => {
    document.body.classList.add('theme-admin');
    return () => document.body.classList.remove('theme-admin');
  }, []);
  return children;
}
