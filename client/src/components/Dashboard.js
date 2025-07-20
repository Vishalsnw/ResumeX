
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = () => {
    try {
      const savedResumes = localStorage.getItem('resumex_resumes');
      if (savedResumes) {
        setResumes(JSON.parse(savedResumes));
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      const updatedResumes = resumes.filter(resume => resume.id !== id);
      setResumes(updatedResumes);
      localStorage.setItem('resumex_resumes', JSON.stringify(updatedResumes));
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  if (loading) return <div className="loading">Loading your resumes...</div>;

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>My Resumes</h1>
        <Link to="/resume/new" className="btn btn-success">
          Create New Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="empty-state">
          <h3>No resumes yet</h3>
          <p>Create your first AI-powered resume to get started!</p>
          <Link to="/resume/new" className="btn btn-success">
            Create Your First Resume
          </Link>
        </div>
      ) : (
        <div className="resume-grid">
          {resumes.map(resume => (
            <div key={resume.id} className="resume-card">
              <h3>{resume.title}</h3>
              <p>Template: {resume.template}</p>
              <p>Last updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
              <div className="resume-actions">
                <Link to={`/resume/${resume.id}`} className="btn">
                  Edit
                </Link>
                <button 
                  onClick={() => deleteResume(resume.id)}
                  className="btn btn-secondary"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
