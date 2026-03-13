import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Chart, Warning2, TickCircle, Danger, Folder2 } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function AnimatedScore({ score }) {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayScore(Math.round(eased * score));
            if (progress < 1) requestAnimationFrame(animate);
        };

        animate();
    }, [score]);

    const getColor = () => {
        if (score < 30) return '#27AE60';
        if (score < 60) return '#F39C12';
        return '#E74C3C';
    };

    const getLabel = () => {
        if (score < 30) return 'Low Risk';
        if (score < 60) return 'Moderate Risk';
        return 'High Risk';
    };

    const getBadgeVariant = () => {
        if (score < 30) return 'success';
        if (score < 60) return 'warning';
        return 'danger';
    };

    const circumference = 2 * Math.PI * 52;
    const strokeDashoffset = circumference - (displayScore / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#F5E6D0" strokeWidth="10" />
                    <motion.circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={getColor()}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-display" style={{ color: getColor() }}>
                        {displayScore}%
                    </span>
                </div>
            </div>
            <Badge variant={getBadgeVariant()} className="mt-2 px-3 py-1 text-sm">
                {getLabel()}
            </Badge>
        </div>
    );
}

export default function ResultCard({ result }) {
    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="p-6">
                <CardContent className="p-0">
                    <h3 className="font-display text-xl font-bold text-dark mb-6 flex items-center gap-2.5">
                        <Chart size={22} color="#A79277" variant="Bulk" />
                        Analysis Results
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score Circle */}
                        <div className="flex justify-center">
                            <AnimatedScore score={result.similarity_score} />
                        </div>

                        {/* Stats */}
                        <div className="space-y-4">
                            <div className="bg-primary/50 rounded-xl p-4">
                                <p className="text-xs text-dark/50 uppercase tracking-wide mb-1">Sentences Checked</p>
                                <p className="text-2xl font-bold text-dark">{result.total_sentences_checked}</p>
                            </div>
                            <div className="bg-primary/50 rounded-xl p-4">
                                <p className="text-xs text-dark/50 uppercase tracking-wide mb-1">Source Sentences</p>
                                <p className="text-2xl font-bold text-dark">{result.total_source_sentences}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                                <p className="text-xs text-danger/70 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                    <Danger size={14} variant="Linear" />
                                    Flagged Sentences
                                </p>
                                <p className="text-2xl font-bold text-danger">{result.flagged_count}</p>
                            </div>
                            <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                                <p className="text-xs text-success/70 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                    <TickCircle size={14} variant="Linear" />
                                    Clean Sentences
                                </p>
                                <p className="text-2xl font-bold text-success">
                                    {result.total_sentences_checked - result.flagged_count}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section Analysis */}
                    {result.section_analysis && result.section_analysis.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-dark/70 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Folder2 size={16} color="#A79277" variant="Linear" />
                                Section Analysis
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {result.section_analysis.map((section, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                    >
                                        <Card className="p-4">
                                            <p className="text-sm font-semibold text-dark">{section.section}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 bg-primary-dark rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                section.similarity < 30 ? '#27AE60' :
                                                                    section.similarity < 60 ? '#F39C12' : '#E74C3C',
                                                        }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(section.similarity, 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                                    />
                                                </div>
                                                <Badge
                                                    variant={section.similarity < 30 ? 'success' : section.similarity < 60 ? 'warning' : 'danger'}
                                                >
                                                    {section.similarity}%
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-dark/40 mt-1">
                                                {section.flagged_sentences}/{section.total_sentences} sentences flagged
                                            </p>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Flagged Sentences */}
                    {result.plagiarized_sentences && result.plagiarized_sentences.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-dark/70 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Warning2 size={16} color="#E74C3C" variant="Linear" />
                                Flagged Sentences
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {result.plagiarized_sentences.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.08 }}
                                        className="plagiarized-highlight"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm text-dark font-medium">
                                                    <span className="text-danger font-bold mr-2">#{item.index + 1}</span>
                                                    {item.sentence}
                                                </p>
                                                {item.matched_source && (
                                                    <p className="text-xs text-dark/50 mt-1 italic">
                                                        Matches: "{item.matched_source}"
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="danger" className="shrink-0">
                                                {item.similarity}%
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
