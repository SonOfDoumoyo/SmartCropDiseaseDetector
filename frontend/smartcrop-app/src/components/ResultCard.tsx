import { useState } from 'react';
import type { PredictionResult } from '../types';

interface Props {
    result: PredictionResult;
    preview: string;
    onReset: () => void;
}

type Tab = 'overview' | 'treatment' | 'prevention';

function formatDiseaseName(raw: string): string {
    return raw.replace(/_/g, ' ');
}

function confColor(c: number) {
    if (c >= 85) return '#27ae60';
    if (c >= 65) return '#f39c12';
    return '#e74c3c';
}

export default function ResultCard({
    result,
    preview,
    onReset
}: Props) {

    const [tab, setTab] = useState<Tab>('overview');

    // -----------------------------------------
    // V1-safe defaults
    // -----------------------------------------

    const confidence = result.confidence * 100;

    const top3 = result?.top3 ?? [];

    const treatment = result.treatment ?? null;

    const isHealthy = result.disease
        .toLowerCase()
        .includes('healthy');

    return (
        <div className="result-page">

            {/* =====================================
                RESULT HEADER
            ===================================== */}

            <div className="result-top">

                <div className="result-preview-wrap">

                    <img
                        src={preview}
                        alt="Analysed leaf"
                        className="result-preview-img"
                    />

                    {result.from_cache && (
                        <span className="cache-badge">
                            ⚡ Cached
                        </span>
                    )}

                </div>


                <div className="result-summary">

                    <p className="result-label">
                        Detected Disease
                    </p>

                    <h2 className="result-disease">
                        {formatDiseaseName(result.disease)}
                    </h2>

                    <p className="result-common">
                        Crop: {formatDiseaseName(result.crop)}
                    </p>


                    {/* Confidence */}

                    <div className="conf-row">

                        <span className="conf-label">
                            Confidence
                        </span>

                        <span
                            className="conf-value"
                            style={{
                                color: confColor(confidence)
                            }}
                        >
                            {confidence.toFixed(1)}%
                        </span>

                    </div>


                    <div className="conf-bar-bg">

                        <div
                            className="conf-bar-fill"
                            style={{
                                width: `${confidence}%`,
                                background: confColor(confidence)
                            }}
                        />

                    </div>


                    {/* Low confidence */}

                    {confidence < 65 && (
                        <div className="low-conf-warn">
                            ⚠ Low confidence — try a clearer,
                            closer image of a single leaf.
                        </div>
                    )}


                    {/* Healthy */}

                    {isHealthy && (
                        <div className="healthy-msg">
                            ✅ Your crop appears healthy.
                            No disease detected.
                        </div>
                    )}

                </div>

            </div>


            {/* =====================================
                TOP 3 PREDICTIONS
            ===================================== */}

            {top3.length > 0 && !isHealthy && (

                <div className="top3-section">

                    <p className="top3-title">
                        Other possibilities
                    </p>

                    <div className="top3-list">

                        {top3
                            .slice(1)
                            .map((prediction) => (

                                <div
                                    className="top3-item"
                                    key={prediction.class}
                                >

                                    <span className="top3-name">
                                        {formatDiseaseName(
                                            prediction.class
                                        )}
                                    </span>

                                    <span className="top3-conf">
                                        {(
                                            prediction.confidence
                                            * 100
                                        ).toFixed(1)}%
                                    </span>

                                </div>

                            ))}

                    </div>

                </div>

            )}


            {/* =====================================
                TREATMENT / INFORMATION
            ===================================== */}

            <div className="treatment-card">

                <div className="tab-bar">

                    <button
                        className={`tab-btn ${
                            tab === 'overview'
                                ? 'tab-active'
                                : ''
                        }`}
                        onClick={() => setTab('overview')}
                    >
                        📋 Overview
                    </button>


                    <button
                        className={`tab-btn ${
                            tab === 'treatment'
                                ? 'tab-active'
                                : ''
                        }`}
                        onClick={() => setTab('treatment')}
                    >
                        🧪 Treatment
                    </button>


                    <button
                        className={`tab-btn ${
                            tab === 'prevention'
                                ? 'tab-active'
                                : ''
                        }`}
                        onClick={() => setTab('prevention')}
                    >
                        🛡 Prevention
                    </button>

                </div>


                <div className="tab-content">

                    {/* OVERVIEW */}

                    {tab === 'overview' && (

                        <div className="tab-panel">

                            <div className="info-row">

                                <span className="info-label">
                                    Crop
                                </span>

                                <span className="info-value">
                                    {formatDiseaseName(
                                        result.crop
                                    )}
                                </span>

                            </div>


                            <div className="info-row">

                                <span className="info-label">
                                    Diagnosis
                                </span>

                                <span className="info-value">
                                    {formatDiseaseName(
                                        result.disease
                                    )}
                                </span>

                            </div>


                            <div className="info-row">

                                <span className="info-label">
                                    Confidence
                                </span>

                                <span className="info-value">
                                    {confidence.toFixed(1)}%
                                </span>

                            </div>


                            <p className="v1-note">
                                🌱 SmartCrop V1 provides an
                                AI-based disease identification.
                                Treatment recommendations will
                                be available in a future update.
                            </p>

                        </div>

                    )}


                    {/* TREATMENT */}

                    {tab === 'treatment' && (

                        <div className="tab-panel">

                            {treatment ? (

                                <>
                                    <h3>
                                        Treatment
                                    </h3>

                                    <p className="tab-text">
                                        {treatment.chemical_treatment}
                                    </p>

                                    <h3>
                                        Cultural Practices
                                    </h3>

                                    <p className="tab-text">
                                        {treatment.cultural_practices}
                                    </p>
                                </>

                            ) : (

                                <div className="coming-soon">

                                    <div className="coming-soon-icon">
                                        🧪
                                    </div>

                                    <h3>
                                        Treatment coming soon
                                    </h3>

                                    <p>
                                        SmartCrop has identified
                                        the disease. Treatment and
                                        management recommendations
                                        will be added to the next
                                        version.
                                    </p>

                                </div>

                            )}

                        </div>

                    )}


                    {/* PREVENTION */}

                    {tab === 'prevention' && (

                        <div className="tab-panel">

                            {treatment?.prevention ? (

                                <p className="tab-text">
                                    {treatment.prevention}
                                </p>

                            ) : (

                                <div className="coming-soon">

                                    <div className="coming-soon-icon">
                                        🛡️
                                    </div>

                                    <h3>
                                        Prevention guidance
                                    </h3>

                                    <p>
                                        Prevention recommendations
                                        will be available when the
                                        SmartCrop treatment database
                                        is connected.
                                    </p>

                                </div>

                            )}

                        </div>

                    )}

                </div>

            </div>


            {/* =====================================
                ACTIONS
            ===================================== */}

            <div className="result-actions">

                <button
                    className="btn-primary"
                    onClick={onReset}
                >
                    🔄 Analyse Another Leaf
                </button>

            </div>

        </div>
    );
}