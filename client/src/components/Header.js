import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>ResumeX</h1>
          <span>AI Resume Builder</span>
        </Link>
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/resume/new" className="nav-link btn">Create Resume</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;