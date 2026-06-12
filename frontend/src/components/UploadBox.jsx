import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DocumentUpload, SearchNormal1, DocumentText } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';

export default function UploadBox({ onAnalyze, loading }) {
    const [documentText, setDocumentText] = useState('');
    const [extracting, setExtracting] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileExtract = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setExtracting(true);
        setUploadedFileName(null);

        try {
            let extracted = '';
            const fileType = file.name.split('.').pop().toLowerCase();

            if (fileType === 'txt') {
                extracted = await file.text();
            } else if (fileType === 'pdf') {
                const pdfjsLib = await import('pdfjs-dist/build/pdf');
                const workerUrl = await import('pdfjs-dist/build/pdf.worker.mjs?url');
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ') + '\n';
                }
                extracted = text;
            } else if (fileType === 'docx') {
                const mammoth = (await import('mammoth/mammoth.browser.js')).default || await import('mammoth/mammoth.browser.js');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extracted = result.value;
            } else {
                throw new Error('Unsupported file extension. Only .txt, .pdf, and .docx are supported.');
            }

            setDocumentText(extracted);
            setUploadedFileName(file.name);
        } catch (err) {
            console.error('Extraction failed', err);
            alert(`Unable to read this file: ${err.message}`);
        } finally {
            setExtracting(false);
            e.target.value = null; // reset file input
        }
    };

    const isReady = documentText.trim().length >= 10;
    const isDisabled = loading || !isReady || extracting;

    const handleCheckPlagiarism = () => {
        if (isReady) onAnalyze(documentText);
    };

    const clearAll = () => {
        setDocumentText('');
        setUploadedFileName(null);
    };

    const wordCount = documentText.trim().split(/\s+/).filter(w => w).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-dark flex items-center gap-2.5">
                    <DocumentUpload size={24} color="#A79277" variant="Bulk" />
                    Document Analysis
                </h2>
                {(documentText || uploadedFileName) && (
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Single Document Card — full width */}
            <Card className="flex flex-col border-accent/20">
                <div className="p-4 border-b border-accent/10 bg-accent/5 flex items-center justify-between">
                    <label className="text-sm font-semibold text-dark flex items-center gap-2">
                        <DocumentText size={18} color="#A79277" variant="Bulk" />
                        Document to Check
                    </label>
                    {uploadedFileName && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-xs font-medium text-accent-dark bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full flex items-center gap-1.5"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            {uploadedFileName}
                        </motion.span>
                    )}
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <Textarea
                        value={documentText}
                        onChange={(e) => {
                            setDocumentText(e.target.value);
                            if (uploadedFileName) setUploadedFileName(null);
                        }}
                        placeholder="Paste your paper here, or upload a file below — SemanticShield will automatically check it against the reference corpus for plagiarism and AI-generated content."
                        className="min-h-[260px] resize-y"
                    />

                    <div className="flex items-center justify-between pt-1">
                        {/* Upload button */}
                        <div className={`${extracting ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                            >
                                {extracting ? (
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <DocumentText size={16} variant="Linear" />
                                )}
                                {extracting ? 'Reading file…' : 'Upload File (PDF, DOCX, TXT)'}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".txt,.pdf,.docx"
                                onChange={handleFileExtract}
                            />
                        </div>
                        <span className="text-xs text-dark/40">{wordCount > 0 ? `${wordCount} words` : 'No content yet'}</span>
                    </div>
                </div>
            </Card>

            {/* Action Button */}
            <div className="mt-8 flex items-center justify-center">
                <Button
                    size="lg"
                    onClick={handleCheckPlagiarism}
                    disabled={isDisabled}
                    className="gap-2.5 shadow-xl shadow-accent/20 px-10"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Checking Plagiarism…
                        </>
                    ) : (
                        <>
                            <SearchNormal1 size={20} variant="Linear" />
                            Check Plagiarism
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
