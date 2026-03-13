import React from 'react';
import { Warning2, Refresh } from 'iconsax-react';
import { Button } from '@/components/ui/Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-danger/5 border border-danger/10 rounded-2xl text-center max-w-2xl mx-auto my-12">
                    <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
                        <Warning2 size={32} variant="Bulk" />
                    </div>
                    <h2 className="text-2xl font-bold font-display text-dark mb-2">Something went wrong</h2>
                    <p className="text-dark/60 mb-6 max-w-md">
                        We encountered an unexpected error while trying to render this section.
                        Don't worry, your data is safe.
                    </p>
                    <div className="bg-white p-4 rounded-xl border border-danger/20 text-xs font-mono text-danger/80 w-full text-left mb-8 overflow-auto max-h-32">
                        {this.state.error?.toString()}
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="gap-2 bg-dark hover:bg-dark/90"
                    >
                        <Refresh size={18} variant="Linear" />
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
