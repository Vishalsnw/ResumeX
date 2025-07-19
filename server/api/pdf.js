
const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Generate PDF from resume data
router.post('/generate', async (req, res) => {
  let browser;
  try {
    const { resumeData, template = 'modern' } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    // Load template
    const templatePath = path.join(__dirname, `../../templates/${template}.html`);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }

    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with actual data
    htmlTemplate = replacePlaceholders(htmlTemplate, resumeData);

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdf);

  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Replace template placeholders with resume data
function replacePlaceholders(html, data) {
  // Personal info
  html = html.replace(/{{name}}/g, data.personalInfo?.name || '');
  html = html.replace(/{{email}}/g, data.personalInfo?.email || '');
  html = html.replace(/{{phone}}/g, data.personalInfo?.phone || '');
  html = html.replace(/{{address}}/g, data.personalInfo?.address || '');
  html = html.replace(/{{linkedin}}/g, data.personalInfo?.linkedin || '');
  html = html.replace(/{{github}}/g, data.personalInfo?.github || '');

  // Summary
  html = html.replace(/{{summary}}/g, data.summary || '');

  // Experience
  let experienceHtml = '';
  if (data.experience && data.experience.length > 0) {
    experienceHtml = data.experience.map(exp => `
      <div class="mb-4">
        <div class="flex justify-between items-start mb-1">
          <h4 class="font-semibold">${exp.position || ''}</h4>
          <span class="text-sm text-gray-600">${exp.startDate || ''} - ${exp.endDate || ''}</span>
        </div>
        <p class="text-gray-700 font-medium mb-2">${exp.company || ''}</p>
        <p class="text-gray-600">${exp.description || ''}</p>
      </div>
    `).join('');
  }
  html = html.replace(/{{experience}}/g, experienceHtml);

  // Education
  let educationHtml = '';
  if (data.education && data.education.length > 0) {
    educationHtml = data.education.map(edu => `
      <div class="mb-3">
        <div class="flex justify-between items-start mb-1">
          <h4 class="font-semibold">${edu.degree || ''} in ${edu.field || ''}</h4>
          <span class="text-sm text-gray-600">${edu.startDate || ''} - ${edu.endDate || ''}</span>
        </div>
        <p class="text-gray-700">${edu.institution || ''}</p>
        ${edu.gpa ? `<p class="text-gray-600">GPA: ${edu.gpa}</p>` : ''}
      </div>
    `).join('');
  }
  html = html.replace(/{{education}}/g, educationHtml);

  // Skills
  let skillsHtml = '';
  if (data.skills && data.skills.length > 0) {
    skillsHtml = data.skills.map(skill => 
      `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">${skill}</span>`
    ).join('');
  }
  html = html.replace(/{{skills}}/g, skillsHtml);

  // Projects
  let projectsHtml = '';
  if (data.projects && data.projects.length > 0) {
    projectsHtml = data.projects.map(project => `
      <div class="mb-4">
        <h4 class="font-semibold">${project.name || ''}</h4>
        <p class="text-gray-600 mb-2">${project.description || ''}</p>
        ${project.technologies && project.technologies.length > 0 ? 
          `<p class="text-sm text-gray-500">Technologies: ${project.technologies.join(', ')}</p>` : ''}
        ${project.link ? `<a href="${project.link}" class="text-blue-600 text-sm">${project.link}</a>` : ''}
      </div>
    `).join('');
  }
  html = html.replace(/{{projects}}/g, projectsHtml);

  return html;
}

module.exports = router;
