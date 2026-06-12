import { motion } from 'framer-motion';
import { Chart, Danger, ShieldTick, Activity } from 'iconsax-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const allScoreMetrics = [
    {
        key: 'plagiarism',
        label: 'Plagiarism Score',
        icon: Danger,
        getValue: (r) => `${r.similarity_score ?? r.plagiarism_score ?? 0}%`,
        getColor: (r) => {
            const s = r.similarity_score ?? r.plagiarism_score ?? 0;
            return s > 60 ? '#E74C3C' : s > 30 ? '#F39C12' : '#27AE60';
        },
        getBg: (r) => {
            const s = r.similarity_score ?? r.plagiarism_score ?? 0;
            return s > 60 ? 'bg-danger/5' : s > 30 ? 'bg-warning/5' : 'bg-success/5';
        },
    },
    {
        key: 'ai',
        label: 'AI Generated Probability',
        icon: Activity,
        getValue: (r) => {
            // Prefer the server-computed field; fall back to the heuristic
            const ai = r.ai_generated_probability != null
                ? Math.round(r.ai_generated_probability)
                : Math.min(Math.round((r.similarity_score ?? 0) * 0.87), 99);
            return `${ai}%`;
        },
        getColor: (r) => {
            const ai = r.ai_generated_probability != null
                ? Math.round(r.ai_generated_probability)
                : Math.min(Math.round((r.similarity_score ?? 0) * 0.87), 99);
            return ai > 60 ? '#E74C3C' : ai > 30 ? '#F39C12' : '#27AE60';
        },
        getBg: (r) => {
            const ai = r.ai_generated_probability != null
                ? Math.round(r.ai_generated_probability)
                : Math.min(Math.round((r.similarity_score ?? 0) * 0.87), 99);
            return ai > 60 ? 'bg-danger/5' : ai > 30 ? 'bg-warning/5' : 'bg-success/5';
        },
    },
    {
        key: 'similarity',
        label: 'Semantic Similarity',
        icon: Chart,
        getValue: (r) => (r.semantic_similarity ?? (r.similarity_score / 100)).toFixed(2),
        getColor: () => '#A79277',
        getBg: () => 'bg-accent/5',
    },
    {
        key: 'confidence',
        label: 'Confidence Level',
        icon: ShieldTick,
        getValue: (r) => {
            if (r.total_sentences_checked >= 6) return 'High';
            if (r.total_sentences_checked >= 3) return 'Medium';
            return 'Low';
        },
        getColor: (r) => r.total_sentences_checked >= 6 ? '#27AE60' : '#F39C12',
        getBg: (r) => r.total_sentences_checked >= 6 ? 'bg-success/5' : 'bg-warning/5',
    },
];

export default function ScoreCards({ result, delay = 0 }) {
    if (!result) return null;

    const scoreMetrics = allScoreMetrics;
    const gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

    const modelAcc = result.model_metrics?.accuracy;

    return (
        <div className={`grid ${gridCols} gap-4`}>
            {scoreMetrics.map((metric, i) => {
                const Icon = metric.icon;
                const color = metric.getColor(result);
                const bg = metric.getBg(result);
                return (
                    <motion.div
                        key={metric.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: delay + i * 0.1 }}
                    >
                        <Card className={`p-5 ${bg} border-none hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                                    <Icon size={20} color={color} variant="Bulk" />
                                </div>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                            </div>
                            <p className="text-xs text-dark/50 font-medium uppercase tracking-wide">{metric.label}</p>
                            <p className="text-2xl font-display font-bold mt-1" style={{ color }}>
                                {metric.getValue(result)}
                            </p>
                            {metric.key === 'confidence' && modelAcc != null && (
                                <Badge variant="default" className="text-[9px] mt-2 px-2 py-0.5">
                                    RF Model: {Math.round(modelAcc * 100)}% acc
                                </Badge>
                            )}
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
