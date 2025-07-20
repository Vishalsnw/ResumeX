
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  }, [id, fetchResume]);

  const fetchResume = useCallback(() => {
    setLoading(true);
    try {
      const savedResumes = localStorage.getItem('resumex_resumes');
      if (savedResumes) {
        const resumes = JSON.parse(savedResumes);
        const foundResume = resumes.find(r => r.id === parseInt(id));
        if (foundResume) {
          setResume(foundResume);
        } else {
          setError('Resume not found');
        }
      }
    } catch (error) {
      setError('Failed to load resume');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const saveResume = () => {
    setSaving(true);
    try {
      const savedResumes = localStorage.getItem('resumex_resumes');
      let resumes = savedResumes ? JSON.parse(savedResumes) : [];
      
      if (id) {
        // Update existing resume
        const index = resumes.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
          resumes[index] = { ...resume, updatedAt: new Date().toISOString() };
        }
      } else {
        // Create new resume
        const newResume = {
          ...resume,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        resumes.push(newResume);
        navigate(`/resume/${newResume.id}`);
      }
      
      localStorage.setItem('resumex_resumes', JSON.stringify(resumes));
    } catch (error) {
      setError('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const generateAIContent = async (type) => {
    try {
      // Mock AI content generation for demo
      let content = '';
      
      switch (type) {
        case 'summary':
          content = 'Experienced professional with a strong background in delivering high-quality results. Proven track record of success in collaborative environments with excellent communication and problem-solving skills.';
          break;
        default:
          content = 'AI-generated content';
      }
      
      if (type === 'summary') {
        setResume({
          ...resume,
          personalInfo: {
            ...resume.personalInfo,
            summary: content
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
