export default function AdminSettingsPanel({
  gpsIntervalMins,
  setGpsIntervalMins,
  refreshMins,
  setRefreshMins,
  onSave,
  saved,
}) {
  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-head">
        <h3>Operations settings</h3>
        <p className="muted small">
          Control worker GPS pings and how often this dashboard pulls live data.
        </p>
      </div>
      <div className="admin-settings-grid">
        <label className="setting-field">
          <span className="setting-label">Worker GPS ping interval</span>
          <span className="setting-hint">
            While a worker tab is open, location is sent every N minutes (background GPS ping).
          </span>
          <div className="setting-input-row">
            <input
              type="number"
              min="1"
              max="120"
              value={gpsIntervalMins}
              onChange={(e) => setGpsIntervalMins(e.target.value)}
            />
            <span className="setting-unit">min</span>
          </div>
        </label>
        <label className="setting-field">
          <span className="setting-label">Dashboard map refresh</span>
          <span className="setting-hint">
            How often markers and the activity feed reload on this screen.
          </span>
          <div className="setting-input-row">
            <input
              type="number"
              min="1"
              max="60"
              value={refreshMins}
              onChange={(e) => setRefreshMins(e.target.value)}
            />
            <span className="setting-unit">min</span>
          </div>
        </label>
      </div>
      <div className="admin-settings-foot">
        <button type="button" className="btn-admin primary" onClick={onSave}>
          Save settings
        </button>
        {saved && <span className="setting-saved">Saved</span>}
      </div>
    </section>
  );
}
