
const express = require('express');
const Resume = require('../models/Resume');
const auth = require('../middleware/auth');
const router = express.Router();

// PDF generation endpoint
router.post('/generate-pdf', async (req, res) => {
  try {
    const { resumeData } = req.body;
    
    // Simple HTML to PDF conversion
    const html = generateResumeHTML(resumeData);
    
    // For now, return HTML that can be printed as PDF
    // In production, you might want to use puppeteer or similar
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.html"');
    res.send(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

function generateResumeHTML(resumeData) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${resumeData.personalInfo.fullName} - Resume</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.4; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
        .name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .contact { font-size: 14px; color: #666; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #bdc3c7; margin-bottom: 10px; }
        .summary { font-style: italic; margin-bottom: 15px; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill { background: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${resumeData.personalInfo.fullName}</div>
        <div class="contact">
            ${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}
            ${resumeData.personalInfo.linkedin ? ` | ${resumeData.personalInfo.linkedin}` : ''}
        </div>
    </div>
    
    ${resumeData.personalInfo.summary ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="summary">${resumeData.personalInfo.summary}</div>
    </div>
    ` : ''}
    
    ${resumeData.skills && resumeData.skills.length > 0 ? `
    <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">
            ${resumeData.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
        </div>
    </div>
    ` : ''}
    
    ${resumeData.experience && resumeData.experience.length > 0 ? `
    <div class="section">
        <div class="section-title">Experience</div>
        ${resumeData.experience.map(exp => `
            <div style="margin-bottom: 15px;">
                <strong>${exp.title}</strong> at <strong>${exp.company}</strong>
                <div style="font-size: 12px; color: #666;">${exp.startDate} - ${exp.endDate}</div>
                <div>${exp.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${resumeData.education && resumeData.education.length > 0 ? `
    <div class="section">
        <div class="section-title">Education</div>
        ${resumeData.education.map(edu => `
            <div style="margin-bottom: 10px;">
                <strong>${edu.degree}</strong> - ${edu.school}
                <div style="font-size: 12px; color: #666;">${edu.year}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
  `;
}

// Get all resumes for user
router.get('/', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resumes' });
  }
});

// Get single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      id: req.params.id, 
      user: req.user.id 
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume' });
  }
});

// Create new resume
router.post('/', auth, async (req, res) => {
  try {
    const resumeData = {
      ...req.body,
      user: req.user.id
    };
    
    const resume = new Resume(resumeData);
    await resume.save();
    
    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create resume' });
  }
});

// Update resume
router.put('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { id: req.params.id, user: req.user.id },
      req.body
    );
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resume' });
  }
});

// Delete resume
router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      id: req.params.id,
      user: req.user.id
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume' });
  }
});

module.exports = router;
