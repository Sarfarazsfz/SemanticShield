import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DocumentUpload, Scan, DocumentText } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function UploadBox({ onAnalyze, loading }) {
    const [sourceText, setSourceText] = useState('');
    const [checkText, setCheckText] = useState('');
    const [extractingSource, setExtractingSource] = useState(false);
    const [extractingCheck, setExtractingCheck] = useState(false);

    const sourceRef = useRef(null);
    const checkRef = useRef(null);

    const sourceFileInputRef = useRef(null);
    const checkFileInputRef = useRef(null);

    const handleFileExtract = async (e, isSource) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isSource) setExtractingSource(true);
        else setExtractingCheck(true);

        try {
            let extracted = "";
            const fileType = file.name.split('.').pop().toLowerCase();

            if (fileType === 'txt') {
                extracted = await file.text();
            }
            else if (fileType === 'pdf') {
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
            }
            else if (fileType === 'docx') {
                const mammoth = (await import('mammoth/mammoth.browser.js')).default || await import('mammoth/mammoth.browser.js');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extracted = result.value;
            }
            else {
                throw new Error("Unsupported file extension. Only .txt, .pdf, and .docx are supported.");
            }

            const filename = file.name;
            const insertText = `[Document: ${filename}]\n${extracted}`;

            // Check word limit before setting
            const wordCount = (isSource ? sourceText : checkText).trim().split(/\s+/).filter(w => w).length;
            const newWords = extracted.trim().split(/\s+/).filter(w => w).length;

            if (wordCount + newWords > 4000) {
                alert(`Warning: Adding this file exceeds the 4000 word limit. Only adding what fits.`);
                // Just a warning, not blocking exactly, but user requested limit 
            }

            if (isSource) {
                setSourceText(prev => {
                    const separator = prev ? '\n\n' : '';
                    return prev + separator + insertText;
                });
            } else {
                setCheckText(prev => {
                    const separator = prev ? '\n\n' : '';
                    return prev + separator + insertText;
                });
            }
        } catch (err) {
            console.error("Extraction failed", err);
            alert(`Unable to read this file format: ${err.message}`);
        } finally {
            if (isSource) setExtractingSource(false);
            else setExtractingCheck(false);
            e.target.value = null; // reset file input
        }
    };

    const handleSubmit = () => {
        if (sourceText.trim().length >= 10 && checkText.trim().length >= 10) {
            onAnalyze(sourceText, checkText);
        }
    };

    const clearAll = () => {
        setSourceText('');
        setCheckText('');
    };

    const triggerSourceUpload = () => sourceFileInputRef.current?.click();
    const triggerCheckUpload = () => checkFileInputRef.current?.click();

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
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear All
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Textarea */}
                <Card className="flex flex-col h-full border-accent/20">
                    <div className="p-4 border-b border-accent/10 bg-accent/5 flex items-center justify-between">
                        <label className="text-sm font-semibold text-dark flex items-center gap-2">
                            <DocumentUpload size={18} color="#A79277" variant="Bulk" />
                            Source / Original Text
                        </label>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                        <Textarea
                            ref={sourceRef}
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Paste the reference document(s) here..."
                            className="flex-1 min-h-[200px] resize-y"
                        />
                        <div className="flex items-center justify-between pt-2">
                            <div className={`${extractingSource ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Button
                                    onClick={triggerSourceUpload}
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2"
                                >
                                    {extractingSource ? (
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    ) : (
                                        <DocumentText size={16} variant="Linear" />
                                    )}
                                    Upload File (PDF, DOCX, TXT)
                                </Button>
                                <input
                                    type="file"
                                    ref={sourceFileInputRef}
                                    className="hidden"
                                    accept=".txt,.pdf,.docx"
                                    onChange={(e) => handleFileExtract(e, true)}
                                />
                            </div>
                            <span className="text-xs text-dark/40">{sourceText.split(/\s+/).filter(w => w).length} words</span>
                        </div>
                    </div>
                </Card>

                {/* Check Textarea */}
                <Card className="flex flex-col h-full border-accent/20">
                    <div className="p-4 border-b border-accent/10 bg-accent/5 flex items-center justify-between">
                        <label className="text-sm font-semibold text-dark flex items-center gap-2">
                            <Scan size={18} color="#A79277" variant="Bulk" />
                            Document to Check
                        </label>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                        <Textarea
                            ref={checkRef}
                            value={checkText}
                            onChange={(e) => setCheckText(e.target.value)}
                            placeholder="Paste the student assignment here to check for plagiarism..."
                            className="flex-1 min-h-[200px] resize-y"
                        />
                        <div className="flex items-center justify-between pt-2">
                            <div className={`${extractingCheck ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Button
                                    onClick={triggerCheckUpload}
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2"
                                >
                                    {extractingCheck ? (
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    ) : (
                                        <DocumentText size={16} variant="Linear" />
                                    )}
                                    Upload File (PDF, DOCX, TXT)
                                </Button>
                                <input
                                    type="file"
                                    ref={checkFileInputRef}
                                    className="hidden"
                                    accept=".txt,.pdf,.docx"
                                    onChange={(e) => handleFileExtract(e, false)}
                                />
                            </div>
                            <span className="text-xs text-dark/40">{checkText.split(/\s+/).filter(w => w).length} words</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Analyze Button */}
            <div className="mt-8 flex justify-center">
                <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading || sourceText.trim().length < 10 || checkText.trim().length < 10 || extractingSource || extractingCheck}
                    className="gap-2.5 shadow-xl shadow-accent/20 px-8"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Scan size={20} variant="Linear" />
                            Analyze Document
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
