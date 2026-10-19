import { useEffect, useRef, useState } from 'react';
import { MAP_STYLE_OPTIONS } from '../mapStyles';

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function MapStyleControl({ value, onChange }) {
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

  return (
    <div className="map-style-control" ref={rootRef}>
      <button
        type="button"
        className={`map-style-trigger ${open ? 'open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Map layers and style"
        title="Map style"
        onClick={() => setOpen((o) => !o)}
      >
        <LayersIcon />
      </button>
      {open && (
        <div className="map-style-menu" role="menu">
          <p className="map-style-menu-title">Basemap</p>
          <ul className="map-style-list">
            {MAP_STYLE_OPTIONS.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={value === opt.id}
                  className={`map-style-option ${value === opt.id ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                >
                  <span className="map-style-option-text">
                    <span className="map-style-option-label">{opt.label}</span>
                    <span className="map-style-option-desc">{opt.description}</span>
                  </span>
                  {value === opt.id && <span className="map-style-check" aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
