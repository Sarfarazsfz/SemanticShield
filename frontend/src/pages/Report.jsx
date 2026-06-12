import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentText, ArrowRight } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import ReportDashboard from '@/components/ReportDashboard';

export default function Report() {
    const [result, setResult] = useState(null);

    useEffect(() => {
        const saved = sessionStorage.getItem('lastResult');
        if (saved) {
            setResult(JSON.parse(saved));
        }
    }, []);

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-12 text-center max-w-md">
                    <CardContent className="p-0 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                            <DocumentText size={40} color="#A79277" variant="Bulk" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-dark mb-2">No Report Available</h2>
                        <p className="text-dark/50 mb-6">
                            Run a plagiarism check on the Dashboard first to generate a report.
                        </p>
                        <Link to="/dashboard">
                            <Button className="gap-2">
                                Go to Dashboard
                                <ArrowRight size={18} variant="Linear" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ReportDashboard result={result} />
            </div>
        </div>
    );
}
