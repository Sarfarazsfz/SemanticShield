import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hierarchy, Link as LinkIcon, Chart, Scan, Play, Flash } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import HeroDemoVideo from '@/components/HeroDemoVideo';

const features = [
    {
        icon: Hierarchy,
        title: 'Semantic Analysis',
        desc: 'Understands contextual meaning using transformer-based NLP instead of simple keyword matching.',
    },
    {
        icon: LinkIcon,
        title: 'Sentence Embeddings',
        desc: 'Generates high-dimensional embeddings using all-MiniLM-L6-v2 for precise similarity computation.',
    },
    {
        icon: Chart,
        title: 'Detailed Reports',
        desc: 'Provides section breakdowns, similarity heatmaps, and source matches in one comprehensive report.',
    },
];

const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* Hero Section — 2-column layout */}
            <section className="relative overflow-hidden py-16 lg:py-24">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column — Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
                                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-accent">AI-Powered Detection</span>
                            </div>

                            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark leading-tight">
                                AI-Powered Semantic
                                <br />
                                <span className="gradient-text">Plagiarism Detection</span>
                            </h1>

                            <p className="mt-6 text-lg text-dark/60 max-w-lg leading-relaxed">
                                Detect paraphrased and copied content using advanced NLP.
                                Our transformer-based engine understands <em>meaning</em>, not just words.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                                <Link to="/dashboard">
                                    <Button size="lg" className="gap-2.5">
                                        <Scan size={20} variant="Linear" />
                                        Analyze Document
                                    </Button>
                                </Link>
                                <Link to="/dashboard">
                                    <Button variant="secondary" size="lg" className="gap-2.5">
                                        <Play size={20} variant="Linear" />
                                        Try Demo
                                    </Button>
                                </Link>
                            </div>

                            {/* Stats row */}
                            <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm">
                                {[
                                    { value: '384D', label: 'Embeddings' },
                                    { value: '<1s', label: 'Analysis' },
                                    { value: '95%+', label: 'Accuracy' },
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <p className="text-2xl font-bold font-display text-accent">{stat.value}</p>
                                        <p className="text-xs text-dark/50 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right Column — Animated Demo */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="hidden lg:block"
                        >
                            <HeroDemoVideo />
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section className="py-20 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="section-heading">How It Works</h2>
                        <p className="mt-4 text-lg text-dark/50 max-w-xl mx-auto">
                            SemanticShield uses state-of-the-art NLP to catch even the most cleverly paraphrased content.
                        </p>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div key={i} variants={fadeUp}>
                                    <Card className="p-8 text-center group hover:shadow-card-hover hover:-translate-y-1">
                                        <CardContent className="p-0">
                                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Icon size={28} color="#A79277" variant="Bulk" />
                                            </div>
                                            <h3 className="font-display text-xl font-bold text-dark mb-3">{feature.title}</h3>
                                            <p className="text-sm text-dark/60 leading-relaxed">{feature.desc}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <Card className="p-8 lg:p-12 text-center bg-white/70 backdrop-blur-md border-white/30">
                            <CardContent className="p-0">
                                <h2 className="font-display text-2xl lg:text-3xl font-bold text-dark mb-4">
                                    Ready to Detect Plagiarism?
                                </h2>
                                <p className="text-dark/50 mb-8 max-w-lg mx-auto">
                                    Paste any two texts and get instant semantic similarity analysis with detailed sentence-level breakdown.
                                </p>
                                <Link to="/dashboard">
                                    <Button size="lg" className="gap-2.5">
                                        <Flash size={20} variant="Linear" />
                                        Get Started Now
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-accent/10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-dark/40">
                        © 2026 SemanticShield — Built for MLNeurothon-2K26
                    </p>
                    <p className="text-xs text-dark/30 mt-2">
                        Powered by sentence-transformers · all-MiniLM-L6-v2 · FastAPI · React
                    </p>
                </div>
            </footer>
        </div>
    );
}
