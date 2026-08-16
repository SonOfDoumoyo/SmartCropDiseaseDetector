import { useState, useCallback } from 'react';
import type { PredictionResult, AppState } from './types';
import { predictDisease } from './services/api';
import UploadZone from './components/UploadZone';
import ResultCard from './components/ResultCard';
import Header from './components/Header';
import './index.css';

export default function App() {

    const [state, setState] = useState<AppState>('idle');
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = useCallback((selected: File) => {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setResult(null);
        setError('');
        setState('previewing');
    }, []);

    const handleDetect = useCallback(async () => {
        if (!file) return;

        setState('loading');
        setError('');

        try {
            const data = await predictDisease(file);
            setResult(data);
            setState('result');

        } catch (err: unknown) {
            console.log('Error during prediction:', err);
            const msg =
            (err as { response?: { data?: { detail?: string } } })
            ?.response?.data?.detail ?? 'Detection failed. Please try a clearer leaf photo.';
            setError(msg);
            setState('error');
            }
        }, [file]);

    const handleReset = useCallback(() => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError('');
        setState('idle');
    }, []);

    return ( 
        <div className="app">
        <Header />
        <main className="main">
            {state === 'result' && result ? ( <ResultCard result={result} preview={preview!} onReset={handleReset} />
            ) : ( <UploadZone
                    state={state}
                    preview={preview}
                    error={error}
                    onFileSelect={handleFileSelect}
                    onDetect={handleDetect}
                    onReset={handleReset}
                />
            )} 
        </main>
        <footer className="footer">
            <p>Smart Crop Disease Identification System &mdash; Final Year Project</p>
        </footer>
        </div>
    );
}