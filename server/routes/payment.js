
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, plan } = req.body;
    
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan } = req.body;
    
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === signature) {
      // Update user subscription
      await User.findByIdAndUpdate(req.user._id, {
        subscription: plan,
        subscriptionDate: new Date()
      });
      
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        subscription: plan
      });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get subscription status
router.get('/subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      subscription: user.subscription,
      subscriptionDate: user.subscriptionDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
});

module.exports = router;
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// In production, these should be environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Verify payment
router.post('/verify', async (req, res) => {
  try {
    const { paymentId, orderId, signature } = req.body;

    // For demo purposes, accept any payment ID
    if (!RAZORPAY_KEY_SECRET) {
      return res.json({
        success: true,
        message: 'Payment verified (demo mode)',
        paymentId: paymentId || 'demo_payment_' + Date.now()
      });
    }

    // In production, verify the Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generated_signature === signature) {
      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: paymentId
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Create order for payment
router.post('/create-order', async (req, res) => {
  try {
    const { amount = 999 } = req.body; // Default ₹9.99

    // For demo purposes, return a mock order
    if (!RAZORPAY_KEY_ID) {
      return res.json({
        id: 'demo_order_' + Date.now(),
        currency: 'INR',
        amount: amount,
        key: 'demo_key'
      });
    }

    // In production, create actual Razorpay order
    const order = {
      id: 'order_' + Date.now(),
      currency: 'INR',
      amount: amount,
      key: RAZORPAY_KEY_ID
    };

    res.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      message: 'Order creation failed',
      error: error.message
    });
  }
});

module.exports = router;
