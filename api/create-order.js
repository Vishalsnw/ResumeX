
const Razorpay = require('razorpay');

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
    console.log('Payment order request received');
    const { amount, currency = 'INR' } = req.body;

    let razorpay = null;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
      } catch (error) {
        console.error('Razorpay initialization failed:', error.message);
      }
    }

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
}
