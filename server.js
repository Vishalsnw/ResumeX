const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Razorpay
let razorpay = null;
console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...` : 'Missing');
console.log('Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET ? `${process.env.RAZORPAY_KEY_SECRET.substring(0, 10)}...` : 'Missing');

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    process.env.RAZORPAY_KEY_ID !== 'your_actual_razorpay_key_id_here' &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_actual_razorpay_secret_here') {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay initialized successfully');
  } catch (error) {
    console.error('Razorpay initialization failed:', error.message);
  }
} else {
  console.warn('Razorpay not initialized - Missing or invalid credentials');
}

// Enhanced AI Resume Generation with multiple features
app.post('/api/generate-resume', async (req, res) => {
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
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiContent = JSON.parse(response.data.choices[0].message.content);
    res.json({ success: true, content: aiContent });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI content' });
  }
});

// Job Description Analysis
app.post('/api/analyze-job', async (req, res) => {
  try {
    const { jobDescription } = req.body;

    console.log('Job analysis request received');
    console.log('Job description length:', jobDescription?.length || 0);
    console.log('Environment check - DEEPSEEK_API_KEY exists:', !!process.env.DEEPSEEK_API_KEY);

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job description is required' 
      });
    }

    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.includes('your_actual_deepseek_api_key_here')) {
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
    
    const apiResponse = await axios({
      method: 'POST',
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      timeout: 25000
    });

    console.log('API Response status:', apiResponse.status);
    
    if (!apiResponse.data || !apiResponse.data.choices || !apiResponse.data.choices[0]) {
      throw new Error('Invalid API response structure');
    }

    const aiContent = apiResponse.data.choices[0].message.content;
    console.log('Raw AI response:', aiContent);

    let analysis;
    try {
      // Clean the response - remove any markdown formatting
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      analysis = JSON.parse(cleanContent);
      
      // Validate required fields
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
      
      // Provide fallback analysis
      analysis = {
        requiredSkills: ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Technical Skills'],
        experienceLevel: 'mid-level',
        industry: 'Technology',
        recommendations: [
          'Highlight relevant experience prominently',
          'Include industry-specific keywords',
          'Quantify your achievements with numbers',
          'Tailor your skills section to match requirements'
        ]
      };
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
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Resume Scoring and Feedback
app.post('/api/score-resume', async (req, res) => {
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
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const scoring = JSON.parse(response.data.choices[0].message.content);
    res.json({ success: true, scoring });
  } catch (error) {
    console.error('Resume Scoring Error:', error);
    res.status(500).json({ success: false, error: 'Failed to score resume' });
  }
});

// Create Razorpay order for premium features
app.post('/api/create-order', async (req, res) => {
  try {
    console.log('Payment order request received');
    const { amount, currency = 'INR' } = req.body;

    if (!razorpay) {
      console.error('Razorpay not initialized');
      return res.status(400).json({ 
        success: false, 
        error: 'Payment service not configured. Please check Razorpay credentials.' 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount specified' 
      });
    }

    console.log(`Creating order for amount: ${amount} ${currency}`);

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        purpose: 'AI Resume Builder Premium'
      }
    });

    console.log('Order created successfully:', order.id);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Payment Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    let errorMessage = 'Failed to create payment order';
    if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
      errorMessage = 'Invalid payment request - Please check your details';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature logic here
    const crypto = require('crypto');
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Health check and environment status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    hasDeepseekKey: !!(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_actual_deepseek_api_key_here'),
    hasRazorpayKeys: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
                       process.env.RAZORPAY_KEY_ID !== 'your_actual_razorpay_key_id_here'),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Deepseek API Key: ${process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`Razorpay Keys: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Missing'}`);
});