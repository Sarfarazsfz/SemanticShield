
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DocumentCopy,
    Chart2,
    Grid5,
    DocumentText,
    Printer,
    ArrowLeft
} from 'iconsax-react';
import { Link, useNavigate } from 'react-router-dom';

import ScoreCards from './ScoreCards';
import RecommendationBanner from './RecommendationBanner';
import SentenceBreakdown from './SentenceBreakdown';
import SimilarityHeatmap from './SimilarityHeatmap';
import ErrorBoundary from './ErrorBoundary';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ReportDashboard({ result: resultProp }) {

    const [result, setResult] = useState(null);
    const [stage, setStage] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {

        let analysisResult = null;

        if (resultProp) {
            analysisResult = resultProp;
        } else {

            const savedResult = sessionStorage.getItem('lastResult');

            if (!savedResult) {
                navigate('/dashboard');
                return;
            }

            try {
                analysisResult = JSON.parse(savedResult);
            } catch (error) {
                console.error('Invalid session data:', error);
                sessionStorage.removeItem('lastResult');
                navigate('/dashboard');
                return;
            }
        }

        if (!analysisResult) {
            navigate('/dashboard');
            return;
        }

        setResult(analysisResult);

        const t1 = setTimeout(() => setStage(1), 300);
        const t2 = setTimeout(() => setStage(2), 800);
        const t3 = setTimeout(() => setStage(3), 1200);
        const t4 = setTimeout(() => setStage(4), 1600);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };

    }, [navigate, resultProp]);

    if (!result) {
        return (
            <div className="py-20 text-center text-dark/50">
                No analysis results found. Please run an analysis first.

                <div className="mt-4">
                    <Link to="/dashboard">
                        <Button>
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

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
                            <Chart2
                                size={32}
                                color="#A79277"
                                variant="Bulk"
                            />
                            Analysis Report
                        </h2>

                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-dark/50">
                                Detailed breakdown of semantic similarity,
                                plagiarism, and AI-generated content.
                            </p>

                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent-dark border border-accent/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                Single Document Mode
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 no-print items-center">

                        <div className="hidden sm:flex bg-white px-4 py-2 rounded-xl shadow-sm border border-accent/10">
                            <span className="text-dark/40 mr-2">
                                Checked:
                            </span>

                            <strong className="text-dark">
                                {result.total_sentences_checked || 0} sentences
                            </strong>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.print()}
                            className="gap-2"
                        >
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

                {stage >= 1 && (
                    <ScoreCards result={result} />
                )}

                <AnimatePresence>
                    {stage >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <RecommendationBanner
                                score={result.similarity_score || 0}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {stage >= 2 &&
                        result.section_analysis &&
                        result.section_analysis.length > 0 && (

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="p-6">
                                <CardContent className="p-0">

                                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                                        <Grid5
                                            size={20}
                                            color="#A79277"
                                            variant="Bulk"
                                        />
                                        Section-Wise Analysis
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                                        {result.section_analysis.map((sec) => (

                                            <div
                                                key={sec.section}
                                                className="bg-accent/5 rounded-xl p-4 border border-accent/10"
                                            >
                                                <p className="text-xs font-semibold text-dark/50 uppercase mb-1">
                                                    {sec.section}
                                                </p>

                                                <div className="flex items-end justify-between">

                                                    <span className="text-xl font-bold">
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

                {stage >= 3 && (
                    <SimilarityHeatmap result={result} />
                )}

                {stage >= 4 && (
                    <SentenceBreakdown result={result} />
                )}

            </div>

        </ErrorBoundary>
    );
}

