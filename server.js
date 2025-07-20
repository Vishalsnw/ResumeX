
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

// AI Resume Generation using Deepseek API
app.post('/api/generate-resume', async (req, res) => {
  try {
    const { personalInfo, experience, skills, jobTitle } = req.body;
    
    const prompt = `Create a professional resume content for ${personalInfo.name}, a ${jobTitle}. 
    Personal Info: ${JSON.stringify(personalInfo)}
    Experience: ${JSON.stringify(experience)}
    Skills: ${JSON.stringify(skills)}
    
    Generate professional summary, enhanced job descriptions, and optimized content for ATS systems. Return as JSON with sections: summary, enhancedExperience, optimizedSkills, additionalSections.`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume writer. Create compelling, ATS-optimized resume content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
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
