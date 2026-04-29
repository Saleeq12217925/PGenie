import { useEffect, useRef, useState } from 'react';

export function FileUpload({ onFiles, maxFiles = 5, accept = 'image/*' }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function handleChange(e) {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const files = Array.from(e.target.files).slice(0, maxFiles);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    onFiles(files);
  }

  function removeFile(i) {
    URL.revokeObjectURL(previews[i]);
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (maxFiles <= 0) {
    return (
      <div style={{
        border: '2px dashed var(--border)',
        borderRadius: '10px',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text)',
        opacity: 0.5,
        fontSize: '0.875rem',
      }}>
        Maximum photos reached.
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: '10px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
          fontSize: '0.875rem',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>📷</div>
        Click to upload photos (max {maxFiles})
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
              <button
                onClick={() => removeFile(i)}
                style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                  borderRadius: '50%', background: '#ef4444', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
