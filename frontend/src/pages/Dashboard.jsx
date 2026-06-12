import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardText, Scan } from 'iconsax-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadBox from '../components/UploadBox';

const API_URL = import.meta.env.VITE_API_URL;

const STEPS = [
    "Extracting document text...",
    "Running semantic analysis...",
    "Detecting plagiarism...",
    "Generating report..."
];

export default function Dashboard() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scanStep, setScanStep] = useState(0);
    const navigate = useNavigate();

    /**
     * handleAnalyze — called by UploadBox with the single document text.
     * Posts to /plagiarism-check using the new { document_text } schema.
     */
    const handleAnalyze = async (documentText) => {
        setLoading(true);
        setError(null);
        setScanStep(0);

        // Sequence animation intervals
        const interval = setInterval(() => {
            setScanStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 1000);

        try {
            const response = await axios.post(
                `${API_URL.replace(/\/$/, "")}/plagiarism-check`,
                {
                document_text: documentText,
                }
            );

            console.log("Server response:", response.data);

            // Store result for Report page
            sessionStorage.setItem('lastResult', JSON.stringify(response.data));

            clearInterval(interval);
            setScanStep(3);

            // Auto redirect to report
            setTimeout(() => {
                navigate('/report');
            }, 800);

        } catch (err) {
            clearInterval(interval);
            console.error('Analysis failed:', err);
            setError(err.response?.data?.error || "Analysis failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-12 relative">
            {/* Scanning Overlay */}
            <AnimatePresence>
                {loading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-primary/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-glass-xl p-10 text-center max-w-sm w-full border border-accent/10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-accent/10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-accent to-accent-dark"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${((scanStep + 1) / 4) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-3xl border-2 border-dashed border-accent/30"
                                />
                                <Scan size={36} color="#A79277" variant="Bulk" className="animate-pulse relative z-10" />
                            </div>

                            <h3 className="font-display text-2xl font-bold text-dark mb-3">Analyzing</h3>

                            <div className="h-6 relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={scanStep}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-sm font-medium text-dark/60 absolute w-full"
                                    >
                                        {STEPS[scanStep]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="font-display text-4xl font-bold text-dark flex items-center justify-center gap-3">
                        <ClipboardText size={36} color="#A79277" variant="Bulk" />
                        Analysis Dashboard
                    </h1>
                    <p className="text-dark/50 mt-3 text-lg">
                        Upload your paper to check for plagiarism and AI-generated content.
                    </p>
                </div>

                {/* Upload Section */}
                <UploadBox onAnalyze={handleAnalyze} loading={loading} />

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center gap-2 max-w-2xl mx-auto"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
