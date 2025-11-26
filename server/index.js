const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Check API Keys on Startup
console.log('--- Server Startup ---');
const API_KEY = process.env.LLM_API_KEY || process.env.NANO_BANANA_API_KEY;
console.log('API_KEY present:', !!API_KEY);
console.log('----------------------');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(API_KEY);

// Configure Multer for file upload
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// --- Routes ---

// 0. Status Check
app.get('/api/status', (req, res) => {
    res.json({
        llm: !!API_KEY,
        nanoBanana: !!API_KEY
    });
});

// 1. PDF Upload & Text Extraction
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const dataBuffer = req.file.buffer;
        const data = await pdfParse(dataBuffer);

        // Return the extracted text
        res.json({ text: data.text });
    } catch (error) {
        console.error('PDF Parse Error:', error);
        res.status(500).json({ error: 'Failed to parse PDF' });
    }
});

// 2. Generate Prompt (LLM Integration)
app.post('/api/generate-prompt', async (req, res) => {
    const { text, audience, terms, focus } = req.body;

    if (!text || !audience || !terms || !focus) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const systemPrompt = `
You are generating a prompt for Nano Banana Pro, an advanced AI that creates a single infographic summarizing a scientific PDF.

INPUT DATA:
- PDF text: ${text.substring(0, 10000)}... (truncated for context limit)
- Level: ${audience}
- Technical terms: ${terms}
- Focus: ${focus}

TASK:
Create a complete Nano Banana Pro prompt that:
  - Summarizes the entire PDF into one infographic
  - Adjusts language, visuals, and detail level to the selected audience
  - Includes or excludes technical terms exactly as instructed
  - Follows the selected focus mode
  - Provides clear visual layout instructions (structure, hierarchy, sections)
  - Includes labels, icons, and simple diagram descriptions
  - Is explicit enough for Nano Banana Pro to generate the infographic

OUTPUT FORMAT:
{
  "prompt": "<FINAL_NANO_BANANA_PROMPT>"
}
`;

    try {
        if (API_KEY) {
            console.log('Calling Gemini API for Prompt Generation...');
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const content = response.text();

            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
                return res.json({ prompt: parsed.prompt });
            } catch (e) {
                console.warn('Failed to parse LLM JSON, returning raw content');
                return res.json({ prompt: content });
            }
        } else {
            // Mock Fallback
            console.log('Using Mock LLM Response (No API Key)');
            await new Promise(resolve => setTimeout(resolve, 1500));
            res.json({ prompt: "Mock prompt for " + audience });
        }

    } catch (error) {
        console.error('LLM Error:', error);
        res.status(500).json({ error: 'Failed to generate prompt: ' + error.message });
    }
});

// 3. Generate Infographic (Gemini 3 Pro Image Preview - Nano Banana Pro)
app.post('/api/generate-infographic', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    try {
        if (API_KEY) {
            console.log('Calling Gemini 3 Pro Image Preview (Nano Banana Pro) for Image Generation...');

            // Use the native Gemini image generation endpoint with gemini-3-pro-image-preview
            const axios = require('axios');
            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    tools: [{ google_search: {} }], // Enable Google Search grounding for factual infographics
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                        imageConfig: {
                            aspectRatio: "16:9",
                            imageSize: "2K" // High quality 2K output
                        }
                    }
                },
                {
                    headers: {
                        'x-goog-api-key': API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Extract the image from the response
            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const parts = response.data.candidates[0].content.parts;

                // Find the image part (skip thought parts)
                const imagePart = parts.find(part => part.inlineData && !part.thought);

                if (imagePart && imagePart.inlineData) {
                    const imageData = imagePart.inlineData.data;
                    const imageUrl = `data:image/png;base64,${imageData}`;
                    console.log('Nano Banana Pro image generated successfully!');
                    res.json({ imageUrl });
                } else {
                    throw new Error('No image data in response');
                }
            } else {
                throw new Error('Invalid response structure');
            }

        } else {
            // Mock Fallback
            console.log('Using Mock Image Response (No API Key)');
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mockImageUrl = 'https://placehold.co/600x800/8b5cf6/ffffff?text=Infographic+Generated';
            res.json({ imageUrl: mockImageUrl });
        }

    } catch (error) {
        console.error('Nano Banana Pro Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate infographic: ' + (error.response ? JSON.stringify(error.response.data) : error.message) });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
