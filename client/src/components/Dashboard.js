
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = () => {
    const savedResumes = localStorage.getItem('resumex_resumes');
    if (savedResumes) {
      setResumes(JSON.parse(savedResumes));
    }
  };

  const createNewResume = () => {
    const title = newResumeTitle || 'My Professional Resume';
    const newResume = {
      id: Date.now(),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    };

    const savedResumes = localStorage.getItem('resumex_resumes');
    const existingResumes = savedResumes ? JSON.parse(savedResumes) : [];
    existingResumes.push(newResume);
    
    localStorage.setItem('resumex_resumes', JSON.stringify(existingResumes));
    setNewResumeTitle('');
    setShowCreateModal(false);
    navigate(`/resume/${newResume.id}`);
  };

  const deleteResume = (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      const updatedResumes = resumes.filter(resume => resume.id !== id);
      setResumes(updatedResumes);
      localStorage.setItem('resumex_resumes', JSON.stringify(updatedResumes));
    }
  };

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Create Professional Resumes with
            <span className="gradient-text"> AI Power</span>
          </h1>
          <p className="hero-subtitle">
            Transform your career with AI-enhanced resumes that get you noticed by employers. 
            Upload your existing resume or start from scratch.
          </p>
          <div className="hero-actions">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-large"
            >
              🚀 Create Resume with AI
            </button>
            <button 
              onClick={() => navigate('/resume/new')}
              className="btn btn-outline btn-large"
            >
              📝 Start from Scratch
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card">
            <div className="card-header">
              <div className="card-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
            <div className="card-content">
              <div className="profile-section">
                <div className="profile-avatar"></div>
                <div className="profile-info">
                  <div className="name-line"></div>
                  <div className="title-line"></div>
                </div>
              </div>
              <div className="content-lines">
                <div className="line long"></div>
                <div className="line medium"></div>
                <div className="line short"></div>
                <div className="line medium"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose ResumeX?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Analysis</h3>
              <p>Upload your existing resume and let our AI analyze and enhance it with professional content and industry keywords.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Professional Templates</h3>
              <p>Choose from 6 carefully designed templates optimized for different industries and career levels.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Optimized</h3>
              <p>Create and edit your resume on any device with our fully responsive mobile-first design.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Download</h3>
              <p>Get your professional PDF resume instantly after a one-time payment. No subscriptions required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Your Resumes Section */}
      {resumes.length > 0 && (
        <section className="resumes-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Your Resumes</h2>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                ➕ New Resume
              </button>
            </div>
            <div className="resume-grid">
              {resumes.map(resume => (
                <div key={resume.id} className="resume-card">
                  <div className="resume-preview">
                    <div className="preview-header">
                      <div className="preview-line title"></div>
                      <div className="preview-line subtitle"></div>
                    </div>
                    <div className="preview-content">
                      <div className="preview-line"></div>
                      <div className="preview-line short"></div>
                      <div className="preview-line"></div>
                    </div>
                  </div>
                  <div className="resume-info">
                    <h3>{resume.title}</h3>
                    <p className="resume-date">
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="resume-actions">
                      <button 
                        onClick={() => navigate(`/resume/${resume.id}`)}
                        className="btn btn-primary btn-small"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => deleteResume(resume.id)}
                        className="btn btn-danger btn-small"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Create Resume Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Resume</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Resume Title</label>
                <input
                  type="text"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer Resume"
                  onKeyPress={(e) => e.key === 'Enter' && createNewResume()}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={createNewResume}
                className="btn btn-primary"
              >
                Create Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
