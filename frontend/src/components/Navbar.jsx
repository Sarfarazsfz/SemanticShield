import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SecuritySafe, HambergerMenu, CloseSquare } from 'iconsax-react';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/model', label: 'Model' },
        { path: '/report', label: 'Report' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-accent/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-hover flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                            <SecuritySafe size={20} color="#fff" variant="Bold" />
                        </div>
                        <span className="font-display text-xl font-bold text-dark">
                            Semantic<span className="text-accent">Shield</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ path, label }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(path)
                                        ? 'bg-accent text-white shadow-md'
                                        : 'text-dark/70 hover:text-dark hover:bg-accent/10'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? (
                            <CloseSquare size={24} color="#3A3A3A" variant="Linear" />
                        ) : (
                            <HambergerMenu size={24} color="#3A3A3A" variant="Linear" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white/90 backdrop-blur-xl border-b border-accent/10"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {navLinks.map(({ path, label }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(path)
                                            ? 'bg-accent text-white'
                                            : 'text-dark/70 hover:bg-accent/10'
                                        }`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
