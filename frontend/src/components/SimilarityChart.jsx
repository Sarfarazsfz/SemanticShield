import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Candle2 } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/Card';

const getBarColor = (value) => {
    if (value < 30) return '#27AE60';
    if (value < 60) return '#F39C12';
    return '#E74C3C';
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <Card className="p-3 text-sm max-w-xs shadow-glass-lg">
                <p className="font-semibold text-dark mb-1">Sentence #{data.index + 1}</p>
                <p className="text-dark/70 text-xs mb-2">{data.fullSentence}</p>
                <p className="font-bold" style={{ color: getBarColor(data.similarity) }}>
                    Similarity: {data.similarity}%
                </p>
            </Card>
        );
    }
    return null;
};

export default function SimilarityChart({ result }) {
    if (!result || !result.heatmap_data || result.heatmap_data.length === 0) return null;

    const chartData = result.heatmap_data.map((row) => ({
        index: row.check_index,
        name: `S${row.check_index + 1}`,
        similarity: Math.max(...row.similarities),
        fullSentence: row.check_sentence,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <Card className="p-6">
                <CardContent className="p-0">
                    <h3 className="font-display text-xl font-bold text-dark mb-2 flex items-center gap-2.5">
                        <Candle2 size={22} color="#A79277" variant="Bulk" />
                        Semantic Heatmap
                    </h3>
                    <p className="text-sm text-dark/50 mb-6">
                        Sentence-level similarity scores — higher bars indicate more similar content.
                    </p>

                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-success" />
                            <span className="text-dark/60">Low Risk (&lt;30%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-warning" />
                            <span className="text-dark/60">Moderate (30-60%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-danger" />
                            <span className="text-dark/60">High Risk (&gt;60%)</span>
                        </div>
                    </div>

                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#3A3A3A80' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#A7927730' }}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11, fill: '#3A3A3A80' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#A7927730' }}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#A7927710' }} />
                                <Bar dataKey="similarity" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                    {chartData.map((entry, idx) => (
                                        <Cell key={idx} fill={getBarColor(entry.similarity)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Heatmap Grid */}
                    {result.heatmap_data.length <= 20 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-dark/70 uppercase tracking-wide mb-3">
                                Pairwise Similarity Matrix
                            </h4>
                            <div className="overflow-x-auto">
                                <div className="inline-grid gap-1" style={{
                                    gridTemplateColumns: `auto repeat(${result.total_source_sentences}, minmax(28px, 1fr))`
                                }}>
                                    {/* Header row */}
                                    <div className="text-xs text-dark/40 p-1" />
                                    {Array.from({ length: result.total_source_sentences }, (_, i) => (
                                        <div key={i} className="text-xs text-dark/40 text-center p-1 font-medium">
                                            S{i + 1}
                                        </div>
                                    ))}

                                    {/* Data rows */}
                                    {result.heatmap_data.map((row) => (
                                        <>
                                            <div key={`label-${row.check_index}`} className="text-xs text-dark/60 p-1 font-medium whitespace-nowrap">
                                                C{row.check_index + 1}
                                            </div>
                                            {row.similarities.map((sim, j) => (
                                                <div
                                                    key={`${row.check_index}-${j}`}
                                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold transition-transform hover:scale-110 cursor-default"
                                                    style={{
                                                        backgroundColor:
                                                            sim < 30 ? `rgba(39, 174, 96, ${sim / 100 + 0.1})` :
                                                                sim < 60 ? `rgba(243, 156, 18, ${sim / 100 + 0.1})` :
                                                                    `rgba(231, 76, 60, ${sim / 100 + 0.1})`,
                                                        color: sim > 50 ? 'white' : '#3A3A3A',
                                                    }}
                                                    title={`Check S${row.check_index + 1} vs Source S${j + 1}: ${sim}%`}
                                                >
                                                    {sim}
                                                </div>
                                            ))}
                                        </>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-dark/40 mt-2">
                                C = Check sentences (rows) · S = Source sentences (columns) · Values = similarity %
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
