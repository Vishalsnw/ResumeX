
const axios = require('axios');

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
    console.log('=== AI Resume Generation Request ===');
    const { personalInfo, experience, skills, jobTitle, targetJobDescription, industryFocus } = req.body;

    if (!personalInfo || !personalInfo.name) {
      return res.status(400).json({ success: false, error: 'Personal information is required' });
    }

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

    Return as JSON with sections: 
    - summary (compelling 3-4 line summary)
    - enhancedExperience (improved job descriptions with metrics)
    - optimizedSkills (categorized and prioritized skills)
    - additionalSections (relevant sections like projects, achievements)
    - atsScore (0-100 score with explanation)
    - improvementSuggestions (array of specific recommendations)
    - keywordMatches (analysis of job description keywords if provided)`;

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      const basicTemplate = createBasicTemplate(req.body);
      return res.json({ success: true, content: basicTemplate });
    }

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume writer with expertise in ATS optimization. Always return valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.7,
      top_p: 0.9
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    let aiContent;
    try {
      const rawContent = response.data.choices[0].message.content;
      let cleanContent = rawContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      aiContent = JSON.parse(cleanContent);
    } catch (parseError) {
      throw new Error('AI response parsing failed - invalid JSON format');
    }

    res.json({ success: true, content: aiContent });
  } catch (error) {
    console.error('AI Generation Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate AI content' });
  }
}

function createBasicTemplate(data) {
  const { personalInfo, experience, skills, jobTitle } = data;
  return {
    summary: `Experienced ${jobTitle || 'Professional'} with strong expertise in ${skills?.slice(0, 3)?.join(', ') || 'various technologies'}.`,
    enhancedExperience: experience?.map(exp => ({
      company: exp.company || 'Company Name',
      position: exp.position || jobTitle || 'Professional',
      description: exp.description || `Successfully contributed to ${exp.company || 'organization'} delivering key results.`
    })) || [],
    optimizedSkills: skills?.length > 0 ? skills : ['Communication', 'Problem Solving', 'Leadership'],
    additionalSections: [],
    atsScore: 85,
    improvementSuggestions: ['Add specific metrics', 'Include relevant keywords', 'Quantify accomplishments'],
    keywordMatches: ['Professional match with industry standards']
  };
}
