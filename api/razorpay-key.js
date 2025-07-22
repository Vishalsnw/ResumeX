export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.status(400).json({ 
        success: false, 
        error: 'Razorpay key not configured' 
      });
    }

    res.json({ 
      success: true, 
      key: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error('Razorpay key fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Razorpay key' 
    });
  }
}