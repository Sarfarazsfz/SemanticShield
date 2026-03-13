import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, DocumentText, Chart, ShieldTick, TickCircle } from 'iconsax-react';

const STEPS = [
    { icon: DocumentText, label: 'Document Uploaded', detail: 'Parsing 847 words...', color: '#A79277' },
    { icon: Scan, label: 'Scanning Text', detail: 'Analyzing 24 sentences...', color: '#A79277' },
    { icon: Chart, label: 'Computing Similarity', detail: 'Generating embeddings...', color: '#F39C12' },
    { icon: ShieldTick, label: 'AI Detection', detail: 'Checking generation patterns...', color: '#A79277' },
    { icon: TickCircle, label: 'Report Ready', detail: 'Analysis complete', color: '#27AE60' },
];

function AnimatedCounter({ target, duration = 1200, suffix = '%' }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
    }, [target, duration]);
    return <>{count}{suffix}</>;
}

export default function HeroDemoVideo() {
    const [step, setStep] = useState(0);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const timers = [];
        timers.push(setTimeout(() => setStep(1), 1500));
        timers.push(setTimeout(() => setStep(2), 3200));
        timers.push(setTimeout(() => setStep(3), 5000));
        timers.push(setTimeout(() => setStep(4), 6500));
        timers.push(setTimeout(() => { setShowResults(true); }, 7500));

        // Loop
        timers.push(setTimeout(() => {
            setStep(0);
            setShowResults(false);
        }, 12000));

        const loop = setInterval(() => {
            setStep(0); setShowResults(false);
            setTimeout(() => setStep(1), 1500);
            setTimeout(() => setStep(2), 3200);
            setTimeout(() => setStep(3), 5000);
            setTimeout(() => setStep(4), 6500);
            setTimeout(() => setShowResults(true), 7500);
        }, 12000);

        return () => { timers.forEach(clearTimeout); clearInterval(loop); };
    }, []);

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Mock Interface */}
            <div className="rounded-2xl bg-white shadow-glass-lg border border-accent/10 overflow-hidden">
                {/* Title Bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-dark/30 border-b border-accent/10">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                    </div>
                    <span className="text-[10px] text-dark/40 font-mono ml-2">semanticshield.ai/analyze</span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 min-h-[320px]">
                    {/* Step Indicators */}
                    <div className="space-y-2.5">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = step >= i;
                            const isCurrent = step === i;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{
                                        opacity: isActive ? 1 : 0.3,
                                        x: isActive ? 0 : -10,
                                    }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${isCurrent ? 'bg-accent/5 ring-1 ring-accent/20' : ''
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive ? 'shadow-sm' : ''
                                            }`}
                                        style={{ backgroundColor: isActive ? `${s.color}15` : '#F5E6D0' }}
                                    >
                                        <Icon size={16} color={isActive ? s.color : '#ccc'} variant={isActive ? "Bold" : "Linear"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-dark' : 'text-dark/30'}`}>
                                            {s.label}
                                        </p>
                                        <p className="text-[10px] text-dark/40 truncate">{s.detail}</p>
                                    </div>
                                    {isActive && !isCurrent && (
                                        <TickCircle size={14} color="#27AE60" variant="Bold" />
                                    )}
                                    {isCurrent && (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Results Panel */}
                    <AnimatePresence>
                        {showResults && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="rounded-xl bg-gradient-to-br from-accent/5 to-primary-dark/30 p-4 border border-accent/15"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-[10px] text-dark/40 uppercase tracking-wide">Plagiarism</p>
                                        <p className="text-xl font-display font-bold text-danger">
                                            <AnimatedCounter target={82} />
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-[10px] text-dark/40 uppercase tracking-wide">AI Generated</p>
                                        <p className="text-xl font-display font-bold text-warning">
                                            <AnimatedCounter target={71} />
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-[10px] text-dark/40 uppercase tracking-wide">Similarity</p>
                                        <p className="text-xl font-display font-bold text-accent">
                                            <AnimatedCounter target={84} suffix="" />
                                            <span className="text-sm text-dark/40 ml-0.5">%</span>
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-[10px] text-dark/40 uppercase tracking-wide">Confidence</p>
                                        <p className="text-lg font-display font-bold text-success">High</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 bg-white rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-success via-warning to-danger rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: '82%' }}
                                            transition={{ duration: 1.2, delay: 0.3 }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-dark/50 font-semibold">82%</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/10 to-transparent rounded-3xl blur-2xl -z-10" />
        </div>
    );
}
