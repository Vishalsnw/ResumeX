const express = require('express');
const router = express.Router();

// Note: In production, add your DeepSeek API key to environment variables
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Generate specific resume content
router.post('/generate-content', async (req, res) => {
  try {
    const { type, personalInfo, context } = req.body;

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ 
        message: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' 
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

    if (!response.ok) {
      throw new Error(data.error?.message || 'DeepSeek API error');
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