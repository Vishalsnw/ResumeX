
const express = require('express');
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate resume content suggestions
router.post('/generate-content', auth, async (req, res) => {
  try {
    const { type, context, jobTitle, experience } = req.body;
    
    let prompt = '';
    
    switch (type) {
      case 'summary':
        prompt = `Create a professional resume summary for a ${jobTitle} with ${experience} years of experience. Context: ${context}`;
        break;
      case 'experience':
        prompt = `Write 3-4 bullet points describing achievements for a ${jobTitle} role. Focus on quantifiable results. Context: ${context}`;
        break;
      case 'skills':
        prompt = `List relevant technical and soft skills for a ${jobTitle} position. Separate by categories.`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
});

// Optimize resume for ATS
router.post('/optimize-ats', auth, async (req, res) => {
  try {
    const { resumeContent, jobDescription } = req.body;
    
    const prompt = `Analyze this resume content and suggest improvements for ATS optimization based on the job description. Focus on keywords and formatting:
    
    Resume: ${resumeContent}
    Job Description: ${jobDescription}
    
    Provide specific suggestions for improvement.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.5
    });

    res.json({ suggestions: completion.choices[0].message.content });
  } catch (error) {
    console.error('ATS optimization error:', error);
    res.status(500).json({ message: 'ATS optimization error', error: error.message });
  }
});

module.exports = router;
