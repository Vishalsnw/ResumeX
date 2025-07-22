
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
    const { jobDescription } = req.body;

    console.log('=== Job Analysis Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Job description length:', jobDescription?.length || 0);
    console.log('Environment check - DEEPSEEK_API_KEY exists:', !!process.env.DEEPSEEK_API_KEY);
    console.log('DEEPSEEK_API_KEY starts with:', process.env.DEEPSEEK_API_KEY?.substring(0, 8) || 'undefined');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('============================');

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job description is required' 
      });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not configured properly');
      return res.status(500).json({ 
        success: false, 
        error: 'AI service not configured. Please check your environment variables.' 
      });
    }

    const prompt = `Analyze this job description and extract key information. Return ONLY a valid JSON object with these exact fields:
{
  "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experienceLevel": "entry-level/mid-level/senior-level/executive",
  "industry": "industry name",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Job Description: ${jobDescription.substring(0, 2000)}`;

    console.log('Making API call to Deepseek...');

    const apiKey = process.env.DEEPSEEK_API_KEY;

    const apiResponse = await axios({
      method: 'POST',
      url: 'https://api.deepseek.com/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AI-Resume-Builder/1.0'
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter and HR analyst. Analyze job descriptions and return only valid JSON without any additional text, markdown formatting, or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    console.log('API Response status:', apiResponse.status);
    console.log('API Response data:', JSON.stringify(apiResponse.data, null, 2));

    if (apiResponse.status === 404) {
      console.error('API endpoint not found. Trying alternative endpoint...');
      const altResponse = await axios({
        method: 'POST',
        url: 'https://api.deepseek.com/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert recruiter and HR analyst. Analyze job descriptions and return only valid JSON without any additional text, markdown formatting, or explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        },
        timeout: 30000
      });

      if (altResponse.status === 200 && altResponse.data) {
        apiResponse.data = altResponse.data;
        apiResponse.status = altResponse.status;
      } else {
        throw new Error(`API endpoint not found. Status: ${apiResponse.status}`);
      }
    } else if (apiResponse.status === 401) {
      throw new Error('Invalid API key - Please check your Deepseek API configuration');
    } else if (apiResponse.status === 429) {
      throw new Error('Rate limit exceeded - Please try again in a moment');
    } else if (apiResponse.status >= 400) {
      throw new Error(`API error ${apiResponse.status}: ${JSON.stringify(apiResponse.data)}`);
    }

    if (!apiResponse.data || !apiResponse.data.choices || !apiResponse.data.choices[0]) {
      throw new Error('Invalid API response structure');
    }

    const aiContent = apiResponse.data.choices[0].message.content;
    console.log('Raw AI response:', aiContent);

    let analysis;
    try {
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      analysis = JSON.parse(cleanContent);

      if (!analysis.requiredSkills || !Array.isArray(analysis.requiredSkills)) {
        throw new Error('Invalid requiredSkills field');
      }
      if (!analysis.experienceLevel || typeof analysis.experienceLevel !== 'string') {
        throw new Error('Invalid experienceLevel field');
      }
      if (!analysis.industry || typeof analysis.industry !== 'string') {
        throw new Error('Invalid industry field');
      }
      if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
        throw new Error('Invalid recommendations field');
      }

      console.log('Successfully parsed analysis:', analysis);

    } catch (parseError) {
      console.warn('Failed to parse AI response:', parseError.message);
      console.warn('AI response was:', aiContent);

      const jobText = jobDescription.toLowerCase();
      const commonSkills = ['communication', 'leadership', 'teamwork', 'problem solving', 'organization', 'microsoft office', 'teaching', 'training', 'presentation', 'curriculum', 'education', 'computer skills', 'technology'];
      const foundSkills = commonSkills.filter(skill => jobText.includes(skill));

      let experienceLevel = 'entry-level';
      if (jobText.includes('senior') || jobText.includes('lead') || jobText.includes('manager')) {
        experienceLevel = 'senior-level';
      } else if (jobText.includes('mid') || jobText.includes('experienced') || jobText.includes('3-5') || jobText.includes('5+')) {
        experienceLevel = 'mid-level';
      }

      let industry = 'Education';
      if (jobText.includes('technology') || jobText.includes('software') || jobText.includes('it ')) {
        industry = 'Technology';
      } else if (jobText.includes('marketing') || jobText.includes('advertising')) {
        industry = 'Marketing';
      } else if (jobText.includes('healthcare') || jobText.includes('medical')) {
        industry = 'Healthcare';
      }

      analysis = {
        requiredSkills: foundSkills.length > 0 ? foundSkills.slice(0, 5).map(skill => 
          skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        ) : ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Technical Skills'],
        experienceLevel: experienceLevel,
        industry: industry,
        recommendations: [
          'Highlight relevant experience prominently in your resume',
          'Include industry-specific keywords from the job description',
          'Quantify your achievements with specific numbers and metrics',
          'Tailor your skills section to match the job requirements',
          'Use action verbs to describe your accomplishments'
        ]
      };

      console.log('Using fallback analysis:', analysis);
    }

    res.json({ success: true, analysis });

  } catch (error) {
    console.error('Job Analysis Error:', error.message);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0],
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data'
    });

    let errorMessage = 'Failed to analyze job description';
    let statusCode = 500;

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network error - Unable to connect to AI service';
      statusCode = 503;
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid API key - Please check your Deepseek API configuration';
      statusCode = 401;
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded - Please try again in a moment';
      statusCode = 429;
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request - Please check your input';
      statusCode = 400;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - Please try again';
      statusCode = 408;
    }

    console.log('=== Sending Error Response ===');
    console.log('Status Code:', statusCode);
    console.log('Error Message:', errorMessage);
    console.log('Error Code:', error.code || 'UNKNOWN_ERROR');
    console.log('==============================');

    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}
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
    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job description is required' 
      });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      // Provide fallback analysis
      const fallbackAnalysis = {
        requiredSkills: ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Technical Skills'],
        experienceLevel: 'mid-level',
        industry: 'Technology',
        recommendations: [
          'Highlight relevant experience prominently',
          'Include industry-specific keywords',
          'Quantify achievements with metrics',
          'Tailor skills to job requirements'
        ]
      };
      
      return res.json({ success: true, analysis: fallbackAnalysis });
    }

    const prompt = `Analyze this job description and extract key information. Return ONLY valid JSON:
{
  "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experienceLevel": "entry-level/mid-level/senior-level/executive",
  "industry": "industry name",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Job Description: ${jobDescription.substring(0, 2000)}`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const aiContent = response.data.choices[0].message.content;
    let cleanContent = aiContent.trim();
    
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    const analysis = JSON.parse(cleanContent);
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('Job Analysis Error:', error);
    
    // Fallback analysis
    const fallbackAnalysis = {
      requiredSkills: ['Communication', 'Problem Solving', 'Teamwork', 'Leadership'],
      experienceLevel: 'mid-level',
      industry: 'General',
      recommendations: ['Tailor resume to job requirements', 'Highlight relevant experience']
    };
    
    res.json({ success: true, analysis: fallbackAnalysis });
  }
}
