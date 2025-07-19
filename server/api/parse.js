
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

// Utility function to clean and validate JSON responses
function cleanAndParseJSON(rawContent) {
  console.log('Raw AI response (first 300 chars):', rawContent.substring(0, 300));
  
  // Step 1: Remove markdown code blocks and common prefixes
  let content = rawContent
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    // More aggressive removal of prose text before JSON
    .replace(/^.*?(?=\{)/s, '') // Remove everything before first { (including newlines)
    .replace(/\}[^}]*$/s, '}') // Remove everything after last }
    .trim();

  // Step 2: Try basic JSON parse first
  try {
    const parsed = JSON.parse(content);
    console.log('JSON parsed successfully on first attempt');
    return ensureValidStructure(parsed);
  } catch (error) {
    console.log('First parse failed, attempting cleanup...');
  }

  // Step 3: Extract the largest JSON object if embedded in text
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    content = jsonMatch[0];
    try {
      const parsed = JSON.parse(content);
      console.log('JSON parsed successfully after extraction');
      return ensureValidStructure(parsed);
    } catch (error) {
      console.log('Parse failed after extraction, attempting repairs...');
    }
  }

  // Step 3.5: Try to find JSON pattern more aggressively
  const aggressiveMatch = rawContent.match(/\{[^{}]*"personalInfo"[\s\S]*\}/);
  if (aggressiveMatch) {
    content = aggressiveMatch[0];
    try {
      const parsed = JSON.parse(content);
      console.log('JSON parsed successfully with aggressive extraction');
      return ensureValidStructure(parsed);
    } catch (error) {
      console.log('Aggressive extraction also failed, continuing...');
    }
  }

  // Step 4: Fix common JSON issues
  content = content
    // Fix unquoted keys
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix single quotes
    .replace(/'/g, '"')
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix problematic programming language strings (both quoted and unquoted)
    .replace(/"?C\+\+"?/g, '"C_plus_plus"')
    .replace(/"?C#"?/g, '"C_sharp"')
    .replace(/"?\.NET"?/g, '"dotNET"')
    .replace(/"?F#"?/g, '"F_sharp"')
    .replace(/:\s*C\+\+/g, ': "C_plus_plus"')
    .replace(/:\s*C#/g, ': "C_sharp"')
    .replace(/:\s*\.NET/g, ': "dotNET"')
    .replace(/:\s*F#/g, ': "F_sharp"')
    // Fix other special characters in skill names
    .replace(/([,\[\s])"?([^",\]\}]*[\+#&\-\.][^",\]\}]*)"?([,\]\}])/g, '$1"$2"$3')
    // Fix bare words that should be strings (more comprehensive)
    .replace(/:\s*([A-Za-z][A-Za-z0-9\s\-\._]*[A-Za-z0-9])\s*([,}\]])/g, ': "$1"$2')
    // Fix unquoted strings in arrays
    .replace(/\[\s*([^"\[\]{}]*[A-Za-z]+[^"\[\]{}]*)\s*\]/g, '["$1"]')
    .replace(/,\s*([^",\[\]{}]*[A-Za-z]+[^",\[\]{}]*)\s*([,\]])/g, ', "$1"$2');

  // Step 5: Try parsing the cleaned content
  try {
    const parsed = JSON.parse(content);
    console.log('JSON parsed successfully after cleaning');
    return ensureValidStructure(parsed);
  } catch (error) {
    console.error('All JSON parsing attempts failed:', error);
    console.log('Original raw content (first 500 chars):', rawContent.substring(0, 500));
    console.log('Final cleaned content attempted:', content.substring(0, 500));
    console.log('Content length:', content.length);
    console.log('Problematic characters found:', content.match(/[^\x00-\x7F]/g) || 'None');
    
    // Return fallback structure
    console.log('Returning fallback structure');
    return getFallbackStructure();
  }
}

// Ensure the parsed data has the correct structure
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

// Get fallback structure when all parsing fails
function getFallbackStructure() {
  return {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      github: ''
    },
    summary: 'Unable to parse resume content automatically. Please fill in manually.',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  };
}

// Parse with OpenAI
async function parseWithOpenAI(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `You must return ONLY valid JSON. Do not include any explanatory text, comments, or markdown. Start your response with { and end with }. Parse this resume text and return the JSON with this exact structure:

{
  "personalInfo": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "address": "string",
    "linkedin": "string",
    "github": "string"
  },
  "summary": "string",
  "experience": [{"company": "string", "position": "string", "duration": "string", "description": "string"}],
  "education": [{"institution": "string", "degree": "string", "year": "string"}],
  "skills": ["string"],
  "projects": [{"name": "string", "description": "string", "technologies": "string"}],
  "certifications": ["string"]
}

Resume text: ${text}`
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

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const rawContent = response.data.choices[0].message.content.trim();
    return cleanAndParseJSON(rawContent);

  } catch (error) {
    console.error('OpenAI parsing error:', error.message);
    throw error;
  }
}

// Parse with DeepSeek (fallback)
async function parseWithDeepSeek(text) {
  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `Return ONLY JSON. No text before or after. Start with { and end with }. Parse this resume:

{
  "personalInfo": {"name": "", "email": "", "phone": "", "address": "", "linkedin": "", "github": ""},
  "summary": "",
  "experience": [{"company": "", "position": "", "duration": "", "description": ""}],
  "education": [{"institution": "", "degree": "", "year": ""}],
  "skills": [""],
  "projects": [{"name": "", "description": "", "technologies": ""}],
  "certifications": [""]
}

Resume: ${text}`
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

    const rawContent = response.data.choices[0].message.content.trim();
    return cleanAndParseJSON(rawContent);

  } catch (error) {
    console.error('DeepSeek parsing error:', error.message);
    throw error;
  }
}

// Main parse endpoint
router.post('/', async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    console.log('Starting resume parsing for:', filename);

    // Extract text from file
    const text = await extractText(filename);
    console.log('Text extracted, length:', text.length);

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Unable to extract sufficient text from the file'
      });
    }

    let parsedData;

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('Attempting parsing with OpenAI...');
        parsedData = await parseWithOpenAI(text);
        console.log('OpenAI parsing successful');
      } catch (openaiError) {
        console.log('OpenAI failed, trying DeepSeek...');
        
        // Fallback to DeepSeek
        if (process.env.DEEPSEEK_API_KEY) {
          try {
            parsedData = await parseWithDeepSeek(text);
            console.log('DeepSeek parsing successful');
          } catch (deepseekError) {
            console.log('Both AI services failed, returning fallback');
            parsedData = getFallbackStructure();
          }
        } else {
          console.log('No DeepSeek key, returning fallback');
          parsedData = getFallbackStructure();
        }
      }
    } else {
      console.log('No OpenAI key, returning fallback');
      parsedData = getFallbackStructure();
    }

    // Clean up uploaded file
    try {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up uploaded file');
      }
    } catch (cleanupError) {
      console.log('File cleanup warning:', cleanupError.message);
    }

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('Parse endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse resume'
    });
  }
});

module.exports = router;
