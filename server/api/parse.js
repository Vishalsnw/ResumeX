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

// Fallback structure
function getFallbackStructure() {
  return {
    personalInfo: {
      name: '', email: '', phone: '', address: '', linkedin: '', github: ''
    },
    summary: 'Unable to parse resume. Please fill manually.',
    experience: [], education: [], skills: [], projects: [], certifications: []
  };
}

// Validate & complete structure
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

// Parse with DeepSeek using enforced JSON schema
async function parseWithDeepSeek(text) {
  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      tools: [
        {
          type: 'function',
          function: {
            name: 'extractResumeData',
            description: 'Extract structured resume data from text.',
            parameters: {
              type: 'object',
              properties: {
                personalInfo: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                    linkedin: { type: 'string' },
                    github: { type: 'string' }
                  },
                  required: ['name', 'email']
                },
                summary: { type: 'string' },
                experience: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      company: { type: 'string' },
                      position: { type: 'string' },
                      duration: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                education: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      institution: { type: 'string' },
                      degree: { type: 'string' },
                      year: { type: 'string' }
                    }
                  }
                },
                skills: { type: 'array', items: { type: 'string' } },
                projects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      technologies: { type: 'string' }
                    }
                  }
                },
                certifications: { type: 'array', items: { type: 'string' } }
              },
              required: ['personalInfo', 'summary']
            }
          }
        }
      ],
      tool_choice: {
        type: 'function',
        function: { name: 'extractResumeData' }
      },
      messages: [
        {
          role: 'user',
          content: `Extract structured JSON from the following resume:\n\n${text}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const toolCalls = response.data.choices?.[0]?.message?.tool_calls;
  if (!toolCalls || !toolCalls[0]?.function?.arguments) {
    throw new Error('Invalid tool_calls structure from DeepSeek');
  }

  const parsed = JSON.parse(toolCalls[0].function.arguments);
  return ensureValidStructure(parsed);
}

// Main route
router.post('/', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ success: false, error: 'Filename is required' });

    const text = await extractText(filename);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'Resume text is too short' });
    }

    let parsedData;
    try {
      parsedData = await parseWithDeepSeek(text);
    } catch (err) {
      console.error('DeepSeek error:', err.message);
      parsedData = getFallbackStructure();
    }

    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Parsing error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
