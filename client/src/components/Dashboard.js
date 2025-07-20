
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/resumes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(response.data);
    } catch (error) {
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/resumes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(resumes.filter(resume => resume._id !== id));
    } catch (error) {
      setError('Failed to delete resume');
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

      {error && <div className="error">{error}</div>}

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
            <div key={resume._id} className="resume-card">
              <h3>{resume.title}</h3>
              <p>Template: {resume.template}</p>
              <p>Last updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
              <div className="resume-actions">
                <Link to={`/resume/${resume._id}`} className="btn">
                  Edit
                </Link>
                <button 
                  onClick={() => deleteResume(resume._id)}
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
