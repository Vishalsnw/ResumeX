
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import APIService from '../services/api';
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
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchResume();
    }
  }, [id, fetchResume]);

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

  const generateAIContent = async (type, context = '') => {
    setAiLoading(true);
    setError('');
    
    try {
      const result = await APIService.generateContent(type, resume.personalInfo, context);
      
      switch (type) {
        case 'summary':
          setResume({
            ...resume,
            personalInfo: {
              ...resume.personalInfo,
              summary: result.content
            }
          });
          break;
        case 'skills':
          // Parse skills from AI response
          const skillsText = result.content;
          const skills = skillsText.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
          setResume({
            ...resume,
            skills: skills
          });
          break;
        default:
          break;
      }
    } catch (error) {
      setError('AI generation failed: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const enhanceResume = async () => {
    setAiLoading(true);
    setError('');
    
    try {
      const enhanced = await APIService.enhanceResume(resume);
      
      setResume({
        ...resume,
        personalInfo: {
          ...resume.personalInfo,
          summary: enhanced.enhancedSummary || resume.personalInfo.summary
        },
        skills: enhanced.enhancedSkills || resume.skills
      });
      
      if (enhanced.suggestions) {
        alert('AI Suggestions:\n' + enhanced.suggestions.join('\n'));
      }
    } catch (error) {
      setError('Resume enhancement failed: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const downloadResume = async () => {
    try {
      const blob = await APIService.generatePDF(resume);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.personalInfo.fullName || 'resume'}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Download failed: ' + error.message);
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
          <button onClick={enhanceResume} className="btn btn-primary" disabled={aiLoading}>
            {aiLoading ? 'Enhancing...' : '✨ Enhance with AI'}
          </button>
          <button onClick={() => setShowPreview(!showPreview)} className="btn btn-info">
            {showPreview ? 'Hide Preview' : 'Preview Resume'}
          </button>
          <button onClick={downloadResume} className="btn btn-success">
            📄 Download Resume
          </button>
          <button onClick={saveResume} className="btn btn-secondary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
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
                disabled={aiLoading}
              >
                {aiLoading ? 'Generating...' : '✨ Generate with AI'}
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

        <div className="section">
          <h3>Skills</h3>
          <div className="skills-input">
            <div className="current-skills">
              {resume.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  <button 
                    onClick={() => {
                      const newSkills = resume.skills.filter((_, i) => i !== index);
                      setResume({ ...resume, skills: newSkills });
                    }}
                    className="remove-skill"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="skill-actions">
              <input
                type="text"
                placeholder="Add a skill..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setResume({
                      ...resume,
                      skills: [...resume.skills, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              <button 
                onClick={() => generateAIContent('skills')}
                className="btn ai-btn"
                disabled={aiLoading}
              >
                {aiLoading ? 'Generating...' : '✨ Generate Skills'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="preview-section">
          <h3>Resume Preview</h3>
          <div className="resume-preview">
            <div className="preview-header">
              <h2>{resume.personalInfo.fullName}</h2>
              <p>{resume.personalInfo.email} | {resume.personalInfo.phone} | {resume.personalInfo.location}</p>
              {resume.personalInfo.linkedin && <p>{resume.personalInfo.linkedin}</p>}
            </div>
            
            {resume.personalInfo.summary && (
              <div className="preview-section-content">
                <h4>Professional Summary</h4>
                <p>{resume.personalInfo.summary}</p>
              </div>
            )}
            
            {resume.skills.length > 0 && (
              <div className="preview-section-content">
                <h4>Skills</h4>
                <div className="preview-skills">
                  {resume.skills.map((skill, index) => (
                    <span key={index} className="preview-skill">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;
