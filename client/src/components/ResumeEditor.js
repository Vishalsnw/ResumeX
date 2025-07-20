
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResumeEditor.css';

const ResumeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState({
    title: 'My Resume',
    template: 'modern',
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchResume();
    }
  }, [id]);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/resumes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResume(response.data);
    } catch (error) {
      setError('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (id) {
        await axios.put(`/api/resumes/${id}`, resume, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const response = await axios.post('/api/resumes', resume, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate(`/resume/${response.data._id}`);
      }
    } catch (error) {
      setError('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const generateAIContent = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/ai/generate-content', {
        type,
        context: resume.personalInfo.summary,
        jobTitle: 'Software Developer',
        experience: '2'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (type === 'summary') {
        setResume({
          ...resume,
          personalInfo: {
            ...resume.personalInfo,
            summary: response.data.content
          }
        });
      }
    } catch (error) {
      setError('AI generation failed');
    }
  };

  const updatePersonalInfo = (field, value) => {
    setResume({
      ...resume,
      personalInfo: {
        ...resume.personalInfo,
        [field]: value
      }
    });
  };

  if (loading) return <div className="loading">Loading resume...</div>;

  return (
    <div className="container">
      <div className="editor-header">
        <input
          type="text"
          value={resume.title}
          onChange={(e) => setResume({ ...resume, title: e.target.value })}
          className="title-input"
        />
        <div className="editor-actions">
          <button onClick={saveResume} className="btn btn-success" disabled={saving}>
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="editor-content">
        <div className="section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={resume.personalInfo.fullName}
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={resume.personalInfo.email}
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={resume.personalInfo.phone}
                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={resume.personalInfo.location}
                onChange={(e) => updatePersonalInfo('location', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Professional Summary</label>
            <div className="ai-input-group">
              <textarea
                value={resume.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                placeholder="Write a brief professional summary..."
              />
              <button 
                onClick={() => generateAIContent('summary')}
                className="btn ai-btn"
              >
                ✨ Generate with AI
              </button>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Template Selection</h3>
          <div className="template-grid">
            {['modern', 'classic', 'creative', 'executive'].map(template => (
              <div 
                key={template}
                className={`template-option ${resume.template === template ? 'selected' : ''}`}
                onClick={() => setResume({ ...resume, template })}
              >
                <div className="template-preview">
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;
