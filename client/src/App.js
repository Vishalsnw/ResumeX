import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ResumeEditor from './components/ResumeEditor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume/:id" element={<ResumeEditor />} />
            <Route path="/resume/new" element={<ResumeEditor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;