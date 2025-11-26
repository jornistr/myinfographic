import React, { useState, useEffect } from 'react';
import { uploadPDF, generatePrompt, generateInfographic } from './api';
import './App.css';

function App() {
    const [step, setStep] = useState(1); // 1: Upload, 2: Options, 3: Processing, 4: Result
    const [file, setFile] = useState(null);
    const [pdfText, setPdfText] = useState('');
    const [options, setOptions] = useState({
        language: 'Deutsch', // BASIC
        audience: 'General public', // BASIC
        focus: 'Balanced overview', // BASIC - neutral default
        terms: 'Include & Explain', // ADVANCED
        styleNotes: '' // ADVANCED - optional style customization
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [status, setStatus] = useState('');
    const [resultImage, setResultImage] = useState('');
    const [error, setError] = useState('');

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File size exceeds 50MB limit.');
                return;
            }
            if (selectedFile.type !== 'application/pdf') {
                setError('Only PDF files are allowed.');
                return;
            }

            // Warning for large files
            if (selectedFile.size > 25 * 1024 * 1024) {
                setError('⚠️ Large file detected. Processing may take longer and results might be affected due to file size.');
            } else {
                setError('');
            }

            setFile(selectedFile);
        }
    };

    const handleOptionChange = (e) => {
        setOptions({ ...options, [e.target.name]: e.target.value });
    };

    const startProcess = async () => {
        setStep(3);
        setError('');

        try {
            // Step 1: Upload & Extract
            setStatus('Uploading and analyzing PDF...');
            const uploadRes = await uploadPDF(file);
            setPdfText(uploadRes.text);

            // Step 2: Generate Prompt
            setStatus('Generating infographic prompt...');
            const promptRes = await generatePrompt(
                uploadRes.text,
                options.audience,
                options.terms,
                options.focus,
                options.language,
                options.styleNotes // Pass style notes to backend
            );

            // Step 3: Generate Infographic
            setStatus('Creating infographic with Nano Banana Pro...');
            const infographicRes = await generateInfographic(promptRes.prompt);

            console.log('Infographic Response:', infographicRes);

            if (!infographicRes.imageUrl) {
                throw new Error('No image URL returned from server');
            }

            setResultImage(infographicRes.imageUrl);
            setStatus('Completed!');
            setStep(4);

        } catch (err) {
            console.error('Process Error:', err);
            setError(`An error occurred: ${err.message || 'Unknown error'}`);
            // Do not reset step immediately so user can see the error
            // setStep(2);
        }
    };

    const reset = () => {
        setStep(1);
        setFile(null);
        setPdfText('');
        setResultImage('');
        setStatus('');
        setError('');
    };

    const [apiStatus, setApiStatus] = useState({ llm: false, nanoBanana: false });

    useEffect(() => {
        // Check API status on load
        fetch('/api/status')
            .then(res => res.json())
            .then(data => setApiStatus(data))
            .catch(err => console.error('Failed to check status', err));
    }, []);

    return (
        <div className="app-container">
            <header>
                <h1>MyInfographic</h1>
                <p>Bridging Research and Impact</p>
            </header>

            <main>
                {/* API Status Indicator */}
                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#888' }}>
                    API Status:
                    <span style={{ color: apiStatus.llm ? '#4ade80' : '#ef4444', marginLeft: '0.5rem' }}>
                        LLM: {apiStatus.llm ? 'Connected' : 'Mock'}
                    </span>
                    <span style={{ color: apiStatus.nanoBanana ? '#4ade80' : '#ef4444', marginLeft: '1rem' }}>
                        Nano Banana: {apiStatus.nanoBanana ? 'Connected' : 'Mock'}
                    </span>
                </div>

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="card upload-section">
                        <h2>1. Upload PDF</h2>
                        <div className="upload-box">
                            <input type="file" id="pdf-upload" accept=".pdf" onChange={handleFileUpload} />
                            <label htmlFor="pdf-upload" className="upload-label">
                                {file ? file.name : 'Drag & Drop or Click to Upload PDF'}
                            </label>
                        </div>
                        {error && <p className="error-msg">{error}</p>}
                        <button
                            className="btn primary"
                            disabled={!file}
                            onClick={() => setStep(2)}
                        >
                            Next: Configure Options →
                        </button>
                    </div>
                )}

                {/* Step 2: Options */}
                {step === 2 && (
                    <div className="card">
                        <h2>Configure Your Infographic</h2>
                        <p style={{ marginBottom: '2rem', color: '#888' }}>
                            Quick start with defaults, or customize with advanced settings below.
                        </p>

                        {/* BASIC SETTINGS */}
                        <div className="settings-section">
                            <div className="option-group">
                                <label>Output Language</label>
                                <select value={options.language} onChange={(e) => setOptions({ ...options, language: e.target.value })}>
                                    <option>Deutsch</option>
                                    <option>English</option>
                                </select>
                            </div>

                            <div className="option-group">
                                <label>Target Audience</label>
                                <select value={options.audience} onChange={(e) => setOptions({ ...options, audience: e.target.value })}>
                                    <option>General public</option>
                                    <option>High school students</option>
                                    <option>Undergraduate</option>
                                    <option>Graduate/Professional</option>
                                    <option>Expert researchers</option>
                                </select>
                            </div>

                            <div className="option-group">
                                <label>Content Focus</label>
                                <select value={options.focus} onChange={(e) => setOptions({ ...options, focus: e.target.value })}>
                                    <option>Balanced overview</option>
                                    <option>Core scientific concepts</option>
                                    <option>Methodology & process</option>
                                    <option>Results & findings</option>
                                    <option>Broader implications</option>
                                </select>
                            </div>
                        </div>

                        {/* ADVANCED SETTINGS TOGGLE */}
                        <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                            <span>{showAdvanced ? '▼' : '▶'} Advanced Settings</span>
                        </div>

                        {/* ADVANCED SETTINGS */}
                        {showAdvanced && (
                            <div className="settings-section advanced-section">
                                <div className="option-group">
                                    <label>Technical Terms</label>
                                    <select value={options.terms} onChange={(e) => setOptions({ ...options, terms: e.target.value })}>
                                        <option>Include & Explain</option>
                                        <option>Include without explanation</option>
                                        <option>Exclude, simplify to context</option>
                                    </select>
                                </div>

                                <div className="option-group">
                                    <label>
                                        Style Notes <span style={{ color: '#888', fontSize: '0.85rem' }}>(optional)</span>
                                    </label>
                                    <textarea
                                        value={options.styleNotes}
                                        onChange={(e) => setOptions({ ...options, styleNotes: e.target.value })}
                                        placeholder="e.g., 'Use vibrant colors', 'Minimalist design', 'Hand-drawn style'..."
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                                        Describe visual style preferences only (colors, layout, artistic approach)
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && <p className="error-msg">{error}</p>}

                        <div className="btn-group">
                            <button className="btn secondary" onClick={() => setStep(1)}>← Back</button>
                            <button className="btn primary" onClick={startProcess}>Generate Infographic</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Processing */}
                {step === 3 && (
                    <div className="card processing-section">
                        {!error ? (
                            <>
                                <div className="spinner"></div>
                                <h2>Processing...</h2>
                                <p className="status-text">{status}</p>
                            </>
                        ) : (
                            <>
                                <h2 style={{ color: '#ef4444' }}>Error</h2>
                                <p className="error-msg" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{error}</p>
                                <button className="btn secondary" onClick={() => setStep(2)}>Try Again</button>
                            </>
                        )}
                    </div>
                )}

                {/* Step 4: Result */}
                {step === 4 && (
                    <div className="card result-section">
                        <h2>Your Infographic is Ready!</h2>
                        <div className="image-container">
                            <img src={resultImage} alt="Generated Infographic" />
                        </div>
                        <div className="btn-group">
                            <a href={resultImage} download="infographic.png" className="btn primary" target="_blank" rel="noreferrer">Download Image</a>
                            <button className="btn secondary" onClick={reset}>Start Over</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
