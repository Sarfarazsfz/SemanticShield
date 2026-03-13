import React, { Fragment } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Candle2 } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/Card';

const getColor = (v) => v < 30 ? '#27AE60' : v < 60 ? '#F39C12' : '#E74C3C';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white rounded-xl p-3 shadow-glass-lg border border-accent/10 text-sm max-w-xs">
            <p className="font-semibold text-dark mb-1">Sentence #{d.index + 1}</p>
            <p className="text-dark/60 text-xs mb-1.5 line-clamp-2">{d.fullSentence}</p>
            <p className="font-bold" style={{ color: getColor(d.similarity) }}>{d.similarity}% similar</p>
        </div>
    );
};

export default function SimilarityHeatmap({ result, delay = 0 }) {
    if (!result?.heatmap_data?.length) return null;

    const chartData = result.heatmap_data.map((row) => ({
        index: row.check_index,
        name: `S${row.check_index + 1}`,
        similarity: Math.max(...row.similarities),
        fullSentence: row.check_sentence,
    }));

    // Distribution for pie chart
    const dist = { low: 0, mid: 0, high: 0 };
    chartData.forEach(d => {
        if (d.similarity < 30) dist.low++;
        else if (d.similarity < 60) dist.mid++;
        else dist.high++;
    });
    const pieData = [
        { name: 'Original', value: dist.low, fill: '#27AE60' },
        { name: 'Paraphrased', value: dist.mid, fill: '#F39C12' },
        { name: 'Plagiarized', value: dist.high, fill: '#E74C3C' },
    ].filter(d => d.value > 0);

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
                            <Candle2 size={20} color="#A79277" variant="Bulk" />
                            Similarity Distribution
                        </h3>
                        <div className="flex items-center gap-4 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success" /> Original</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning" /> Paraphrased</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-danger" /> Plagiarized</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart */}
                        <div className="lg:col-span-2" style={{ width: '100%', height: 256 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                    <XAxis
                                        dataKey="name" tick={{ fontSize: 10, fill: '#3A3A3A60' }}
                                        tickLine={false} axisLine={{ stroke: '#A7927720' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]} tick={{ fontSize: 10, fill: '#3A3A3A60' }}
                                        tickLine={false} axisLine={{ stroke: '#A7927720' }}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#A7927708' }} />
                                    <Bar dataKey="similarity" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                        {chartData.map((entry) => (
                                            <Cell key={`bar-${entry.name}`} fill={getColor(entry.similarity)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie Chart */}
                        <div className="flex flex-col items-center justify-center">
                            <div style={{ width: 160, height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData} cx="50%" cy="50%"
                                            innerRadius={40} outerRadius={65}
                                            paddingAngle={4} dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry) => (
                                                <Cell key={`pie-${entry.name}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 space-y-1">
                                {pieData.map((d) => (
                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                                        <span className="text-dark/60">{d.name}: <strong className="text-dark">{d.value}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Grid */}
                    {result.heatmap_data.length <= 20 && (
                        <div className="mt-6">
                            <h4 className="text-xs font-semibold text-dark/50 uppercase tracking-wide mb-3">
                                Pairwise Similarity Matrix
                            </h4>
                            <div className="overflow-x-auto pb-2">
                                <div className="inline-grid gap-[3px]" style={{
                                    gridTemplateColumns: `40px repeat(${result.total_source_sentences}, minmax(28px, 1fr))`
                                }}>
                                    <div className="text-[9px] text-dark/30 p-1" />
                                    {Array.from({ length: result.total_source_sentences }, (_, i) => (
                                        <div key={`s-${i}`} className="text-[9px] text-dark/40 text-center p-1 font-semibold">S{i + 1}</div>
                                    ))}
                                    {result.heatmap_data.map((row) => (
                                        <Fragment key={`row-${row.check_index}`}>
                                            <div className="text-[9px] text-dark/50 p-1 font-semibold flex items-center">C{row.check_index + 1}</div>
                                            {row.similarities.map((sim, j) => (
                                                <div
                                                    key={`${row.check_index}-${j}`}
                                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[8px] font-bold cursor-default hover:scale-110 transition-transform"
                                                    style={{
                                                        backgroundColor: sim < 30 ? `rgba(39,174,96,${sim / 100 + 0.1})` :
                                                            sim < 60 ? `rgba(243,156,18,${sim / 100 + 0.1})` : `rgba(231,76,60,${sim / 100 + 0.1})`,
                                                        color: sim > 50 ? '#fff' : '#3A3A3A',
                                                    }}
                                                    title={`Check ${row.check_index + 1} vs Source ${j + 1}: ${sim}%`}
                                                >{sim}</div>
                                            ))}
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[10px] text-dark/30 mt-1">C = Checked sentences · S = Source sentences · Values = similarity %</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
