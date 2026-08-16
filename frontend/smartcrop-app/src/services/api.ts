import axios from 'axios';
import type { PredictionResult } from '../types';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 80000,
});

export async function predictDisease(
    file: File
): Promise<PredictionResult> {
    const formData = new FormData();

    formData.append('file', file);

    const { data } = await api.post<PredictionResult>(
        '/predict',
        formData
    );

    return data;
}