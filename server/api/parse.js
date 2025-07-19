
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

// Extract text from uploaded file
async function extractText(filePath, fileType) {
  try {
    if (fileType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    throw new Error('Failed to extract text: ' + error.message);
  }
}

// Parse resume using AI
async function parseResumeWithAI(text) {
  try {
    const prompt = `Extract the following information from this resume text and return ONLY a valid JSON object:

{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "address": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "experience": [
    {
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": "",
      "gpa": ""
    }
  ],
  "skills": [],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "link": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ]
}

Resume text:
${text}`;

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a resume parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    }

    // Fallback to HuggingFace
    if (process.env.HUGGINGFACE_API_KEY) {
      const response = await axios.post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        inputs: prompt
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      });

      // Simple fallback parsing if AI fails
      return parseResumeManually(text);
    }

    // Manual parsing as last resort
    return parseResumeManually(text);

  } catch (error) {
    console.error('AI parsing failed:', error.message);
    return parseResumeManually(text);
  }
}

// Manual parsing fallback
function parseResumeManually(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const data = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      github: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  };

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.personalInfo.email = emailMatch[0];

  // Extract phone
  const phoneMatch = text.match(/[\+]?[1-9]?[\d\s\-\(\)]{10,}/);
  if (phoneMatch) data.personalInfo.phone = phoneMatch[0];

  // Extract name (assume first line or line before email)
  if (lines.length > 0) {
    data.personalInfo.name = lines[0];
  }

  // Extract skills (look for common skill section headers)
  const skillsSection = text.match(/(?:skills|technical skills|technologies)[:\s]*([^]*?)(?:\n\s*\n|$)/i);
  if (skillsSection) {
    data.skills = skillsSection[1].split(/[,\n]/).map(skill => skill.trim()).filter(skill => skill);
  }

  return data;
}

// Parse resume endpoint
router.post('/', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine file type
    const fileType = filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    // Extract text
    const text = await extractText(filePath, fileType);
    
    // Parse with AI
    const parsedData = await parseResumeWithAI(text);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
