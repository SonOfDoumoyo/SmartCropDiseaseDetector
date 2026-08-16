import axios from 'axios';
import type { PredictionResult } from '../types';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

export async function predictDisease(file: File): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<PredictionResult>('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, 
    });
    return data;
}