import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/logo.jpg" alt="ResumeX" className="logo" onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'inline';
        }} />
        <span className="logo-text" style={{display: 'none'}}>📄 ResumeX</span>
          <div className="logo-text">
            <h1>ResumeX</h1>
            <span>AI Resume Builder</span>
          </div>
        </Link>
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/resume/new" className="nav-link btn-primary">Create Resume</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;