
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
    const { resumeText, jobDescription, jobTitle } = req.body;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume text is required' 
      });
    }

    // Fallback extraction function
    const extractBasicInfo = (text, title) => {
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      // Extract email
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : 'your.email@example.com';
      
      // Extract phone
      const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{10,}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : '+91 9999999999';
      
      // Extract name
      let name = 'Your Name';
      for (const line of lines) {
        if (!line.includes('@') && !line.match(/[\d\-\(\)]{6,}/) && line.length > 2 && line.length < 50) {
          name = line;
          break;
        }
      }
      
      return {
        personalInfo: {
          name: name,
          email: email,
          phone: phone,
          location: 'Your Location'
        },
        jobTitle: title || 'Professional',
        experience: [{
          company: 'Previous Company',
          position: title || 'Professional',
          startDate: '2023-01-01',
          endDate: '',
          description: 'Key responsibilities and achievements'
        }],
        skills: ['Communication', 'Problem Solving', 'Leadership', 'Technical Skills'],
        education: 'Your Education',
        certifications: ''
      };
    };

    if (!process.env.DEEPSEEK_API_KEY) {
      const fallbackData = extractBasicInfo(resumeText, jobTitle);
      return res.json({ success: true, enhancedData: fallbackData });
    }

    const prompt = `Analyze and enhance this resume. Extract structured information and improve content.

RESUME TEXT: ${resumeText.substring(0, 4000)}
TARGET JOB: ${jobTitle || 'Professional'}

Return JSON with: personalInfo, jobTitle, experience, skills, education, certifications`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a resume enhancement expert. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.4
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const aiContent = response.data.choices[0].message.content;
    let cleanContent = aiContent.trim();
    
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    const enhancedData = JSON.parse(cleanContent);
    res.json({ success: true, enhancedData });
    
  } catch (error) {
    console.error('Resume Enhancement Error:', error);
    
    // Use fallback on error
    const fallbackData = extractBasicInfo(req.body.resumeText, req.body.jobTitle);
    res.json({ success: true, enhancedData: fallbackData });
  }
}

function extractBasicInfo(resumeText, jobTitle) {
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : 'your.email@example.com';
  
  const phoneMatch = resumeText.match(/[\+]?[\d\s\-\(\)]{10,}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '+91 9999999999';
  
  let name = 'Your Name';
  for (const line of lines) {
    if (!line.includes('@') && !line.match(/[\d\-\(\)]{6,}/) && line.length > 2 && line.length < 50) {
      name = line;
      break;
    }
  }
  
  return {
    personalInfo: { name, email, phone, location: 'Your Location' },
    jobTitle: jobTitle || 'Professional',
    experience: [{
      company: 'Previous Company',
      position: jobTitle || 'Professional',
      startDate: '2023-01-01',
      endDate: '',
      description: 'Key responsibilities and achievements'
    }],
    skills: ['Communication', 'Problem Solving', 'Leadership'],
    education: 'Your Education',
    certifications: ''
  };
}
