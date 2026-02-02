import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const transcribeAudio = async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);

    try {
        const response = await axios.post(`${API_URL}/transcribe`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
    }
};

export const translateText = async (text, targetLang) => {
    try {
        const response = await axios.post(`${API_URL}/translate`, {
            text,
            target_lang: targetLang
        });
        return response.data.translated_text;
    } catch (error) {
        console.error("Error translating text:", error);
        throw error;
    }
};
