const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

// Step 1: Extract text from uploaded file
async function extractText(filename) {
  const filePath = path.join(__dirname, '../uploads', filename);
  if (!fs.existsSync(filePath)) throw new Error('File not found');
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    const data = await pdfParse(fs.readFileSync(filePath));
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error('Unsupported file format');
  }
}

// Step 2: Clean AI response and parse JSON
function cleanAndParseJSON(rawContent) {
  console.log('Raw response (300 chars):', rawContent.slice(0, 300));

  let content = rawContent
    .replace(/```json|```/g, '')
    .replace(/^.*?(?=\{)/s, '')
    .replace(/\}[^}]*$/s, '}')
    .trim();

  try {
    return ensureValidStructure(JSON.parse(content));
  } catch (e) {
    console.log('First parse failed');
  }

  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return ensureValidStructure(JSON.parse(match[0]));
    } catch (e) {}
  }

  return getFallbackStructure();
}

// Step 3: Validate structure
function ensureValidStructure(data) {
  return {
    personalInfo: {
      name: data.personalInfo?.name || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      address: data.personalInfo?.address || '',
      linkedin: data.personalInfo?.linkedin || '',
      github: data.personalInfo?.github || ''
    },
    summary: data.summary || '',
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : []
  };
}

// Step 4: Fallback structure
function getFallbackStructure() {
  return {
    personalInfo: {
      name: '', email: '', phone: '', address: '', linkedin: '', github: ''
    },
    summary: 'Unable to parse resume. Please enter manually.',
    experience: [], education: [], skills: [], projects: [], certifications: []
  };
}

// Step 5: DeepSeek AI parsing
async function parseWithDeepSeek(text) {
  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      response_format: 'json', // 🔥 Key fix
      messages: [{
        role: 'user',
        content: `Return ONLY JSON (no comments or explanations):

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
  "experience": [{"company": "", "position": "", "duration": "", "description": ""}],
  "education": [{"institution": "", "degree": "", "year": ""}],
  "skills": [""],
  "projects": [{"name": "", "description": "", "technologies": ""}],
  "certifications": [""]
}

Resume:
${text}`
      }],
      max_tokens: 2000,
      temperature: 0.1
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const content = response.data.choices[0].message.content.trim();
  return cleanAndParseJSON(content);
}

// Step 6: Endpoint to trigger parsing
router.post('/', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ success: false, error: 'Filename is required' });

    const text = await extractText(filename);
    if (!text || text.length < 50) {
      return res.status(400).json({ success: false, error: 'Insufficient resume text' });
    }

    let parsedData = getFallbackStructure();
    try {
      parsedData = await parseWithDeepSeek(text);
    } catch (e) {
      console.error('DeepSeek failed:', e.message);
    }

    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Parse error:', error.message);
    res.status(500).json({ success: false, error: 'Resume parsing failed' });
  }
});

module.exports = router;
