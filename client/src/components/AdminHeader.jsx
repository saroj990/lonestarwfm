import { useEffect, useRef, useState } from 'react';
import { formatClock } from '../formatDateTime';
import ThemeToggle from './ThemeToggle';

function initials(name = '') {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ProfileMenu({ user, onRefresh, onOpenSettings, settingsOpen, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function run(action) {
    setOpen(false);
    action();
  }

  const canEditSettings = onOpenSettings && user.employee_type === 'admin';

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className={`profile-menu-trigger ${open ? 'open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="admin-avatar">{initials(user.username)}</span>
      </button>

      {open && (
        <div className="profile-menu-panel" role="menu">
          <div className="profile-menu-identity">
            <span className="admin-avatar admin-avatar-lg">{initials(user.username)}</span>
            <div className="admin-profile-text">
              <span className="admin-profile-name">{user.username}</span>
              <span className="admin-profile-meta">
                <span className="role-pill">{user.employee_type}</span>
                <span className="admin-profile-id">{user.employee_id}</span>
              </span>
            </div>
          </div>

          {(onRefresh || canEditSettings) && (
            <div className="profile-menu-group">
              {onRefresh && (
                <button type="button" role="menuitem" className="profile-menu-item" onClick={() => run(onRefresh)}>
                  Refresh map
                </button>
              )}
              {canEditSettings && (
                <button
                  type="button"
                  role="menuitem"
                  className="profile-menu-item"
                  onClick={() => run(onOpenSettings)}
                >
                  {settingsOpen ? 'Hide settings' : 'Settings'}
                </button>
              )}
            </div>
          )}

          {onLogout && (
            <div className="profile-menu-group">
              <button
                type="button"
                role="menuitem"
                className="profile-menu-item danger"
                onClick={() => run(onLogout)}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminHeader({
  user,
  title,
  subtitle,
  onRefresh,
  onOpenSettings,
  settingsOpen,
  onLogout,
  backLink,
  extraActions,
}) {
  const nowLabel = formatClock();

  return (
    <header className="admin-header">
      <div className="admin-header-main">
        {backLink || (
          <div className="admin-product-mark">
            <span className="admin-logo">LS</span>
            <span className="admin-product-name">LoneStar Command</span>
          </div>
        )}
        <span className="admin-header-divider" aria-hidden="true" />
        <div className="admin-header-titles">
          <h1 className="admin-page-title">{title}</h1>
          {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="admin-header-actions">
        {extraActions}
        <span className="admin-header-clock">{nowLabel}</span>
        <ThemeToggle />
        <ProfileMenu
          user={user}
          onRefresh={onRefresh}
          onOpenSettings={onOpenSettings}
          settingsOpen={settingsOpen}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
