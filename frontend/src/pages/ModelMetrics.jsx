import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, TickCircle, Chart, Danger, ShieldTick, Activity } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const API_URL = 'http://localhost:8000';

const CLASS_LABELS = ['Original', 'Paraphrased', 'Plagiarized'];

const classVariant = (label) => {
    if (label === 'Original') return 'success';
    if (label === 'Paraphrased') return 'warning';
    return 'danger';
};

// ── Metric Score Cards ──────────────────────────────────────────────
function MetricCards({ metrics, delay = 0 }) {
    if (!metrics) return null;

    const cards = [
        {
            key: 'accuracy',
            label: 'Accuracy',
            value: metrics.accuracy,
            color: '#27AE60',
            bg: 'bg-success/5',
            icon: ShieldTick,
        },
        {
            key: 'precision',
            label: 'Precision',
            value: metrics.precision,
            color: '#A79277',
            bg: 'bg-accent/5',
            icon: Chart,
        },
        {
            key: 'recall',
            label: 'Recall',
            value: metrics.recall,
            color: '#F39C12',
            bg: 'bg-warning/5',
            icon: Activity,
        },
        {
            key: 'f1',
            label: 'F1 Score',
            value: metrics.f1,
            color: metrics.f1 >= 0.7 ? '#27AE60' : '#E74C3C',
            bg: metrics.f1 >= 0.7 ? 'bg-success/5' : 'bg-danger/5',
            icon: Danger,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c, i) => {
                const Icon = c.icon;
                return (
                    <motion.div
                        key={c.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: delay + i * 0.1 }}
                    >
                        <Card className={`p-5 ${c.bg} border-none hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                                    <Icon size={20} color={c.color} variant="Bulk" />
                                </div>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.color }} />
                            </div>
                            <p className="text-xs text-dark/50 font-medium uppercase tracking-wide">{c.label}</p>
                            <p className="text-2xl font-display font-bold mt-1" style={{ color: c.color }}>
                                {(c.value * 100).toFixed(1)}%
                            </p>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ── Confusion Matrix ────────────────────────────────────────────────
function ConfusionMatrix({ matrix, delay = 0 }) {
    if (!matrix || matrix.length === 0) return null;

    const maxVal = Math.max(...matrix.flat(), 1);

    const cellColor = (row, col, val) => {
        if (row === col) {
            const intensity = Math.round(40 + (val / maxVal) * 60);
            return `rgba(39, 174, 96, ${intensity / 100})`;
        }
        if (val === 0) return 'rgba(231, 76, 60, 0.05)';
        const intensity = Math.round(15 + (val / maxVal) * 55);
        return `rgba(231, 76, 60, ${intensity / 100})`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className="p-6">
                <CardContent className="p-0">
                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                        <Chart size={20} color="#A79277" variant="Bulk" />
                        Confusion Matrix
                    </h3>

                    <div className="flex items-center justify-center">
                        <div className="relative">
                            {/* Y-axis label */}
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] text-dark/40 font-semibold uppercase tracking-wide whitespace-nowrap">
                                Actual
                            </div>

                            <div className="ml-2">
                                {/* X-axis header */}
                                <div className="flex mb-2 ml-24">
                                    {CLASS_LABELS.map((label) => (
                                        <div key={label} className="w-24 text-center text-[11px] text-dark/40 font-semibold uppercase tracking-wide">
                                            {label}
                                        </div>
                                    ))}
                                </div>

                                {/* X-axis top label */}
                                <div className="text-center text-[11px] text-dark/40 font-semibold uppercase tracking-wide mb-3 ml-24">
                                    Predicted
                                </div>

                                {/* Matrix rows */}
                                {matrix.map((row, ri) => (
                                    <div key={ri} className="flex items-center mb-2">
                                        <div className="w-24 text-right pr-3 text-[11px] text-dark/50 font-medium">
                                            {CLASS_LABELS[ri]}
                                        </div>
                                        {row.map((val, ci) => (
                                            <motion.div
                                                key={ci}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ duration: 0.3, delay: delay + (ri * 3 + ci) * 0.05 }}
                                                className="w-24 h-20 flex items-center justify-center rounded-xl mx-0.5 transition-all duration-300 hover:scale-105"
                                                style={{ backgroundColor: cellColor(ri, ci, val) }}
                                            >
                                                <span className={`text-lg font-display font-bold ${ri === ci ? 'text-white' : 'text-dark/70'}`}>
                                                    {val}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-5 text-[11px] text-dark/50">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-success/60" /> Correct Predictions
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-danger/30" /> Misclassifications
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ── ROC AUC Gauge ───────────────────────────────────────────────────
function RocAucGauge({ value, delay = 0 }) {
    if (value == null) return null;

    const pct = Math.round(value * 100);
    const gaugeColor = pct >= 90 ? '#27AE60' : pct >= 75 ? '#F39C12' : '#E74C3C';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className="p-6">
                <CardContent className="p-0">
                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                        <Activity size={20} color="#F39C12" variant="Bulk" />
                        ROC AUC Score
                    </h3>

                    <div className="flex flex-col items-center">
                        <div className="relative w-36 h-36">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#F5E6D0" strokeWidth="12" />
                                <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={gaugeColor}
                                    strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray={`${pct * 3.14} ${314 - pct * 3.14}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold font-display text-dark">{pct}%</span>
                                <span className="text-[10px] text-dark/40">AUC Score</span>
                            </div>
                        </div>

                        <p className="text-sm text-dark/50 mt-3 text-center max-w-[200px]">
                            {pct >= 90
                                ? 'Excellent discrimination capability'
                                : pct >= 75
                                    ? 'Good model performance'
                                    : 'Model needs improvement'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ── Sentence Prediction Table ───────────────────────────────────────
function SentencePredictionTable({ delay = 0 }) {
    const [sentences, setSentences] = useState([]);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('lastResult');
            if (!raw) return;
            const result = JSON.parse(raw);
            let items = [];
            if (result.plagiarized_sentences?.length > 0) {
                items = result.plagiarized_sentences;
            } else if (result.heatmap_data) {
                items = result.heatmap_data.map((row) => {
                    const maxSim = Math.max(...row.similarities);
                    return {
                        index: row.check_index,
                        sentence: row.check_sentence,
                        similarity: maxSim,
                    };
                });
            }
            // Derive classification from similarity for display
            items = items.map((s) => ({
                ...s,
                classification: s.classification || (s.similarity >= 80 ? 'Plagiarized' : s.similarity >= 50 ? 'Paraphrased' : 'Original'),
                confidence: s.confidence ?? (s.similarity >= 80 ? 92 : s.similarity >= 50 ? 75 : 95),
            }));
            setSentences(items);
        } catch { /* ignore */ }
    }, []);

    if (sentences.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className="p-6">
                <CardContent className="p-0">
                    <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2 mb-5">
                        <Danger size={20} color="#A79277" variant="Bulk" />
                        Sentence Predictions
                    </h3>

                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_90px_120px_90px] gap-4 px-4 py-2 text-[11px] font-semibold text-dark/40 uppercase tracking-wide border-b border-accent/10">
                        <span>Sentence</span>
                        <span className="text-center">Similarity</span>
                        <span className="text-center">Classification</span>
                        <span className="text-center">Confidence</span>
                    </div>

                    {/* Table Rows */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-accent/5">
                        {sentences.map((s, i) => (
                            <motion.div
                                key={`pred-${s.index ?? i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: delay + i * 0.03 }}
                                className="grid grid-cols-[1fr_90px_120px_90px] gap-4 px-4 py-3 items-center transition-colors hover:bg-accent/[0.03]"
                            >
                                <div className="text-sm text-dark leading-relaxed">
                                    <p className="line-clamp-2">
                                        <span className="text-dark/30 font-mono text-xs mr-2">#{(s.index ?? i) + 1}</span>
                                        {s.sentence || s.text}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <span
                                        className="text-sm font-bold font-display"
                                        style={{ color: s.similarity >= 80 ? '#E74C3C' : s.similarity >= 50 ? '#F39C12' : '#27AE60' }}
                                    >
                                        {s.similarity}%
                                    </span>
                                </div>
                                <div className="text-center">
                                    <Badge variant={classVariant(s.classification)} className="text-[10px]">
                                        {s.classification}
                                    </Badge>
                                </div>
                                <div className="text-center text-xs font-medium text-dark/60">
                                    {s.confidence}%
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ── Empty State ─────────────────────────────────────────────────────
function EmptyState({ onTrain, training }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20"
        >
            <div className="w-24 h-24 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center mb-6">
                <Cpu size={40} color="#A79277" variant="Bulk" className="animate-pulse" />
            </div>
            <h2 className="font-display text-2xl font-bold text-dark mb-2">No Metrics Yet</h2>
            <p className="text-dark/50 text-center max-w-md mb-8">
                Train and evaluate your model to see performance metrics including accuracy, precision, recall, confusion matrix, and more.
            </p>
            <Button onClick={onTrain} disabled={training}>
                {training ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Training…
                    </>
                ) : (
                    <>
                        <Cpu size={18} />
                        Train Model
                    </>
                )}
            </Button>
        </motion.div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function ModelMetrics() {
    const [metrics, setMetrics] = useState(() => {
        try {
            const stored = sessionStorage.getItem('modelMetrics');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    const [training, setTraining] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [trainDone, setTrainDone] = useState(false);
    const [evalDone, setEvalDone] = useState(false);
    const [error, setError] = useState(null);

    // Persist metrics to sessionStorage
    useEffect(() => {
        if (metrics) {
            sessionStorage.setItem('modelMetrics', JSON.stringify(metrics));
        }
    }, [metrics]);

    const handleTrain = async () => {
        setTraining(true);
        setTrainDone(false);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/train`);
            setTrainDone(true);
            // If the train endpoint returns metrics, store them
            if (res.data?.accuracy != null) {
                setMetrics(res.data);
            }
            setTimeout(() => setTrainDone(false), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Training failed. Please try again.');
        } finally {
            setTraining(false);
        }
    };

    const handleEvaluate = async () => {
        setEvaluating(true);
        setEvalDone(false);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/evaluate`);
            setMetrics(res.data);
            setEvalDone(true);
            setTimeout(() => setEvalDone(false), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Evaluation failed. Please try again.');
        } finally {
            setEvaluating(false);
        }
    };

    const hasMetrics = metrics && metrics.accuracy != null;

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <h1 className="font-display text-4xl font-bold text-dark flex items-center justify-center gap-3">
                        <Cpu size={36} color="#A79277" variant="Bulk" />
                        Model Performance
                    </h1>
                    <p className="text-dark/50 mt-3 text-lg">
                        Train, evaluate, and monitor your ML classification model.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-wrap items-center justify-center gap-4 mb-8"
                >
                    <Button onClick={handleTrain} disabled={training || evaluating}>
                        <AnimatePresence mode="wait">
                            {training ? (
                                <motion.div
                                    key="spinner"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                    Training…
                                </motion.div>
                            ) : trainDone ? (
                                <motion.div
                                    key="done"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <TickCircle size={18} color="#fff" variant="Bold" />
                                    Trained!
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <Cpu size={18} />
                                    Train Model
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>

                    <Button variant="secondary" onClick={handleEvaluate} disabled={training || evaluating}>
                        <AnimatePresence mode="wait">
                            {evaluating ? (
                                <motion.div
                                    key="spinner"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full"
                                    />
                                    Evaluating…
                                </motion.div>
                            ) : evalDone ? (
                                <motion.div
                                    key="done"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <TickCircle size={18} color="#27AE60" variant="Bold" />
                                    Evaluated!
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <Chart size={18} />
                                    Evaluate Model
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center gap-2 max-w-2xl mx-auto"
                        >
                            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                {!hasMetrics ? (
                    <EmptyState onTrain={handleTrain} training={training} />
                ) : (
                    <div className="space-y-6">
                        {/* Score Cards */}
                        <MetricCards metrics={metrics} delay={0.2} />

                        {/* Confusion Matrix + ROC AUC side by side */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <ConfusionMatrix matrix={metrics.confusion_matrix} delay={0.4} />
                            </div>
                            <div>
                                <RocAucGauge value={metrics.roc_auc} delay={0.5} />
                            </div>
                        </div>

                        {/* Sentence Prediction Table */}
                        <SentencePredictionTable delay={0.6} />
                    </div>
                )}
            </div>
        </div>
    );
}
