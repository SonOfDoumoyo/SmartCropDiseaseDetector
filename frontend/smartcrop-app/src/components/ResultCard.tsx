import { useState } from 'react';
import type { PredictionResult } from '../types';
interface Props {
    result: PredictionResult;
    preview: string;
    onReset: () => void;
}

type Tab = 'overview' | 'chemical' | 'cultural' | 'prevention';

function formatDiseaseName(raw: string): string {
    const parts = raw.split('___');
    if (parts.length === 2) {
        const crop = parts[0].replace(/_/g, ' ');
        const disease = parts[1].replace(/_/g, ' ');
        if (disease.toLowerCase().includes('healthy')) return `${crop} — Healthy ✅`;
        return `${crop} — ${disease}`;
    }
    return raw.replace(/_/g, ' ');
}

function severityColor(s: string) {
    const v = s.toLowerCase();
    if (v.includes('very high')) return '#c0392b';
    if (v.includes('high')) return '#e67e22';
    if (v.includes('moderate')) return '#f1c40f';
    return '#27ae60';
}

function confColor(c: number) {
    if (c >= 85) return '#27ae60';
    if (c >= 65) return '#f39c12';
    return '#e74c3c';
}

export default function ResultCard({ result, preview, onReset }: Props) {
    const [tab, setTab] = useState<Tab>('overview');
    const { treatment, confidence, low_confidence, top3, from_cache } = result;
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const tabs: { id: Tab; label: string }[] = [
        { id: 'overview', label: '📋Overview' }, { id: 'chemical', label: '🧪Treatment' }, { id: 'cultural', label: '🌾Cultural' }, { id: 'prevention', label: '🛡 Prevention' }, 
    ];

    return ( 
        <div className="result-page">
            <div className="result-top">
                <div className="result-preview-wrap">
                    <img src={preview} alt="Analysed leaf" className="result-preview-img" />
                    {from_cache && <span className="cache-badge">⚡Cached</span>}
                </div>
                <div className="result-summary">
                    <p className="result-label">Detected Disease</p>
                    <h2 className="result-disease">{formatDiseaseName(result.disease)}</h2>
                    {treatment?.common_name && <p className="result-common">{treatment.common_name}</p>} 
                    <div className="conf-row">
                        <span className="conf-label">Confidence</span>
                        <span className="conf-value" style={{ color: confColor(confidence) }}>
                        {confidence.toFixed(1)}%
                        </span>
                    </div>
                    <div className="conf-bar-bg">
                        <div className="conf-bar-fill" style={{ width: `${confidence}%`, background: confColor(confidence) }} />
                    </div>
                    {low_confidence && ( 
                    <div className="low-conf-warn">
                        ⚠ Low confidence — try a clearer, closer image of a single leaf.
                    </div>
                    )}
                    {treatment?.severity && ( 
                    <div className="severity-row">
                        <span className="severity-label">Severity:</span>
                        <span className="severity-badge" style={{ background: severityColor(treatment.severity) }}>
                        {treatment.severity} 
                        </span>
                    </div>
                    )}
                    {isHealthy && ( <div className="healthy-msg">✅Your crop appears healthy. No disease detected.</div>
                    )} 
                </div>
            </div>

            {top3.length > 1 && !isHealthy && ( 
                <div className="top3-section">
                    <p className="top3-title">Other possibilities considered</p>
                    <div className="top3-list">
                    {top3.slice(1).map(p => ( 
                    <div className="top3-item" key={p.class}>
                        <span className="top3-name">{formatDiseaseName(p.class)}</span>
                        <span className="top3-conf">{p.confidence.toFixed(1)}%</span>
                    </div>
                    ))} 
                </div>
            </div>
            )}
            
            {treatment && ( 
            <div className="treatment-card">
                <div className="tab-bar">
                    {tabs.map(t => ( 
                        <button key={t.id}
                            className={`tab-btn ${tab === t.id ? 'tab-active' : ''}`}
                            onClick={() => setTab(t.id)}>
                            {t.label} 
                        </button>
                    ))} 
                </div>
                <div className="tab-content">
                    {tab === 'overview' && ( <div className="tab-panel">
                    <InfoRow label="Crop" value={treatment.crop} />
                    <InfoRow label="Causal Agent" value={treatment.causal_agent} />
                    <InfoRow label="Symptoms" value={treatment.symptoms} />
                </div>
                )}
                {tab === 'chemical' && <div className="tab-panel"><p className="tab- text">{treatment.chemical_treatment}</p></div>}
                {tab === 'cultural' && <div className="tab-panel"><p className="tab- text">{treatment.cultural_practices}</p></div>}
                {tab === 'prevention' && <div className="tab-panel"><p className="tab- text">{treatment.prevention}</p></div>} </div>
            </div>
            )}
            <div className="result-actions">
                <button className="btn-primary" onClick={onReset}>🔄Analyse Another Leaf</button>
            </div>
        </div>
);
}
function InfoRow({ label, value }: { label: string; value: string }) {
return ( 
    <div className="info-row">
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
    </div>
);
}