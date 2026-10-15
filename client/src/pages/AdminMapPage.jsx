import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../auth';
import { api } from '../api';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AdminMapPage() {
  const { user, logout } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [intervalMins, setIntervalMins] = useState(10);

  async function loadMarkers() {
    try {
      const data = await api('/api/locations/latest');
      setMarkers(data.markers);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMarkers();
    api('/api/locations/settings')
      .then((s) => setIntervalMins(s.gps_interval_minutes))
      .catch(() => {});
    const t = setInterval(loadMarkers, 30000);
    return () => clearInterval(t);
  }, []);

  async function openWorker(marker) {
    setSelected(marker);
    try {
      const data = await api(`/api/photos/user/${marker.user_id}`);
      setPhotos(data.photos);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveInterval() {
    try {
      const data = await api('/api/locations/settings', {
        method: 'PUT',
        body: JSON.stringify({ gps_interval_minutes: Number(intervalMins) }),
      });
      setIntervalMins(data.gps_interval_minutes);
    } catch (err) {
      setError(err.message);
    }
  }

  const center = markers.length
    ? [markers[0].latitude, markers[0].longitude]
    : [25.2048, 55.2708];

  return (
    <div className="page admin-page">
      <header className="topbar">
        <div>
          <strong>GPS Dashboard</strong>
          <div className="muted small">
            {user.username} · {user.employee_type}
          </div>
        </div>
        <div className="row">
          <button className="ghost" onClick={loadMarkers}>
            Refresh
          </button>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {user.employee_type === 'admin' && (
        <section className="card compact">
          <label className="inline">
            GPS interval (minutes)
            <input
              type="number"
              min="1"
              value={intervalMins}
              onChange={(e) => setIntervalMins(e.target.value)}
            />
          </label>
          <button type="button" className="ghost" onClick={saveInterval}>
            Save
          </button>
        </section>
      )}

      <section className="map-wrap">
        <MapContainer center={center} zoom={11} className="map" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((m) => (
            <Marker
              key={m.user_id}
              position={[m.latitude, m.longitude]}
              icon={markerIcon}
              eventHandlers={{ click: () => openWorker(m) }}
            >
              <Popup>
                <strong>{m.username}</strong>
                <br />
                {m.employee_id}
                <br />
                {new Date(m.location_at + 'Z').toLocaleString()}
                <br />
                <button type="button" onClick={() => openWorker(m)}>
                  View photos
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      {markers.length === 0 && (
        <p className="muted pad">No worker locations yet. Workers need to open the app / upload a photo.</p>
      )}

      {selected && (
        <section className="card">
          <div className="row between">
            <h3>
              {selected.username} · {selected.employee_id}
            </h3>
            <button className="ghost" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p className="muted small">
            Last GPS: {new Date(selected.location_at + 'Z').toLocaleString()} · Photos:{' '}
            {selected.photo_count}
          </p>
          {photos.length === 0 && <p className="muted">No photos uploaded.</p>}
          <ul className="photo-list">
            {photos.map((p) => (
              <li key={p.id}>
                <img src={`/uploads/${p.filename}`} alt="" />
                <div>
                  <div>{new Date(p.created_at + 'Z').toLocaleString()}</div>
                  <div className="muted small">
                    {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  </div>
                  {p.comment && <div className="small">{p.comment}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
