
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import APIService from '../services/api';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  
  const resumeId = location.state?.resumeId;

  useEffect(() => {
    if (!resumeId) {
      navigate('/dashboard');
    }
  }, [resumeId, navigate]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // In a real implementation, integrate with Razorpay
      // For demo purposes, simulate payment success
      
      if (paymentMethod === 'razorpay') {
        // Simulate Razorpay payment
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'demo_key',
          amount: 999, // ₹9.99 in paise
          currency: 'INR',
          name: 'ResumeX Premium',
          description: 'Professional Resume Download',
          handler: async function (response) {
            try {
              const verification = await APIService.verifyPayment(response.razorpay_payment_id);
              if (verification.success) {
                navigate(`/resume/${resumeId}`, { 
                  state: { paymentSuccess: true } 
                });
              }
            } catch (error) {
              setError('Payment verification failed');
            }
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com'
          },
          theme: {
            color: '#667eea'
          }
        };

        // For demo, just mark as paid
        localStorage.setItem('resumex_payment_verified', 'true');
        navigate(`/resume/${resumeId}`, { 
          state: { paymentSuccess: true } 
        });
      }
    } catch (error) {
      setError('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h2>💎 ResumeX Premium</h2>
          <p>Unlock professional resume downloads</p>
        </div>

        <div className="payment-features">
          <h3>What you get:</h3>
          <ul>
            <li>✅ High-quality PDF download</li>
            <li>✅ Professional formatting</li>
            <li>✅ ATS-optimized layout</li>
            <li>✅ Multiple template options</li>
            <li>✅ Lifetime access to this resume</li>
          </ul>
        </div>

        <div className="payment-pricing">
          <div className="price">
            <span className="currency">₹</span>
            <span className="amount">9.99</span>
            <span className="period">one-time</span>
          </div>
          <p className="price-description">Per resume download</p>
        </div>

        <div className="payment-methods">
          <h3>Payment Method:</h3>
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="payment-method-info">
                <strong>Razorpay</strong>
                <span>Credit/Debit Card, UPI, Net Banking</span>
              </div>
            </label>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="payment-actions">
          <button
            onClick={handlePayment}
            className="btn btn-premium"
            disabled={loading}
          >
            {loading ? 'Processing...' : '💳 Pay ₹9.99 & Download'}
          </button>
          <button
            onClick={() => navigate(`/resume/${resumeId}`)}
            className="btn btn-outline"
          >
            ← Back to Editor
          </button>
        </div>

        <div className="payment-security">
          <p>🔒 Secure payment powered by Razorpay</p>
          <p>💯 100% satisfaction guarantee</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
