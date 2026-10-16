import { useEffect, useRef, useState } from 'react';
import AppMap, { FocusOnLocation, Pin } from '../components/AppMap';
import { useAuth } from '../auth';
import { api } from '../api';
import { useGpsPing } from '../hooks/useGpsPing';
import ThemeToggle from '../components/ThemeToggle';

const DEFAULT_MAP_CENTER = [24.4672, 39.6112];

function cameraErrorMessage(err) {
  if (!window.isSecureContext) {
    return 'Camera needs HTTPS or http://localhost. Open the app via localhost, not a LAN IP.';
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser does not support live camera. Use “Take / choose photo” below.';
  }
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission blocked. In Chrome: click the lock icon near the URL → Camera → Allow, then reload.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera found on this device. Use “Take / choose photo” below.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Camera is busy (another app may be using it). Close other camera apps and retry.';
  }
  return err?.message || 'Could not open camera. Try “Take / choose photo” below.';
}

export default function WorkerPage() {
  const { user, logout } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);

  useGpsPing(true);

  useEffect(() => {
    refreshLocation();
    api('/api/photos/mine')
      .then(({ photos }) => setPhotos(photos))
      .catch(() => {});
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  function setCapturedBlob(blob) {
    if (preview) URL.revokeObjectURL(preview);
    blobRef.current = blob;
    setPreview(URL.createObjectURL(blob));
  }

  async function startCamera() {
    setError('');
    setMessage('');
    if (!window.isSecureContext) {
      setError(cameraErrorMessage({ name: 'SecurityError' }));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(cameraErrorMessage(null));
      return;
    }

    const attempts = [
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false },
    ];

    let lastErr;
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraOn(true);
        refreshLocation();
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    setError(cameraErrorMessage(lastErr));
  }

  function refreshLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === 1) {
          setError('Location permission blocked. Allow location in the browser lock icon, then retry.');
        } else {
          setError('Could not get GPS. Tap Refresh location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        stopCamera();
      },
      'image/jpeg',
      0.85
    );
    refreshLocation();
  }

  function onFilePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setMessage('');
    stopCamera();
    setCapturedBlob(file);
    refreshLocation();
  }

  async function upload() {
    setError('');
    setMessage('');
    const blob = blobRef.current;
    if (!blob) {
      setError('Capture or choose a photo first.');
      return;
    }
    if (!coords) {
      setError('Waiting for GPS. Tap Refresh location.');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('photo', blob, blob.name || 'capture.jpg');
      form.append('latitude', String(coords.latitude));
      form.append('longitude', String(coords.longitude));
      form.append('comment', comment);
      await api('/api/photos', { method: 'POST', body: form });
      setMessage('Photo uploaded. Admin notified.');
      setComment('');
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      blobRef.current = null;
      const { photos } = await api('/api/photos/mine');
      setPhotos(photos);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <strong>LoneStar</strong>
          <div className="muted small">
            {user.username} · {user.employee_id}
          </div>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="map-wrap map-wrap-worker">
        <AppMap center={DEFAULT_MAP_CENTER} zoom={11}>
          {coords && (
            <>
              <FocusOnLocation latitude={coords.latitude} longitude={coords.longitude} />
              <Pin latitude={coords.latitude} longitude={coords.longitude} label="You" />
            </>
          )}
        </AppMap>
        {!coords && (
          <p className="muted map-overlay-hint">Allow location to center the map on you.</p>
        )}
      </section>

      <section className="card">
        <h2>Upload check-in</h2>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <div className="camera-box">
          {!preview ? (
            <video ref={videoRef} playsInline muted className={cameraOn ? '' : 'hidden'} />
          ) : (
            <img src={preview} alt="Captured" />
          )}
          {!cameraOn && !preview && <div className="camera-placeholder">Camera off</div>}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="row">
          {!cameraOn ? (
            <button type="button" onClick={startCamera}>
              Open live camera
            </button>
          ) : (
            <button type="button" onClick={capture}>
              Capture photo
            </button>
          )}
          {preview && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                blobRef.current = null;
              }}
            >
              Retake
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFilePicked}
        />
        <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
          Take / choose photo
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          If live camera is blocked, use “Take / choose photo” — on phones it opens the system camera.
        </p>

        <label>
          Comment
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        </label>

        <div className="coords">
          {coords ? (
            <span>
              GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </span>
          ) : (
            <span>GPS not captured yet</span>
          )}
          <button type="button" className="ghost small-btn" onClick={refreshLocation}>
            Refresh location
          </button>
        </div>

        <button type="button" onClick={upload} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload photo'}
        </button>
        <p className="muted small">
          While this tab is open and visible, your location is sent on the admin-configured
          interval (default 10 min). Pings stop when you leave this page, hide the tab, or close
          the browser.
        </p>
      </section>

      <section className="card">
        <h3>My recent uploads</h3>
        {photos.length === 0 && <p className="muted">No photos yet.</p>}
        <ul className="photo-list">
          {photos.slice(0, 8).map((p) => (
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
    </div>
  );
}
