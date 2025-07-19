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

// Parse resume using AI
async function parseResumeWithAI(text) {
  try {
    console.log('Starting AI parsing...');

    const prompt = `CRITICAL: Your response must be ONLY valid JSON with no additional text, explanations, or formatting.

Extract resume information and return ONLY this JSON structure:

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

Resume text:
${text}

RETURN ONLY THE JSON OBJECT WITH NO OTHER TEXT OR MARKDOWN FORMATTING.`;

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI API...');
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a resume parser. You MUST return ONLY valid JSON with absolutely no additional text, explanations, markdown formatting, or code blocks. Your entire response should be parseable JSON starting with { and ending with }.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        if (!response.data || !response.data.choices || !response.data.choices[0]) {
          throw new Error('Invalid response structure from OpenAI');
        }

        const rawContent = response.data.choices[0].message.content.trim();
        console.log('OpenAI raw response:', rawContent.substring(0, 200) + '...');

        // Use robust JSON cleaning and validation
        const parsedData = cleanAndValidateJSON(rawContent);
        console.log('OpenAI parsing successful');
        return parsedData;

      } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          console.log('OpenAI API key invalid, falling back to DeepSeek...');
        } else if (error.response?.status === 429) {
          console.log('OpenAI rate limit hit, falling back to DeepSeek...');
        }
      }
    }

    // Try DeepSeek API if available
    if (process.env.DEEPSEEK_API_KEY) {
      console.log('Using DeepSeek API...');
      try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a resume parser. You MUST return ONLY valid JSON with absolutely no additional text, explanations, markdown formatting, or code blocks. Your entire response should be parseable JSON starting with { and ending with }.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const rawContent = response.data.choices[0].message.content.trim();
        console.log('DeepSeek raw response:', rawContent.substring(0, 200) + '...');

        // Use robust JSON cleaning and validation
        const parsedData = cleanAndValidateJSON(rawContent);
        console.log('DeepSeek parsing successful');
        return parsedData;

      } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          console.log('OpenAI API key invalid, falling back to DeepSeek...');
        } else if (error.response?.status === 429) {
          console.log('OpenAI rate limit hit, falling back to DeepSeek...');
        }
      }
    }

    // Fallback to HuggingFace
    if (process.env.HUGGINGFACE_API_KEY) {
      console.log('Using HuggingFace API...');
      try {
        const response = await axios.post('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
          inputs: prompt,
          parameters: {
            max_new_tokens: 2000,
            temperature: 0.1
          }
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        if (response.data && response.data[0] && response.data[0].generated_text) {
          let content = response.data[0].generated_text.replace(prompt, '').trim();
          content = content.replace(/```json/g, '').replace(/```/g, '').trim();

          const parsed = JSON.parse(content);
          console.log('HuggingFace parsing successful');
          return parsed;
        }
      } catch (hfError) {
        console.error('HuggingFace failed:', hfError.message);
      }
    }

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

  // Extract phone - improved regex
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) data.personalInfo.phone = phoneMatch[0];

  // Extract LinkedIn
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/[\w-]+|linkedin\.com\/profile\/[\w-]+)/i);
  if (linkedinMatch) data.personalInfo.linkedin = 'https://' + linkedinMatch[0];

  // Extract GitHub
  const githubMatch = text.match(/(?:github\.com\/[\w-]+)/i);
  if (githubMatch) data.personalInfo.github = 'https://' + githubMatch[0];

  // Extract name (first meaningful line, not email or phone)
  for (let line of lines) {
    if (line.length > 2 && !line.includes('@') && !line.match(/\d{3}/)) {
      data.personalInfo.name = line;
      break;
    }
  }

  // Extract skills
  const skillsSection = text.match(/(?:skills|technical skills|technologies|competencies)[:\s]*([^]*?)(?:\n\s*\n|experience|education|$)/i);
  if (skillsSection) {
    const skillsText = skillsSection[1];
    data.skills = skillsText.split(/[,\n•·\-\|]/)
      .map(skill => skill.trim())
      .filter(skill => skill && skill.length > 1 && skill.length < 50);
  }

  // Extract summary/objective
  const summarySection = text.match(/(?:summary|objective|profile|about)[:\s]*([^]*?)(?:\n\s*\n|experience|education|skills|$)/i);
  if (summarySection) {
    data.summary = summarySection[1].trim().replace(/\n/g, ' ').substring(0, 500);
  }

  // Extract basic experience info
  const expMatches = text.match(/(?:experience|employment|work history)[:\s]*([^]*?)(?:\n\s*\n|education|skills|$)/i);
  if (expMatches) {
    const expText = expMatches[1];
    const companies = expText.match(/[A-Z][a-zA-Z\s&.,]+(?=\s*\n|\s*\d{4}|\s*present|\s*current)/g);

    if (companies && companies.length > 0) {
      companies.slice(0, 3).forEach(company => {
        data.experience.push({
          company: company.trim(),
          position: 'Position',
          startDate: '',
          endDate: '',
          description: ''
        });
      });
    }
  }

  // Extract basic education info
  const eduMatches = text.match(/(?:education|academic)[:\s]*([^]*?)(?:\n\s*\n|experience|skills|$)/i);
  if (eduMatches) {
    const eduText = eduMatches[1];
    const institutions = eduText.match(/[A-Z][a-zA-Z\s&.,]+(?:university|college|institute|school)/gi);

    if (institutions && institutions.length > 0) {
      institutions.slice(0, 2).forEach(institution => {
        data.education.push({
          institution: institution.trim(),
          degree: 'Degree',
          field: '',
          startDate: '',
          endDate: '',
          gpa: ''
        });
      });
    }
  }

  console.log('Manual parsing completed');
  return data;
}

// Utility function to clean and validate JSON
function cleanAndValidateJSON(jsonString) {
  console.log('Starting JSON cleaning for content:', jsonString.substring(0, 100) + '...');
  
  // Step 1: Remove markdown code blocks and common prefixes
  let content = jsonString
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .replace(/^(here|the|this|json|response|result|data)[\s:]*\n?/gi, '') // Remove common AI prefixes
    .trim();

  // Step 2: Try direct parsing first
  try {
    const parsed = JSON.parse(content);
    console.log('Direct JSON parsing successful');
    return addFallbackStructure(parsed);
  } catch (jsonError) {
    console.warn('Direct JSON parse failed:', jsonError.message);
  }

  // Step 3: Extract JSON object from text
  try {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
      content = content.substring(jsonStart, jsonEnd + 1);
      console.log('Extracted JSON content:', content.substring(0, 100) + '...');
      
      // Try parsing extracted content
      const parsed = JSON.parse(content);
      console.log('Extracted JSON parsing successful');
      return addFallbackStructure(parsed);
    }
  } catch (extractError) {
    console.warn('JSON extraction failed:', extractError.message);
  }

  // Step 4: Advanced cleaning for common issues
  try {
    // Fix common JSON issues
    content = content
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single quotes to double quotes
      .replace(/(['"])C(\+{1,2})?(['"])/g, '"C$2"') // Handle C++ safely
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\t/g, ' ') // Remove tabs
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const parsed = JSON.parse(content);
    console.log('Advanced cleaning successful');
    return addFallbackStructure(parsed);
  } catch (cleanError) {
    console.warn('Advanced cleaning failed:', cleanError.message);
  }

  // Step 5: Try to extract individual fields using regex
  try {
    console.log('Attempting field-by-field extraction...');
    const fallbackData = {
      personalInfo: extractFieldFromText(jsonString, 'personalInfo') || {},
      summary: extractFieldFromText(jsonString, 'summary') || '',
      experience: extractFieldFromText(jsonString, 'experience') || [],
      education: extractFieldFromText(jsonString, 'education') || [],
      skills: extractFieldFromText(jsonString, 'skills') || [],
      projects: extractFieldFromText(jsonString, 'projects') || [],
      certifications: extractFieldFromText(jsonString, 'certifications') || []
    };
    
    console.log('Field extraction completed');
    return addFallbackStructure(fallbackData);
  } catch (fieldError) {
    console.warn('Field extraction failed:', fieldError.message);
  }

  // Step 6: Complete fallback
  console.warn('All JSON parsing attempts failed, returning empty structure');
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

// Helper function to extract individual fields from malformed JSON text
function extractFieldFromText(text, fieldName) {
  try {
    const fieldRegex = new RegExp(`["']${fieldName}["']\\s*:\\s*([\\s\\S]*?)(?=,\\s*["'][^"']*["']\\s*:|$)`, 'i');
    const match = text.match(fieldRegex);
    
    if (match && match[1]) {
      const fieldValue = match[1].trim().replace(/,$/, '');
      return JSON.parse(fieldValue);
    }
  } catch (error) {
    console.warn(`Failed to extract field ${fieldName}:`, error.message);
  }
  return null;
}

// Helper function to ensure all required fields exist
function addFallbackStructure(data) {
  return {
    personalInfo: {
      name: data.personalInfo?.name || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      address: data.personalInfo?.address || '',
      linkedin: data.personalInfo?.linkedin || '',
      github: data.personalInfo?.github || '',
      ...data.personalInfo
    },
    summary: data.summary || '',
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : []
  };
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
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine file type
    const fileType = filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Extract text
    const text = await extractText(filePath, fileType);

    // Parse with AI
    const parsedData = await parseResumeWithAI(text);

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
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      console.warn('Could not clean up file:', cleanupError.message);
    }

    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;