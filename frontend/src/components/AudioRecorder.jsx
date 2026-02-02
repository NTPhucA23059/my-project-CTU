import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AudioRecorder = ({ onRecordingComplete, isProcessing }) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Tạo file từ blob để gửi lên server, dùng đuôi .webm
                const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
                onRecordingComplete(audioFile);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert(t('recorder.error_access'));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-dark-card rounded-2xl shadow-xl w-full max-w-md mx-auto border border-slate-700">
            <div className="mb-6 relative">
                {isRecording && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-red-500 rounded-full blur-xl"
                    />
                )}
                <div className={`relative z-10 w-24 h-24 flex items-center justify-center rounded-full border-4 transition-all duration-300 ${isRecording ? 'border-red-500 bg-red-500/10' : 'border-slate-600 bg-slate-800'}`}>
                    {isRecording ? (
                        <Mic className="w-10 h-10 text-red-500" />
                    ) : (
                        <Mic className="w-10 h-10 text-slate-400" />
                    )}
                </div>
            </div>

            <div className="text-2xl font-mono font-bold text-slate-200 mb-6">
                {formatTime(recordingTime)}
            </div>

            <div className="flex gap-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                        {isProcessing ? t('common.processing') : t('recorder.start')}
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all shadow-lg shadow-red-500/30 animate-pulse"
                    >
                        <Square className="w-5 h-5 fill-current" />
                        {t('recorder.stop')}
                    </button>
                )}
            </div>
            {isProcessing && <p className="mt-4 text-sm text-slate-400 animate-pulse">{t('recorder.analyzing')}</p>}
        </div>
    );
};

export default AudioRecorder;
