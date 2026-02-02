
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AudioRecorder from './components/AudioRecorder'
import FileUpload from './components/FileUpload'
import ctuLogo from "../public/logo.png";
import { transcribeAudio, translateText } from './services/api'
import { Bot, Sparkles, FileText, Activity, UploadCloud, Mic, Languages, ArrowRight } from 'lucide-react'

function App() {
    const { t, i18n } = useTranslation()
    const [transcription, setTranscription] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [translatedText, setTranslatedText] = useState(null)
    const [isTranslating, setIsTranslating] = useState(false)
    const [error, setError] = useState(null)
    const [inputMode, setInputMode] = useState('record') // 'record' | 'upload'

    const handleProcessAudio = async (file) => {
        setIsProcessing(true)
        setError(null)
        setTranscription(null)
        setTranslatedText(null)

        try {
            const result = await transcribeAudio(file)
            setTranscription(result)
        } catch (err) {
            console.error(err)
            setError("Có lỗi xảy ra khi xử lý file. Vui lòng thử lại.")
        } finally {
            setIsProcessing(false)
        }
    }

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
    }

    const handleTranslate = async (targetLang) => {
        if (!transcription?.text) return
        setIsTranslating(true)
        try {
            const result = await translateText(transcription.text, targetLang)
            setTranslatedText(result)
        } catch (err) {
            console.error(err)
            alert(t('app.translation_failed'))
        } finally {
            setIsTranslating(false)
        }
    }

    return (
        <div className="min-h-screen bg-dark text-white p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <header className="w-full max-w-4xl flex items-center justify-between mb-12 backdrop-blur-sm bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                        <img src={ctuLogo} alt="CTU Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {t('app.title')}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wider">{t('app.university')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/10 rounded-lg p-1">
                        <button
                            onClick={() => changeLanguage('vi')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${i18n.language === 'vi' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            VI
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${i18n.language === 'en' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>
                    <div className="text-sm text-slate-400 font-medium hidden md:block">
                        {t('app.project_info')}
                    </div>
                </div>
            </header>

            <main className="w-full max-w-4xl flex flex-col gap-8">
                <section className="text-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                        {t('app.hero_title_1')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t('app.hero_title_2')}</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        {t('app.hero_subtitle')}
                    </p>
                </section>

                <section className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 w-full space-y-6">
                        <div className="bg-dark-card/50 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                            <div className="flex items-center p-1 bg-black/20 rounded-t-xl">
                                <button
                                    onClick={() => setInputMode('record')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${inputMode === 'record' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <Mic className="w-4 h-4" /> {t('app.tab_record')}
                                </button>
                                <button
                                    onClick={() => setInputMode('upload')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${inputMode === 'upload' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <UploadCloud className="w-4 h-4" /> {t('app.tab_upload')}
                                </button>
                            </div>

                            <div className="p-8 flex justify-center min-h-[300px] items-center">
                                {inputMode === 'record' ? (
                                    <AudioRecorder
                                        onRecordingComplete={handleProcessAudio}
                                        isProcessing={isProcessing}
                                    />
                                ) : (
                                    <FileUpload
                                        onFileUpload={handleProcessAudio}
                                        isProcessing={isProcessing}
                                    />
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                                {t('app.error_process')}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        <div className="bg-dark-card/50 backdrop-blur-md rounded-2xl p-1 border border-white/10 h-full min-h-[400px] flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <h3 className="font-semibold text-slate-200">{t('app.result_title')}</h3>
                            </div>

                            <div className="flex-1 p-6">
                                {transcription ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">{t('app.result_transcription_label')}</label>
                                            <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-lg leading-relaxed text-indigo-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {transcription.text ? (
                                                    `"${transcription.text}"`
                                                ) : (
                                                    <span className="text-slate-500 italic">{t('app.result_no_voice')}</span>
                                                )}
                                            </div>

                                            {/* Translation Section */}
                                            {transcription.text && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Languages className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">{t('app.translate_to')}</span>
                                                        <div className="flex gap-2 ml-2">
                                                            <button
                                                                onClick={() => handleTranslate('en')}
                                                                disabled={isTranslating}
                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
                                                            >
                                                                {t('app.lang_en')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleTranslate('vi')}
                                                                disabled={isTranslating}
                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
                                                            >
                                                                {t('app.lang_vi')}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {translatedText && (
                                                        <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
                                                            <div className="absolute -left-3 top-6 bottom-0 w-1 bg-gradient-to-b from-emerald-500/50 to-transparent rounded-full"></div>
                                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-lg leading-relaxed text-emerald-100">
                                                                "{translatedText}"
                                                            </div>
                                                        </div>
                                                    )}

                                                    {isTranslating && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-400 animate-pulse mt-2">
                                                            <Activity className="w-4 h-4 animate-spin" /> {t('app.translating')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">{t('app.result_language_label')}</label>
                                                <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-slate-300 font-mono">
                                                    {transcription.language}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">{t('app.result_input_type_label')}</label>
                                                <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-emerald-400 font-mono">
                                                    {inputMode === 'record' ? t('app.input_type_mic') : t('app.input_type_file')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                                        <FileText className="w-12 h-12" />
                                        <p>{t('app.result_placeholder')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default App
