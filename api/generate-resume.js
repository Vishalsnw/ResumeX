import axios from 'axios';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { personalInfo, experience, skills, jobTitle, targetJobDescription, industryFocus } = req.body;

    const prompt = `As an expert resume writer and career coach, create a highly optimized resume for ${personalInfo.name}, targeting a ${jobTitle} position.

    CANDIDATE DATA:
    Personal Info: ${JSON.stringify(personalInfo)}
    Experience: ${JSON.stringify(experience)}
    Skills: ${JSON.stringify(skills)}
    Target Job: ${targetJobDescription || 'Not specified'}
    Industry Focus: ${industryFocus || 'General'}

    REQUIREMENTS:
    1. Create an ATS-optimized professional summary with power words
    2. Enhance job descriptions with quantified achievements and action verbs
    3. Optimize skills section with relevant keywords for the target role
    4. Generate industry-specific sections if relevant
    5. Include an ATS compliance score and recommendations
    6. Suggest improvements for better job matching

    Return as JSON with sections: 
    - summary (compelling 3-4 line summary)
    - enhancedExperience (improved job descriptions with metrics)
    - optimizedSkills (categorized and prioritized skills)
    - additionalSections (relevant sections like projects, achievements)
    - atsScore (0-100 score with explanation)
    - improvementSuggestions (array of specific recommendations)
    - keywordMatches (analysis of job description keywords if provided)`;

    const apiKey = process.env.DEEPSEEK_API_KEY;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume writer with expertise in ATS optimization, career coaching, and industry-specific resume strategies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.6
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const aiContent = JSON.parse(response.data.choices[0].message.content);
    
    if (aiContent) {
      res.json({ success: true, content: aiContent });
    } else {
      res.status(500).json({ success: false, error: 'AI content generation failed' });
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI content' });
  }
}