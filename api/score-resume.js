
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
    const { resumeContent, jobDescription } = req.body;

    const prompt = `Score this resume against the job description and provide detailed feedback:

    RESUME: ${resumeContent}
    JOB DESCRIPTION: ${jobDescription}

    Provide scores (0-100) for:
    1. Keyword match
    2. Experience relevance
    3. Skills alignment
    4. ATS compatibility
    5. Overall match

    Include specific recommendations for improvement.

    Return as JSON with: scores, overallScore, feedback, recommendations, missingKeywords`;

    const apiKey = process.env.DEEPSEEK_API_KEY;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a resume scoring expert who evaluates candidate-job fit.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.4
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const scoring = JSON.parse(response.data.choices[0].message.content);
    res.json({ success: true, scoring });
  } catch (error) {
    console.error('Resume Scoring Error:', error);
    res.status(500).json({ success: false, error: 'Failed to score resume' });
  }
}
