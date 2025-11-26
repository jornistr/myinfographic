import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await axios.post('/api/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const processText = async (text) => {
    const response = await axios.post('/api/process-text', { text });
    return response.data;
};

export const generatePrompt = async (text, audience, terms, focus, language, styleNotes) => {
    const response = await axios.post('/api/generate-prompt', {
        text,
        audience,
        terms,
        focus,
        language,
        styleNotes
    });
    return response.data;
};

export const generateInfographic = async (prompt) => {
    try {
        const response = await axios.post(`${API_URL}/generate-infographic`, {
            prompt,
        });
        return response.data;
    } catch (error) {
        console.error('API Error (generateInfographic):', error.response ? error.response.data : error.message);
        throw error;
    }
};
