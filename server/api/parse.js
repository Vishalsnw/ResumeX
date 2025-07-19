const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

// Extract text from uploaded file
async function extractText(filePath, fileType) {
  try {
    if (fileType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
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

// Ultra-robust JSON extraction and validation
function extractValidJSON(response) {
  console.log('Processing AI response:', response.substring(0, 200) + '...');

  // Remove all common prefixes and markdown
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^.*?(here|the|this|is|json|response|result|data|output)[\s:]*\n?/gi, '')
    .trim();

  // Find all potential JSON objects using bracket matching
  const jsonCandidates = [];
  let braceCount = 0;
  let startIndex = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (char === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        const candidate = cleaned.substring(startIndex, i + 1);
        jsonCandidates.push(candidate);
      }
    }
  }

  // Try parsing each candidate
  for (const candidate of jsonCandidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        console.log('Successfully parsed JSON candidate');
        return addFallbackStructure(parsed);
      }
    } catch (e) {
      // Try fixing common JSON issues
      try {
        const fixed = fixCommonJSONIssues(candidate);
        const parsed = JSON.parse(fixed);
        if (parsed && typeof parsed === 'object') {
          console.log('Successfully parsed fixed JSON');
          return addFallbackStructure(parsed);
        }
      } catch (fixError) {
        continue;
      }
    }
  }

  // If no valid JSON found, return fallback
  console.warn('No valid JSON found, returning fallback structure');
  return getFallbackStructure();
}

// Fix common JSON formatting issues
function fixCommonJSONIssues(jsonStr) {
  return jsonStr
    // Remove trailing commas
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    // Quote unquoted keys
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix single quotes
    .replace(/:\s*'([^']*)'/g, ':"$1"')
    // Handle special characters safely
    .replace(/(['"])C\+\+(['"])/g, '"C++"')
    .replace(/(['"])C(['"])/g, '"C"')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Get fallback structure
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
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  };
}

// Ensure all required fields exist
function addFallbackStructure(data) {
  const fallback = getFallbackStructure();

  return {
    personalInfo: {
      ...fallback.personalInfo,
      ...(data.personalInfo || {})
    },
    summary: data.summary || fallback.summary,
    experience: Array.isArray(data.experience) ? data.experience : fallback.experience,
    education: Array.isArray(data.education) ? data.education : fallback.education,
    skills: Array.isArray(data.skills) ? data.skills : fallback.skills,
    projects: Array.isArray(data.projects) ? data.projects : fallback.projects,
    certifications: Array.isArray(data.certifications) ? data.certifications : fallback.certifications
  };
}

// Parse resume using AI
async function parseResumeWithAI(text) {
  try {
    console.log('Starting AI parsing...');

    const prompt = `Extract resume information and return ONLY this JSON structure with NO additional text:

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
  "projects": [],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ]
}

Resume text: ${text}

Return ONLY the JSON object:`;

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI API...');
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'You are a resume parser. Return ONLY valid JSON. No explanations, no markdown, no additional text. Start your response with { and end with }.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
          max_tokens: 2000
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        if (response.data?.choices?.[0]?.message?.content) {
          const content = response.data.choices[0].message.content;
          return extractValidJSON(content);
        }
      } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
      }
    }

    // Try DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      console.log('Using DeepSeek API...');
      try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: 'You are a resume parser. Return ONLY valid JSON. No explanations, no markdown, no additional text. Start your response with { and end with }.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        if (response.data?.choices?.[0]?.message?.content) {
          const content = response.data.choices[0].message.content;
          return extractValidJSON(content);
        }
      } catch (error) {
        console.error('DeepSeek API error:', error.response?.data || error.message);
      }
    }

    // Fallback to manual parsing
    console.log('All AI services failed, using manual parsing');
    return parseResumeManually(text);

  } catch (error) {
    console.error('AI parsing completely failed:', error.message);
    return parseResumeManually(text);
  }
}

// Manual parsing fallback
function parseResumeManually(text) {
  console.log('Using manual parsing fallback');
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  const data = getFallbackStructure();

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.personalInfo.email = emailMatch[0];

  // Extract phone
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) data.personalInfo.phone = phoneMatch[0];

  // Extract LinkedIn
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/[\w-]+)/i);
  if (linkedinMatch) data.personalInfo.linkedin = 'https://' + linkedinMatch[0];

  // Extract GitHub
  const githubMatch = text.match(/(?:github\.com\/[\w-]+)/i);
  if (githubMatch) data.personalInfo.github = 'https://' + githubMatch[0];

  // Extract name
  for (let line of lines) {
    if (line.length > 2 && !line.includes('@') && !line.match(/\d{3}/)) {
      data.personalInfo.name = line;
      break;
    }
  }

  // Extract skills
  const skillsSection = text.match(/(?:skills|technologies)[:\s]*([^]*?)(?:\n\s*\n|experience|education|$)/i);
  if (skillsSection) {
    const skillsText = skillsSection[1];
    data.skills = skillsText.split(/[,\n•·\-\|]/)
      .map(skill => skill.trim())
      .filter(skill => skill && skill.length > 1 && skill.length < 50)
      .slice(0, 20); // Limit skills
  }

  console.log('Manual parsing completed');
  return data;
}

// Parse resume endpoint
router.post('/', async (req, res) => {
  try {
    console.log('Parse request received:', req.body);
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ 
        success: false, 
        error: 'Filename is required' 
      });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }

    // Determine file type
    const fileType = filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Extract text
    const text = await extractText(filePath, fileType);
    console.log('Text extraction successful, length:', text.length);

    // Parse with AI
    const parsedData = await parseResumeWithAI(text);
    console.log('Resume parsing completed successfully');

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Could not clean up file:', cleanupError.message);
    }

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('Parse error:', error);

    // Try to clean up file even on error
    const { filename } = req.body;
    if (filename) {
      try {
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.warn('Could not clean up file:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;