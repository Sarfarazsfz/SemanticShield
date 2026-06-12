import { motion } from 'framer-motion';
import { Warning2 } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const getRowStyle = (similarity) => {
    if (similarity >= 80) return { bg: 'bg-danger/[0.03]', border: 'border-danger/15', status: 'Plagiarized', variant: 'danger' };
    if (similarity >= 50) return { bg: 'bg-warning/[0.03]', border: 'border-warning/15', status: 'Paraphrased', variant: 'warning' };
    return { bg: '', border: 'border-transparent', status: 'Original', variant: 'success' };
};

const classVariant = (label) => {
    if (label === 'Original') return 'success';
    if (label === 'Paraphrased') return 'warning';
    return 'danger';
};

export default function SentenceBreakdown({ result, delay = 0 }) {
    if (!result?.plagiarized_sentences && !result?.heatmap_data) return null;

    // Use detailed sentence data if available (from multi-doc), else fallback to heatmap max
    let sentences = [];
    if (result.plagiarized_sentences && result.plagiarized_sentences.length > 0) {
        sentences = result.plagiarized_sentences;
    } else if (result.heatmap_data) {
        sentences = result.heatmap_data.map((row) => {
            const maxSim = Math.max(...row.similarities);
            return {
                index: row.check_index,
                sentence: row.check_sentence,
                similarity: maxSim,
                matched_source: `Source Document`,
            };
        });
    }

    if (sentences.length === 0) return null;

    // Sort by similarity descending
    sentences.sort((a, b) => b.similarity - a.similarity);

    // Check if ML classification data is available
    const hasClassification = sentences.some((s) => s.classification);

    const gridCols = hasClassification
        ? 'grid-cols-[1fr_100px_160px_90px_140px]'
        : 'grid-cols-[1fr_100px_160px_90px]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className="p-6">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2">
                            <Warning2 size={20} color="#A79277" variant="Bulk" />
                            Flagged Sentences Breakdown
                        </h3>
                        <div className="flex items-center gap-4 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /> Original</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" /> Paraphrased</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger" /> Plagiarized</span>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className={`grid ${gridCols} gap-4 px-4 py-2 text-[11px] font-semibold text-dark/40 uppercase tracking-wide border-b border-accent/10`}>
                        <span>Sentence</span>
                        <span className="text-center">Similarity</span>
                        <span className="text-center">Matched Source</span>
                        <span className="text-center">Status</span>
                        {hasClassification && <span className="text-center">Classification</span>}
                    </div>

                    {/* Table Rows */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-accent/5">
                        {sentences.map((s, i) => {
                            const style = getRowStyle(s.similarity);
                            return (
                                <motion.div
                                    key={`sent-${s.index}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: delay + i * 0.03 }}
                                    className={`grid ${gridCols} gap-4 px-4 py-3 items-center ${style.bg} border-l-2 ${style.border} transition-colors hover:bg-accent/[0.03]`}
                                >
                                    <div className="text-sm text-dark leading-relaxed group">
                                        <p className="line-clamp-2 group-hover:line-clamp-none transition-all">
                                            <span className="text-dark/30 font-mono text-xs mr-2">#{s.index + 1}</span>
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
                                    <div className="text-center text-xs text-dark/60 truncate px-2" title={s.matched_source}>
                                        {s.matched_source || 'Unknown Source'}
                                    </div>
                                    <div className="text-center">
                                        <Badge variant={style.variant} className="text-[10px]">
                                            {style.status}
                                        </Badge>
                                    </div>
                                    {hasClassification && (
                                        <div className="text-center flex items-center justify-center gap-1.5">
                                            <Badge variant={classVariant(s.classification)} className="text-[10px]">
                                                {s.classification}
                                            </Badge>
                                            {s.confidence != null && (
                                                <span className="text-[10px] text-dark/40 font-medium">{s.confidence}%</span>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-4 pt-4 border-t border-accent/10 flex items-center justify-between text-xs text-dark/50">
                        <span>Showing {sentences.length} highest similarity sentences</span>
                        <span>
                            <strong className="text-danger">{sentences.filter(s => s.similarity >= 80).length}</strong> plagiarized ·{' '}
                            <strong className="text-warning">{sentences.filter(s => s.similarity >= 50 && s.similarity < 80).length}</strong> paraphrased
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

