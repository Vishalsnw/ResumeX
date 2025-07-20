
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
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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
    
    const prompt = `Analyze this job description and extract:
    1. Required skills and qualifications
    2. Key responsibilities
    3. Important keywords for ATS
    4. Experience level required
    5. Industry focus
    
    Job Description: ${jobDescription}
    
    Return as JSON with: requiredSkills, responsibilities, keywords, experienceLevel, industry, recommendations`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter and HR professional who analyzes job descriptions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const analysis = JSON.parse(response.data.choices[0].message.content);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Job Analysis Error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze job description' });
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
    const { amount, currency = 'INR' } = req.body;
    
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
