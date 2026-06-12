import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentCopy, Chart2, Grid5, DocumentText, Printer, ArrowLeft } from 'iconsax-react';
import { Link } from 'react-router-dom';
import ScoreCards from './ScoreCards';
import RecommendationBanner from './RecommendationBanner';
import SentenceBreakdown from './SentenceBreakdown';
import SimilarityHeatmap from './SimilarityHeatmap';
import ErrorBoundary from './ErrorBoundary';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ReportDashboard({ result: resultProp }) {
    const [result, setResult] = useState(null);
    const [stage, setStage] = useState(0); // For progressive reveal

    useEffect(() => {
        const stored = resultProp ?? (() => {
            const s = sessionStorage.getItem('lastResult');
            return s ? JSON.parse(s) : null;
        })();
        if (stored) {
            setResult(stored);

            // Progressive reveal stages
            setTimeout(() => setStage(1), 300); // Cards
            setTimeout(() => setStage(2), 800); // Recommendation & Sections
            setTimeout(() => setStage(3), 1200); // Charts
            setTimeout(() => setStage(4), 1600); // Sentences
        }
    }, []);

    if (!result) return (
        <div className="py-20 text-center text-dark/50">
            No analysis results found. Please run an analysis first.
            <div className="mt-4">
                <Link to="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
        </div>
    );

    return (
        <ErrorBoundary>
            <div className="w-full space-y-8 pb-12">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                    <div>
                        <h2 className="font-display text-3xl font-bold text-dark flex items-center gap-3">
                            <Chart2 size={32} color="#A79277" variant="Bulk" />
                            Analysis Report
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-dark/50">
                                Detailed breakdown of semantic similarity, plagiarism, and AI-generated content.
                            </p>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent-dark border border-accent/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                Single Document Mode
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3 no-print items-center">
                        <div className="hidden sm:flex bg-white px-4 py-2 rounded-xl shadow-sm border border-accent/10">
                            <span className="text-dark/40 mr-2">Checked:</span>
                            <strong className="text-dark">{result.total_sentences_checked} sentences</strong>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => window.print()} className="gap-2">
                            <Printer size={14} variant="Linear" />
                            Print
                        </Button>
                        <Link to="/dashboard">
                            <Button size="sm" className="gap-2">
                                <ArrowLeft size={14} variant="Linear" />
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stage 1: Core Metrics */}
                {stage >= 1 && <ScoreCards result={result} />}

                {/* Stage 2: Recommendation Banner */}
                <AnimatePresence>
                    {stage >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <RecommendationBanner score={result.similarity_score} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Section Analysis (If available) */}
                <AnimatePresence>
                    {stage >= 2 && result.section_analysis && result.section_analysis.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6">
                                <CardContent className="p-0">
                                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                                        <Grid5 size={20} color="#A79277" variant="Bulk" />
                                        Section-Wise Analysis
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {result.section_analysis.map((sec) => (
                                            <div key={sec.section} className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                                                <p className="text-xs font-semibold text-dark/50 uppercase mb-1 truncate" title={sec.section}>
                                                    {sec.section}
                                                </p>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-xl font-bold" style={{ color: sec.similarity >= 60 ? '#E74C3C' : sec.similarity >= 30 ? '#F39C12' : '#27AE60' }}>
                                                        {sec.similarity}%
                                                    </span>
                                                    <span className="text-[10px] bg-white px-2 py-1 rounded-md text-dark/60 font-medium">
                                                        {sec.flagged_sentences} flagged
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stage 3: Charts */}
                {stage >= 3 && (
                    <div className="grid grid-cols-1 gap-8">
                        <SimilarityHeatmap result={result} />
                    </div>
                )}

                {/* Stage 4: Sentence Breakdown & Sources */}
                <AnimatePresence>
                    {stage >= 4 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <SentenceBreakdown result={result} />
                            </div>

                            <div className="lg:col-span-1">
                                {/* Source Matches Detail */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full"
                                >
                                    <Card className="p-6 h-full flex flex-col max-h-[600px]">
                                        <CardContent className="p-0 text-sm flex-1 flex flex-col overflow-hidden">
                                            <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                                                <DocumentText size={20} color="#A79277" variant="Bulk" />
                                                Source Match Highlights
                                            </h3>
                                            <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                                                {result.plagiarized_sentences && result.plagiarized_sentences.length > 0 ? (
                                                    result.plagiarized_sentences.sort((a, b) => b.similarity - a.similarity).slice(0, 10).map((s) => (
                                                        <div key={s.index} className="p-4 bg-danger/[0.03] border border-danger/10 rounded-xl">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-dark/40">Sentence #{s.index + 1}</span>
                                                                <span className="font-bold text-danger text-xs">{s.similarity}%</span>
                                                            </div>
                                                            <p className="font-medium text-dark line-clamp-3 mb-3 text-sm">"{s.sentence}"</p>

                                                            {s.matched_source && (
                                                                <div className="bg-white p-2 text-xs rounded-lg border border-accent/10 flex flex-col gap-1">
                                                                    <span className="text-[9px] text-dark/40 uppercase font-semibold">Matched Source</span>
                                                                    <span className="text-dark/80 font-medium truncate" title={s.matched_source}>{s.matched_source}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12 text-dark/40 bg-accent/5 rounded-xl border border-accent/10 h-full flex flex-col items-center justify-center">
                                                        <DocumentCopy size={32} variant="Bulk" className="mx-auto mb-3 opacity-50" />
                                                        <p>No high-similarity matches found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Print styles */}
                <style>{`
            @media print {
              .no-print { display: none !important; }
              nav { display: none !important; }
              body { background: white !important; }
            }
          `}</style>
            </div>
        </ErrorBoundary>
    );
}
