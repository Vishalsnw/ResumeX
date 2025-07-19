
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

// Ultra-robust JSON cleaning and extraction
function cleanAndParseJSON(response) {
  console.log('Raw AI response (first 300 chars):', response.substring(0, 300));

  // Step 1: Strip all common prefixes and markdown
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^{]*/, '') // Remove everything before first {
    .replace(/[^}]*$/, '') // Remove everything after last }
    .trim();

  // Step 2: Find the largest valid JSON object
  const jsonCandidates = [];
  let bracketCount = 0;
  let startIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      if (bracketCount === 0) startIdx = i;
      bracketCount++;
    } else if (cleaned[i] === '}') {
      bracketCount--;
      if (bracketCount === 0 && startIdx !== -1) {
        jsonCandidates.push(cleaned.substring(startIdx, i + 1));
      }
    }
  }

  // Step 3: Try parsing each candidate
  for (const candidate of jsonCandidates) {
    // Try direct parsing first
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        console.log('✅ Successfully parsed JSON directly');
        return ensureResumeStructure(parsed);
      }
    } catch (e) {
      // Continue to fixing attempts
    }

    // Try with common fixes
    try {
      const fixed = fixJSONSyntax(candidate);
      const parsed = JSON.parse(fixed);
      if (parsed && typeof parsed === 'object') {
        console.log('✅ Successfully parsed JSON after fixes');
        return ensureResumeStructure(parsed);
      }
    } catch (e) {
      continue;
    }
  }

  console.warn('❌ All JSON parsing attempts failed, returning fallback');
  return getResumeTemplate();
}

// Fix common JSON syntax issues
function fixJSONSyntax(jsonStr) {
  return jsonStr
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Quote unquoted keys
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    // Fix single quotes to double quotes
    .replace(/:\s*'([^']*)'/g, ':"$1"')
    // Handle problematic strings like C++
    .replace(/(['"])C\+\+(['"])/g, '"C++"')
    .replace(/(['"])C(['"])/g, '"C"')
    // Fix boolean values
    .replace(/:\s*true/gi, ': true')
    .replace(/:\s*false/gi, ': false')
    .replace(/:\s*null/gi, ': null')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Ensure proper resume structure
function ensureResumeStructure(data) {
  const template = getResumeTemplate();

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

// Get empty resume template
function getResumeTemplate() {
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

// Parse resume using AI
async function parseResumeWithAI(text) {
  try {
    console.log('🚀 Starting AI parsing process...');

    const prompt = `You must return ONLY a valid JSON object with NO additional text, explanations, or markdown formatting.

Return this exact structure:
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

IMPORTANT: Start your response with { and end with }. No explanations, no markdown, no additional text.`;

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      console.log('🔄 Trying OpenAI API...');
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'You are a JSON-only resume parser. Return valid JSON with no explanations, markdown, or additional text. Always start with { and end with }.'
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
          const content = response.data.choices[0].message.content.trim();
          const result = cleanAndParseJSON(content);
          console.log('✅ OpenAI parsing completed successfully');
          return result;
        }
      } catch (error) {
        console.error('❌ OpenAI API error:', error.response?.data || error.message);
      }
    }

    // Try DeepSeek as fallback
    if (process.env.DEEPSEEK_API_KEY) {
      console.log('🔄 Trying DeepSeek API...');
      try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: 'You are a JSON-only resume parser. Return valid JSON with no explanations, markdown, or additional text. Always start with { and end with }.'
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
          const content = response.data.choices[0].message.content.trim();
          const result = cleanAndParseJSON(content);
          console.log('✅ DeepSeek parsing completed successfully');
          return result;
        }
      } catch (error) {
        console.error('❌ DeepSeek API error:', error.response?.data || error.message);
      }
    }

    // Manual parsing fallback
    console.log('🔧 Using manual parsing fallback...');
    return parseResumeManually(text);

  } catch (error) {
    console.error('💥 AI parsing completely failed:', error.message);
    return parseResumeManually(text);
  }
}

// Manual parsing fallback
function parseResumeManually(text) {
  console.log('🛠️ Performing manual text parsing...');
  const data = getResumeTemplate();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

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

  // Extract name (first non-email, non-phone line)
  for (const line of lines) {
    if (line.length > 2 && !line.includes('@') && !line.match(/\d{3}/)) {
      data.personalInfo.name = line;
      break;
    }
  }

  console.log('✅ Manual parsing completed');
  return data;
}

// Parse resume endpoint
router.post('/', async (req, res) => {
  try {
    console.log('📝 Parse request received');
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
    console.log(`📄 Text extraction successful, length: ${text.length} characters`);

    // Parse with AI
    const parsedData = await parseResumeWithAI(text);
    console.log('🎉 Resume parsing completed successfully');

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
      console.log('🗑️ File cleanup successful');
    } catch (cleanupError) {
      console.warn('⚠️ File cleanup failed:', cleanupError.message);
    }

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('💥 Parse error:', error);

    // Clean up file on error
    const { filename } = req.body;
    if (filename) {
      try {
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Error cleanup failed:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
