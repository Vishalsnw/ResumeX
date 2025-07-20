
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import APIService from '../services/api';
import './ResumeEditor.css';

const ResumeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState({
    title: 'My Professional Resume',
    template: 'executive',
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
    certifications: [],
    languages: [],
    achievements: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const templates = [
    { id: 'executive', name: 'Executive', description: 'Clean and professional for leadership roles' },
    { id: 'modern', name: 'Modern', description: 'Contemporary design with subtle colors' },
    { id: 'creative', name: 'Creative', description: 'Bold design for creative professionals' },
    { id: 'academic', name: 'Academic', description: 'Traditional format for academic positions' },
    { id: 'technical', name: 'Technical', description: 'Optimized for engineering and tech roles' },
    { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple design' }
  ];

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      setError('Please upload a PDF or Word document');
      return;
    }

    setAnalyzing(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${APIService.baseURL}/api/ai/analyze-resume`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const analyzedData = await response.json();
      
      // Fill form with extracted data
      setResume({
        ...resume,
        personalInfo: {
          ...resume.personalInfo,
          ...analyzedData.personalInfo
        },
        experience: analyzedData.experience || [],
        education: analyzedData.education || [],
        skills: analyzedData.skills || [],
        projects: analyzedData.projects || [],
        certifications: analyzedData.certifications || []
      });

      setError('');
    } catch (error) {
      setError('Failed to analyze resume: ' + error.message);
    } finally {
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const saveResume = () => {
    setSaving(true);
    try {
      const savedResumes = localStorage.getItem('resumex_resumes');
      let resumes = savedResumes ? JSON.parse(savedResumes) : [];
      
      if (id) {
        const index = resumes.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
          resumes[index] = { ...resume, updatedAt: new Date().toISOString() };
        }
      } else {
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
          const skillsText = result.content;
          const skills = skillsText.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
          setResume({
            ...resume,
            skills: skills
          });
          break;
        case 'experience':
          const newExperience = {
            title: context.title || '',
            company: context.company || '',
            startDate: context.startDate || '',
            endDate: context.endDate || '',
            description: result.content
          };
          setResume({
            ...resume,
            experience: [...resume.experience, newExperience]
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

  const enhanceCompleteResume = async () => {
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
        skills: enhanced.enhancedSkills || resume.skills,
        experience: enhanced.enhancedExperience || resume.experience
      });
      
      if (enhanced.suggestions) {
        alert('AI Enhancement Complete!\n\nSuggestions:\n' + enhanced.suggestions.join('\n'));
      }
    } catch (error) {
      setError('Resume enhancement failed: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const downloadResume = async () => {
    try {
      // Check if user has paid - implement payment check here
      const hasPaid = localStorage.getItem('resumex_payment_verified');
      
      if (!hasPaid) {
        // Redirect to payment
        navigate('/payment', { state: { resumeId: resume.id } });
        return;
      }

      const blob = await APIService.generatePDF(resume);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.personalInfo.fullName || 'resume'}.pdf`;
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

  const addExperience = () => {
    setResume({
      ...resume,
      experience: [...resume.experience, {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    });
  };

  const updateExperience = (index, field, value) => {
    const updatedExperience = resume.experience.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    setResume({ ...resume, experience: updatedExperience });
  };

  const removeExperience = (index) => {
    const updatedExperience = resume.experience.filter((_, i) => i !== index);
    setResume({ ...resume, experience: updatedExperience });
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
          placeholder="Enter resume title"
        />
        <div className="editor-actions">
          <button onClick={enhanceCompleteResume} className="btn btn-primary" disabled={aiLoading}>
            {aiLoading ? 'Enhancing...' : '🚀 AI Enhancement'}
          </button>
          <button onClick={() => setShowPreview(!showPreview)} className="btn btn-info">
            {showPreview ? 'Hide Preview' : '👁️ Preview'}
          </button>
          <button onClick={downloadResume} className="btn btn-premium">
            💎 Download Premium PDF
          </button>
          <button onClick={saveResume} className="btn btn-secondary" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
            ← Dashboard
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="editor-layout">
        <div className="editor-content">
          <div className="section upload-section">
            <h3>📄 Upload Existing Resume</h3>
            <div className="upload-area">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="file-input"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="upload-label">
                {analyzing ? (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span>Analyzing resume... {uploadProgress}%</span>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📤</div>
                    <span>Drag & drop your resume or click to upload</span>
                    <small>PDF, DOC, DOCX supported</small>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="section">
            <h3>🎨 Professional Templates</h3>
            <div className="template-grid">
              {templates.map(template => (
                <div 
                  key={template.id}
                  className={`template-card ${resume.template === template.id ? 'selected' : ''}`}
                  onClick={() => setResume({ ...resume, template: template.id })}
                >
                  <div className="template-preview">
                    <div className="template-header"></div>
                    <div className="template-content">
                      <div className="template-line long"></div>
                      <div className="template-line medium"></div>
                      <div className="template-line short"></div>
                    </div>
                  </div>
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>👤 Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={resume.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={resume.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={resume.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={resume.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="New York, NY"
                />
              </div>
              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input
                  type="url"
                  value={resume.personalInfo.linkedin}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div className="form-group">
                <label>Website/Portfolio</label>
                <input
                  type="url"
                  value={resume.personalInfo.website}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  placeholder="https://johndoe.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Professional Summary *</label>
              <div className="ai-input-group">
                <textarea
                  value={resume.personalInfo.summary}
                  onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  placeholder="Write a compelling professional summary that highlights your expertise..."
                  rows="4"
                />
                <button 
                  onClick={() => generateAIContent('summary')}
                  className="btn ai-btn"
                  disabled={aiLoading}
                >
                  {aiLoading ? '🤖 Generating...' : '✨ AI Generate'}
                </button>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>💼 Work Experience</h3>
            {resume.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="experience-header">
                  <h4>Experience #{index + 1}</h4>
                  <button
                    onClick={() => removeExperience(index)}
                    className="btn btn-danger-small"
                  >
                    🗑️ Remove
                  </button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <div className="ai-input-group">
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Describe your achievements and responsibilities..."
                      rows="3"
                    />
                    <button 
                      onClick={() => generateAIContent('experience', exp)}
                      className="btn ai-btn"
                      disabled={aiLoading}
                    >
                      ✨ AI Enhance
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addExperience} className="btn btn-outline">
              ➕ Add Experience
            </button>
          </div>

          <div className="section">
            <h3>🎯 Skills</h3>
            <div className="skills-section">
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
                  placeholder="Add a skill and press Enter..."
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
                  {aiLoading ? '🤖 Generating...' : '✨ AI Suggest Skills'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="preview-panel">
            <div className="preview-header">
              <h3>📋 Live Preview</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="btn btn-outline-small"
              >
                ✕ Close
              </button>
            </div>
            <div className={`resume-preview template-${resume.template}`}>
              <div className="preview-content">
                <div className="preview-header-section">
                  <h2>{resume.personalInfo.fullName || 'Your Name'}</h2>
                  <div className="contact-info">
                    {resume.personalInfo.email && <span>📧 {resume.personalInfo.email}</span>}
                    {resume.personalInfo.phone && <span>📱 {resume.personalInfo.phone}</span>}
                    {resume.personalInfo.location && <span>📍 {resume.personalInfo.location}</span>}
                  </div>
                  {resume.personalInfo.linkedin && (
                    <div className="social-links">
                      <span>🔗 {resume.personalInfo.linkedin}</span>
                    </div>
                  )}
                </div>
                
                {resume.personalInfo.summary && (
                  <div className="preview-section">
                    <h4>Professional Summary</h4>
                    <p>{resume.personalInfo.summary}</p>
                  </div>
                )}
                
                {resume.experience.length > 0 && (
                  <div className="preview-section">
                    <h4>Work Experience</h4>
                    {resume.experience.map((exp, index) => (
                      <div key={index} className="experience-preview">
                        <div className="exp-header">
                          <strong>{exp.title}</strong> at <strong>{exp.company}</strong>
                          <span className="dates">{exp.startDate} - {exp.endDate || 'Present'}</span>
                        </div>
                        <p>{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {resume.skills.length > 0 && (
                  <div className="preview-section">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
