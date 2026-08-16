import { useRef, useState, useCallback, useEffect } from 'react';
import type { AppState } from '../types';

interface Props {
    state: AppState;
    preview: string | null;
    error: string;
    onFileSelect: (file: File) => void;
    onDetect: () => void;
    onReset: () => void;
}
export default function UploadZone({ state, preview, error, onFileSelect, onDetect, onReset }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = useCallback((file: File) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) { alert('Upload a JPEG, PNG, or WebP image.'); return; }
        if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB.'); return; }
        onFileSelect(file);
    }, [onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
        const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image'));
        if (item) { const f = item.getAsFile(); if (f) handleFile(f); }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    }, [handleFile]);
    const isLoading = state === 'loading';

    return ( 
        <div className="upload-page">
            <div className="steps">
                {['Select a leaf image', 'Click Detect Disease', 'Get instant results'].map((s, i) => ( 
                <div className="step" key={i}>
                    <div className="step-num">{i + 1}</div>
                    <p className="step-text">{s}</p>
                </div>
                ))} 
            </div>

            <div className="upload-area">
                {!preview ? ( 
                <div
                    className={`dropzone ${dragging ? 'dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()} 
                >
                    <div className="drop-icon">🍃</div>
                    <p className="drop-title">Drag &amp; drop a leaf image here</p>
                    <p className="drop-sub">or click to browse &bull; paste from clipboard</p>
                    <p className="drop-formats">JPEG &bull; PNG &bull; WebP &bull; max 10 MB</p>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden-input" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
                    ) : (
                <div className="preview-container">
                    <img src={preview} alt="Selected leaf" className="preview-img" />
                    <button className="btn-ghost btn-sm" onClick={onReset}>✕ Remove</button>
                </div>)}

                <div className="upload-extras">
                    <button className="btn-outline" onClick={() => cameraInputRef.current?.click()}>
                     📷Use Camera
                    </button>
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden-input" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
                {error && <div className="error-box"><span>⚠</span> {error}</div>}
                {preview && !isLoading && ( 
                    <button className="btn-primary btn-lg" onClick={onDetect}>🔍Detect Disease</button>
                )}
                {isLoading && ( 
                    <div className="loading-box">
                        <div className="spinner" />
                        <p>Analysing image… this usually takes 1–2 seconds</p>
                    </div>
                )} 
            </div>
                <div className="crops-section">
                    <p className="crops-title">Supported Crops</p>
                    <div className="crops-grid">
                    {[
                        { icon: '🍅', name: 'Tomato', count: '10 diseases' }, { icon: '🌽', name: 'Maize', count: '3 diseases' }, { icon: '🌿', name: 'Cassava', count: '4 diseases' }, ].map(c => ( <div className="crop-chip" key={c.name}>
                        <span>{c.icon}</span>
                        <span className="crop-name">{c.name}</span>
                        <span className="crop-count">{c.count}</span>
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
}