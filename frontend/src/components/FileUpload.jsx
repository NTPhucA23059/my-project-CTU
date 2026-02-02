import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileAudio, FileVideo, X, CheckCircle2, Loader2 } from 'lucide-react';

const FileUpload = ({ onFileUpload, isProcessing }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        // Chấp nhận các định dạng audio và video phổ biến
        const validTypes = ['audio/', 'video/'];
        const isFileValid = validTypes.some(type => file.type.startsWith(type)) ||
            file.name.match(/\.(mp3|wav|m4a|mp4|mkv|mov|flv|webm)$/i);

        if (isFileValid) {
            setSelectedFile(file);
        } else {
            alert(t('upload.error_invalid_type'));
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = () => {
        if (selectedFile) {
            onFileUpload(selectedFile);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {!selectedFile ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group
                        ${isDragging
                            ? 'border-secondary bg-secondary/10 scale-105'
                            : 'border-slate-600 bg-dark-card hover:border-slate-500 hover:bg-slate-800'
                        }
                    `}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                        accept="audio/*,video/*"
                        disabled={isProcessing}
                    />
                    <div className="bg-slate-700/50 p-4 rounded-full mb-4 group-hover:bg-slate-700 transition-colors">
                        <Upload className={`w-8 h-8 text-slate-400 group-hover:text-white transition-colors ${isDragging ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className="text-slate-300 font-medium text-center">
                        {t('upload.drag_drop_title')}
                    </p>
                    <p className="text-slate-500 text-sm mt-2 text-center">
                        {t('upload.drag_drop_subtitle')}
                    </p>
                </div>
            ) : (
                <div className="bg-dark-card rounded-2xl p-4 border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            {selectedFile.type.startsWith('video/') ? (
                                <FileVideo className="w-8 h-8 text-indigo-400" />
                            ) : (
                                <FileAudio className="w-8 h-8 text-indigo-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-200 truncate" title={selectedFile.name}>
                                {selectedFile.name}
                            </h4>
                            <p className="text-slate-500 text-xs mt-1">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={removeFile}
                            disabled={isProcessing}
                            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={isProcessing}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('upload.extracting')}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                {t('upload.start_analysis')}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
