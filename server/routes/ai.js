const express = require('express');
const router = express.Router();

// Note: In production, add your DeepSeek API key to environment variables
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

console.log('DEEPSEEK_API_KEY configured:', !!DEEPSEEK_API_KEY);

// Generate specific resume content
router.post('/generate-content', async (req, res) => {
  try {
    const { type, personalInfo, context } = req.body;

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ 
        message: 'DeepSeek API key not configured. Please add DEEPSEEK_API_KEY to your environment variables.' 
      });
    }

    let prompt = '';

    switch (type) {
      case 'summary':
        prompt = `Create a professional resume summary for ${personalInfo.fullName}. 
        Job Title/Field: ${context || 'General'}
        Email: ${personalInfo.email}
        Location: ${personalInfo.location}
        Current Summary: ${personalInfo.summary || 'None provided'}

        Write a compelling 2-3 sentence professional summary that highlights their expertise and value proposition. Make it specific and impactful.`;
        break;

      case 'skills':
        prompt = `Based on the following information, suggest relevant technical and soft skills:
        Name: ${personalInfo.fullName}
        Field/Industry: ${context || 'General'}
        Current Skills: ${personalInfo.skills || 'None listed'}

        Provide a well-organized list of skills categorized into Technical Skills and Soft Skills. Make them relevant to their field.`;
        break;

      case 'experience':
        prompt = `Create professional experience bullet points for:
        Position: ${context}
        Industry context based on: ${personalInfo.fullName}'s background

        Generate 3-4 compelling bullet points that:
        - Start with strong action verbs
        - Include quantifiable achievements where possible
        - Demonstrate impact and results
        - Are tailored to the specified role`;
        break;

      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    console.log('Making DeepSeek API request with prompt:', prompt.substring(0, 100) + '...');
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional resume writer with 10+ years of experience. Create compelling, ATS-friendly content that helps candidates stand out."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log('DeepSeek API response status:', response.status);
    
    if (!response.ok) {
      console.error('DeepSeek API error:', data);
      throw new Error(data.error?.message || `DeepSeek API error: ${response.status}`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    res.json({ content: data.choices[0].message.content });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      message: 'AI content generation failed', 
      error: error.message 
    });
  }
});

// Analyze uploaded resume file
router.post('/analyze-resume', async (req, res) => {
  try {
    // In a real implementation, you would:
    // 1. Parse the uploaded PDF/DOC file
    // 2. Extract text using libraries like pdf-parse or mammoth
    // 3. Use AI to analyze and structure the content

    // For now, simulate analysis with DeepSeek AI
    const analysisPrompt = `Analyze this resume and extract structured information. Return a JSON object with:
    {
      "personalInfo": {
        "fullName": "string",
        "email": "string", 
        "phone": "string",
        "location": "string",
        "summary": "string"
      },
      "experience": [
        {
          "title": "string",
          "company": "string", 
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM",
          "description": "string"
        }
      ],
      "skills": ["skill1", "skill2"],
      "education": [
        {
          "degree": "string",
          "school": "string",
          "year": "string"
        }
      ]
    }

    Extract information from a typical professional resume format.`;

    if (!DEEPSEEK_API_KEY) {
      // Return demo data if no API key
      return res.json({
        personalInfo: {
          fullName: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1 (555) 987-6543',
          location: 'San Francisco, CA',
          summary: 'Results-driven marketing professional with 8+ years of experience in digital marketing, brand strategy, and team leadership. Proven track record of increasing ROI by 150% and managing multi-million dollar campaigns.'
        },
        experience: [
          {
            title: 'Senior Marketing Manager',
            company: 'Digital Innovations Corp',
            startDate: '2021-03',
            endDate: '2024-01',
            description: 'Led comprehensive digital marketing strategies resulting in 45% increase in lead generation. Managed cross-functional teams of 12 members and optimized campaign performance across multiple channels.'
          },
          {
            title: 'Marketing Specialist',
            company: 'Growth Solutions LLC',
            startDate: '2019-01',
            endDate: '2021-02',
            description: 'Developed and executed integrated marketing campaigns that increased brand awareness by 60%. Collaborated with sales teams to create targeted content and improve conversion rates.'
          }
        ],
        skills: [
          'Digital Marketing',
          'Brand Strategy',
          'Google Analytics',
          'SEO/SEM',
          'Social Media Marketing',
          'Project Management',
          'Team Leadership',
          'Data Analysis'
        ],
        education: [
          {
            degree: 'Master of Business Administration (MBA)',
            school: 'Stanford Graduate School of Business',
            year: '2018'
          },
          {
            degree: 'Bachelor of Arts in Marketing',
            school: 'University of California, Berkeley',
            year: '2016'
          }
        ]
      });
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser. Always respond with valid JSON format containing the exact structure requested."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    try {
      const analyzedData = JSON.parse(data.choices[0].message.content);
      res.json(analyzedData);
    } catch (parseError) {
      // Return structured demo data if parsing fails
      res.json({
        personalInfo: {
          fullName: 'Professional Candidate',
          email: 'candidate@email.com',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY',
          summary: 'Experienced professional with demonstrated expertise in industry best practices and innovative solution development.'
        },
        experience: [],
        skills: ['Communication', 'Problem Solving', 'Leadership', 'Project Management'],
        education: []
      });
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ 
      message: 'Resume analysis failed', 
      error: error.message 
    });
  }
});

// Enhance complete resume
router.post('/enhance-resume', async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ 
        message: 'OpenAI API key not configured' 
      });
    }

    const prompt = `Enhance this resume to make it more professional and ATS-friendly:

    Name: ${resumeData.personalInfo.fullName}
    Email: ${resumeData.personalInfo.email}
    Phone: ${resumeData.personalInfo.phone}
    Location: ${resumeData.personalInfo.location}
    LinkedIn: ${resumeData.personalInfo.linkedin}
    Summary: ${resumeData.personalInfo.summary}

    Skills: ${resumeData.skills.join(', ')}

    Provide an enhanced version with:
    1. A compelling professional summary (2-3 sentences)
    2. Improved and categorized skills list
    3. Professional formatting suggestions
    4. Industry-specific keywords

    Return the response as a JSON object with: enhancedSummary, enhancedSkills (array), suggestions (array of improvement tips)`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert resume writer. Always respond with valid JSON format containing enhancedSummary, enhancedSkills array, and suggestions array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    try {
      const enhancedContent = JSON.parse(data.choices[0].message.content);
      res.json(enhancedContent);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      res.json({
        enhancedSummary: data.choices[0].message.content,
        enhancedSkills: resumeData.skills,
        suggestions: ["Please review the AI-generated content and apply manually."]
      });
    }
  } catch (error) {
    console.error('Resume enhancement error:', error);
    res.status(500).json({ 
      message: 'Resume enhancement failed', 
      error: error.message 
    });
  }
});

module.exports = router;