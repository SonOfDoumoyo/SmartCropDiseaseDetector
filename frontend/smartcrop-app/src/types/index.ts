export interface Treatment {
    common_name: string;
    crop: string;
    causal_agent: string;
    symptoms: string;
    severity: string;
    chemical_treatment: string;
    cultural_practices: string;
    prevention: string;
}

export interface TopPrediction {
    class: string;
    confidence: number;
}

export interface PredictionResult {
    crop: string;
    disease: string;
    confidence: number;
    treatment: Treatment | null;

    // Future fields
    low_confidence?: boolean;
    top3?: TopPrediction[];
    

    from_cache: boolean;
}

export type AppState =
    | 'idle'
    | 'previewing'
    | 'loading'
    | 'result'
    | 'error';