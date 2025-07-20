const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

// Extract text from uploaded file
async function extractText(filename) {
  const filePath = path.join(__dirname, '../uploads', filename);

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error('Unsupported file format');
  }
}

function cleanAndParseJSON(rawContent) {
  console.log('Raw AI response (first 300 chars):', rawContent.substring(0, 300));

  let content = rawContent
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^.*?(?=\{)/s, '')
    .replace(/\}[^\}]*$/s, '}')
    .trim();

  try {
    const parsed = JSON.parse(content);
    console.log('JSON parsed successfully on first attempt');
    return ensureValidStructure(parsed);
  } catch (error) {
    console.log('First parse failed, attempting cleanup...');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    content = jsonMatch[0];
    try {
      const parsed = JSON.parse(content);
      console.log('JSON parsed successfully after extraction');
      return ensureValidStructure(parsed);
    } catch {}
  }

  const aggressiveMatch = rawContent.match(/\{[^{}]*"personalInfo"[\s\S]*\}/);
  if (aggressiveMatch) {
    content = aggressiveMatch[0];
    try {
      const parsed = JSON.parse(content);
      console.log('JSON parsed successfully with aggressive extraction');
      return ensureValidStructure(parsed);
    } catch {}
  }

  if (rawContent.includes('The page') || rawContent.includes('This resume')) {
    try {
      const emergencyData = extractDataFromProse(rawContent);
      return ensureValidStructure(emergencyData);
    } catch {}
  }

  content = content
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/"?C\+\+"?/g, '"C_plus_plus"')
    .replace(/"?C#"?/g, '"C_sharp"')
    .replace(/"?\.NET"?/g, '"dotNET"')
    .replace(/"?F#"?/g, '"F_sharp"')
    .replace(/:\s*C\+\+/g, ': "C_plus_plus"')
    .replace(/:\s*C#/g, ': "C_sharp"')
    .replace(/:\s*\.NET/g, ': "dotNET"')
    .replace(/:\s*F#/g, ': "F_sharp"')
    .replace(/([,\[\s])"?([^",\]\}]*[\+#&\-\.][^",\]\}]*)"?([,\]\}])/g, '$1"$2"$3')
    .replace(/:\s*([A-Za-z][A-Za-z0-9\s\-\._]*[A-Za-z0-9])\s*([,}\]])/g, ': "$1"$2')
    .replace(/\[\s*([^"\[\]{}]*[A-Za-z]+[^"\[\]{}]*)\s*\]/g, '["$1"]')
    .replace(/,\s*([^",\[\]{}]*[A-Za-z]+[^",\[\]{}]*)\s*([,\]])/g, ', "$1"$2');

  try {
    const parsed = JSON.parse(content);
    console.log('JSON parsed successfully after cleaning');
    return ensureValidStructure(parsed);
  } catch (error) {
    console.error('All JSON parsing attempts failed:', error);
    return getFallbackStructure();
  }
}

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

function extractDataFromProse(proseText) {
  const data = getFallbackStructure();
  const emailMatch = proseText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) data.personalInfo.email = emailMatch[0];
  const phoneMatch = proseText.match(/[\+]?\(?[0-9]{2,4}\)?[\d\s\-]{7,}/);
  if (phoneMatch) data.personalInfo.phone = phoneMatch[0];
  const nameMatch = proseText.match(/(?:Name[:\s]+)([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (nameMatch) data.personalInfo.name = nameMatch[1];
  return data;
}

function getFallbackStructure() {
  return {
    personalInfo: {
      name: '', email: '', phone: '', address: '', linkedin: '', github: ''
    },
    summary: 'Unable to parse resume content automatically. Please fill in manually.',
    experience: [], education: [], skills: [], projects: [], certifications: []
  };
}

async function parseWithOpenAI(text) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `Return ONLY valid JSON:
{
  "personalInfo": {"name": "", "email": "", "phone": "", "address": "", "linkedin": "", "github": ""},
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
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  return cleanAndParseJSON(response.data.choices[0].message.content.trim());
}

async function parseWithDeepSeek(text) {
  const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    model: 'deepseek-chat',
    messages: [{
      role: 'user',
      content: `Return ONLY JSON:
{
  "personalInfo": {"name": "", "email": "", "phone": "", "address": "", "linkedin": "", "github": ""},
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
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  return cleanAndParseJSON(response.data.choices[0].message.content.trim());
}

router.post('/', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ success: false, error: 'Filename is required' });
    console.log('Parsing resume:', filename);
    const text = await extractText(filename);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'Resume text is too short' });
    }
    let parsedData;
    try {
      parsedData = await parseWithOpenAI(text);
    } catch {
      try {
        parsedData = await parseWithDeepSeek(text);
      } catch {
        parsedData = getFallbackStructure();
      }
    }
    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Parsing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
    
