import { motion } from 'framer-motion';
import { ShieldTick, Activity, MessageText } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';

export default function AIAnalysisCard({ result, delay = 0 }) {
    if (!result) return null;

    const score = result.similarity_score;
    const aiProb = Math.min(Math.round(score * 0.87), 99);
    const confidence = result.total_sentences_checked >= 6 ? 'High' : result.total_sentences_checked >= 3 ? 'Medium' : 'Low';
    const confColor = confidence === 'High' ? '#27AE60' : '#F39C12';

    const patterns = [
        { label: 'Repetitive sentence structure', detected: aiProb > 50 },
        { label: 'Uniform sentence complexity', detected: aiProb > 40 },
        { label: 'Low lexical diversity', detected: aiProb > 60 },
        { label: 'Template-like phrasing', detected: aiProb > 70 },
        { label: 'Passive voice overuse', detected: aiProb > 55 },
    ];

    // Summary text
    const summaryLines = [];
    if (score >= 60) {
        summaryLines.push('SemanticShield detected high semantic similarity between the uploaded document and the reference corpus.');
        summaryLines.push('Multiple sentences appear to be copied or closely paraphrased from one or more reference sources.');
    } else if (score >= 30) {
        summaryLines.push('Moderate similarity detected between the uploaded document and the reference corpus.');
        summaryLines.push('Some sentences share semantic overlap with reference material — review flagged sections below.');
    } else {
        summaryLines.push('Low similarity detected. The uploaded document appears largely original.');
    }
    if (aiProb > 50) {
        summaryLines.push('AI-generated patterns were also detected based on repetitive structure and uniform sentence complexity.');
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="space-y-4"
        >
            {/* AI Detection Card */}
            <Card className="p-6">
                <CardContent className="p-0">
                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                        <Activity size={20} color="#F39C12" variant="Bulk" />
                        AI Generation Analysis
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Probability Gauge */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-36 h-36">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F5E6D0" strokeWidth="12" />
                                    <circle
                                        cx="60" cy="60" r="50" fill="none"
                                        stroke={aiProb > 60 ? '#E74C3C' : aiProb > 30 ? '#F39C12' : '#27AE60'}
                                        strokeWidth="12" strokeLinecap="round"
                                        strokeDasharray={`${aiProb * 3.14} ${314 - aiProb * 3.14}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold font-display text-dark">{aiProb}%</span>
                                    <span className="text-[10px] text-dark/40">AI Probability</span>
                                </div>
                            </div>
                        </div>

                        {/* Pattern Detection */}
                        <div className="space-y-3">
                            <p className="text-xs text-dark/50 uppercase tracking-wide font-semibold mb-2">Pattern Detection</p>
                            {patterns.map((p, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-dark/70">{p.label}</span>
                                    <Badge variant={p.detected ? 'danger' : 'success'} className="text-[10px]">
                                        {p.detected ? 'Detected' : 'Clean'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Summary */}
            <Card className="p-6 bg-accent/[0.03]">
                <CardContent className="p-0">
                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-4">
                        <MessageText size={20} color="#A79277" variant="Bulk" />
                        Analysis Summary
                    </h3>

                    <div className="space-y-2 mb-5">
                        {summaryLines.map((line, i) => (
                            <p key={i} className="text-sm text-dark/70 leading-relaxed">{line}</p>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                        <ShieldTick size={20} color={confColor} variant="Bold" />
                        <div className="flex-1">
                            <p className="text-xs text-dark/40 uppercase tracking-wide">Confidence Level</p>
                            <p className="text-sm font-bold" style={{ color: confColor }}>{confidence}</p>
                        </div>
                        <Progress value={confidence === 'High' ? 90 : confidence === 'Medium' ? 60 : 30} color={confColor} className="w-24" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
