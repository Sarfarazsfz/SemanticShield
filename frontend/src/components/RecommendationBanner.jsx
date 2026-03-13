import { Warning2, TickCircle, InfoCircle } from 'iconsax-react';

export default function RecommendationBanner({ score }) {
    let config = {
        bg: 'bg-success/10',
        border: 'border-success/20',
        icon: <TickCircle size={24} className="text-success min-w-[24px]" variant="Bulk" />,
        title: 'Original Content Detected',
        text: 'The document appears to be mostly original. Minor similarities are likely common phrases or standard terminology.',
        titleColor: 'text-success',
    };

    if (score > 80) {
        config = {
            bg: 'bg-danger/10',
            border: 'border-danger/20',
            icon: <Warning2 size={24} className="text-danger min-w-[24px]" variant="Bulk" />,
            title: 'High Plagiarism Risk',
            text: 'Significant portions of this document match existing sources. A thorough manual review and citation check is strongly recommended.',
            titleColor: 'text-danger',
        };
    } else if (score > 50) {
        config = {
            bg: 'bg-warning/10',
            border: 'border-warning/20',
            icon: <InfoCircle size={24} className="text-warning min-w-[24px]" variant="Bulk" />,
            title: 'Moderate Similarity Detected',
            text: 'Noticeable paraphrasing or unoriginal content was found. Please review the highlighted sections to ensure proper attribution.',
            titleColor: 'text-warning-dark', // Assuming text-warning might be too light for reading, or just use text-warning
        };
    }

    return (
        <div className={`w-full rounded-2xl p-5 border ${config.bg} ${config.border} flex items-start gap-4`}>
            {config.icon}
            <div>
                <h4 className={`font-display font-bold text-lg mb-1 ${config.titleColor}`}>
                    {config.title}
                </h4>
                <p className="text-sm text-dark/70 leading-relaxed">
                    {config.text}
                </p>
            </div>
        </div>
    );
}
