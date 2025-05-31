const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// File upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let text = '';
        const fileBuffer = req.file.buffer;
        const fileType = req.file.mimetype;

        if (fileType === 'application/pdf') {
            const data = await pdf(fileBuffer);
            text = data.text;
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        res.json({ text });
    } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// Text summarization endpoint
router.post('/summarize', async (req, res) => {
    try {
        const { text, style, length } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        // Construct the prompt based on style and length
        const prompt = buildPrompt(text, style, length);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        res.json({ summary });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

function buildPrompt(text, style, length) {
    const styleInstructions = {
        'academic': 'Provide a formal, well-structured academic summary suitable for a research paper or scholarly article.',
        'simple': 'Provide a simple, easy-to-understand summary using basic vocabulary and short sentences.',
        'bullet': 'Provide a summary in bullet point format, highlighting only the key points.',
        'narrative': 'Provide a narrative summary that flows like a short story, maintaining the essence of the original text.'
    };

    const lengthInstructions = {
        'very-short': 'Extremely concise (1-2 sentences maximum)',
        'short': 'Brief (about 25% of original length)',
        'medium': 'Moderate (about 50% of original length)',
        'long': 'Detailed (about 75% of original length)',
        'detailed': 'Comprehensive (retains all key points with some detail)'
    };

    return `
        Please summarize the following text according to these specific instructions:
        
        - Style: ${styleInstructions[style]}
        - Length: ${lengthInstructions[length]}
        
        Here is the text to summarize:
        
        ${text}
        
        Please provide only the summary with no additional commentary or headers.
    `;
}

module.exports = router;