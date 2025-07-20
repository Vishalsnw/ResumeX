// Professional Resume Templates Collection - Converted from DOCX
const resumeTemplates = {
  ats_bold_accounting: {
    name: "ATS Bold Accounting",
    description: "ATS-optimized template perfect for accounting and finance professionals",
    html: (data) => `
      <div class="resume-container ats-bold-template">
        <div class="resume-header ats-bold-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="ats-contact-bar">
            <span>${data.personalInfo.email}</span> |
            <span>${data.personalInfo.phone}</span> |
            <span>${data.personalInfo.location}</span>
          </div>
          <div class="objective-section">
            <h2>PROFESSIONAL OBJECTIVE</h2>
            <p>Dedicated ${data.jobTitle} with expertise in financial analysis, reporting, and compliance.</p>
          </div>
        </div>
        <div class="ats-body">
          <div class="resume-section">
            <h2>PROFESSIONAL EXPERIENCE</h2>
            ${data.experience.map(exp => `
              <div class="ats-experience-item">
                <div class="experience-header">
                  <div class="position-info">
                    <h3>${exp.position}</h3>
                    <h4>${exp.company}</h4>
                  </div>
                  <div class="date-location">
                    <span>${exp.startDate} - ${exp.endDate || 'Present'}</span>
                  </div>
                </div>
                <div class="ats-achievements">
                  ${formatDescription(exp.description)}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="ats-skills-section">
            <h2>CORE COMPETENCIES</h2>
            <div class="ats-skills-grid">
              ${data.skills.map(skill => `<span class="ats-skill">${skill}</span>`).join('')}
            </div>
          </div>
          ${data.education ? `
            <div class="resume-section">
              <h2>EDUCATION</h2>
              <div class="education-item"><p>${data.education}</p></div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  },

  ats_classic_hr: {
    name: "ATS Classic HR",
    description: "Professional HR template optimized for applicant tracking systems",
    html: (data) => `
      <div class="resume-container ats-hr-template">
        <header class="hr-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="hr-title">${data.jobTitle}</div>
          <div class="hr-contact">
            ${data.personalInfo.email} • ${data.personalInfo.phone} • ${data.personalInfo.location}
          </div>
        </header>
        <section class="hr-summary">
          <h2>PROFESSIONAL SUMMARY</h2>
          <p>Experienced HR professional with proven ability to develop talent strategies and foster positive workplace culture.</p>
        </section>
        <section class="hr-experience">
          <h2>PROFESSIONAL EXPERIENCE</h2>
          ${data.experience.map(exp => `
            <div class="hr-job">
              <div class="job-header">
                <div class="job-title-company">
                  <h3>${exp.position}</h3>
                  <span class="company-name">${exp.company}</span>
                </div>
                <div class="job-dates">${exp.startDate} – ${exp.endDate || 'Present'}</div>
              </div>
              <div class="job-description">
                ${formatDescription(exp.description)}
              </div>
            </div>
          `).join('')}
        </section>
        <section class="hr-skills">
          <h2>CORE COMPETENCIES</h2>
          <div class="hr-skills-list">
            ${data.skills.map(skill => `<span>${skill}</span>`).join(' • ')}
          </div>
        </section>
        ${data.education ? `
          <section class="hr-education">
            <h2>EDUCATION</h2>
            <div class="education-details"><p>${data.education}</p></div>
          </section>
        ` : ''}
      </div>
    `
  },

  attorney_resume: {
    name: "Attorney Professional",
    description: "Sophisticated template designed for legal professionals",
    html: (data) => `
      <div class="resume-container attorney-template">
        <div class="attorney-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="attorney-subtitle">Attorney at Law</div>
          <div class="attorney-contact">
            <div class="contact-line">
              <i class="fas fa-envelope"></i> ${data.personalInfo.email}
            </div>
            <div class="contact-line">
              <i class="fas fa-phone"></i> ${data.personalInfo.phone}
            </div>
            <div class="contact-line">
              <i class="fas fa-map-marker-alt"></i> ${data.personalInfo.location}
            </div>
          </div>
        </div>
        <div class="attorney-body">
          <section class="attorney-section">
            <h2>PROFESSIONAL EXPERIENCE</h2>
            ${data.experience.map(exp => `
              <div class="attorney-experience">
                <div class="experience-title">
                  <h3>${exp.position}</h3>
                  <span class="firm-name">${exp.company}</span>
                </div>
                <div class="experience-dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                <div class="experience-details">
                  ${formatDescription(exp.description)}
                </div>
              </div>
            `).join('')}
          </section>
          <section class="attorney-section">
            <h2>AREAS OF PRACTICE</h2>
            <div class="practice-areas">
              ${data.skills.map(skill => `<div class="practice-area">${skill}</div>`).join('')}
            </div>
          </section>
          ${data.education ? `
            <section class="attorney-section">
              <h2>EDUCATION & BAR ADMISSIONS</h2>
              <div class="education-details"><p>${data.education}</p></div>
            </section>
          ` : ''}
        </div>
      </div>
    `
  },

  industry_manager: {
    name: "Industry Manager",
    description: "Executive template for management and leadership positions",
    html: (data) => `
      <div class="resume-container manager-template">
        <div class="manager-header">
          <div class="manager-name-section">
            <h1>${data.personalInfo.name}</h1>
            <div class="manager-title">${data.jobTitle}</div>
          </div>
          <div class="manager-contact-section">
            <div>${data.personalInfo.email}</div>
            <div>${data.personalInfo.phone}</div>
            <div>${data.personalInfo.location}</div>
          </div>
        </div>
        <div class="manager-summary">
          <h2>EXECUTIVE SUMMARY</h2>
          <p>Strategic leader with proven track record of driving operational excellence and team performance in competitive markets.</p>
        </div>
        <div class="manager-experience">
          <h2>LEADERSHIP EXPERIENCE</h2>
          ${data.experience.map(exp => `
            <div class="manager-role">
              <div class="role-header">
                <div class="role-title">
                  <h3>${exp.position}</h3>
                  <div class="company-name">${exp.company}</div>
                </div>
                <div class="role-duration">${exp.startDate} - ${exp.endDate || 'Present'}</div>
              </div>
              <div class="role-achievements">
                ${formatDescription(exp.description)}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="manager-competencies">
          <h2>LEADERSHIP COMPETENCIES</h2>
          <div class="competencies-grid">
            ${data.skills.map(skill => `<div class="competency">${skill}</div>`).join('')}
          </div>
        </div>
        ${data.education ? `
          <div class="manager-education">
            <h2>EDUCATION & CERTIFICATIONS</h2>
            <div class="education-details"><p>${data.education}</p></div>
          </div>
        ` : ''}
      </div>
    `
  },

  modern_nursing: {
    name: "Modern Nursing",
    description: "Healthcare-focused template for nursing professionals",
    html: (data) => `
      <div class="resume-container nursing-template">
        <div class="nursing-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="nursing-credentials">Registered Nurse, ${data.jobTitle}</div>
          <div class="nursing-contact">
            <span><i class="fas fa-envelope"></i> ${data.personalInfo.email}</span>
            <span><i class="fas fa-phone"></i> ${data.personalInfo.phone}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${data.personalInfo.location}</span>
          </div>
        </div>
        <div class="nursing-body">
          <div class="nursing-main">
            <section class="nursing-section">
              <h2><i class="fas fa-stethoscope"></i> CLINICAL EXPERIENCE</h2>
              ${data.experience.map(exp => `
                <div class="nursing-experience">
                  <div class="experience-header">
                    <h3>${exp.position}</h3>
                    <span class="facility-name">${exp.company}</span>
                    <span class="experience-dates">${exp.startDate} - ${exp.endDate || 'Present'}</span>
                  </div>
                  <div class="clinical-duties">
                    ${formatDescription(exp.description)}
                  </div>
                </div>
              `).join('')}
            </section>
          </div>
          <div class="nursing-sidebar">
            <section class="skills-section">
              <h3><i class="fas fa-user-md"></i> CLINICAL SKILLS</h3>
              <div class="nursing-skills">
                ${data.skills.map(skill => `<div class="nursing-skill">${skill}</div>`).join('')}
              </div>
            </section>
            ${data.education ? `
              <section class="education-section">
                <h3><i class="fas fa-graduation-cap"></i> EDUCATION & CERTIFICATIONS</h3>
                <div class="nursing-education"><p>${data.education}</p></div>
              </section>
            ` : ''}
          </div>
        </div>
      </div>
    `
  },

  simple_resume: {
    name: "Simple Clean",
    description: "Clean and straightforward template for any profession",
    html: (data) => `
      <div class="resume-container simple-template">
        <div class="simple-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="simple-contact">
            ${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}
          </div>
        </div>
        <div class="simple-body">
          <section class="simple-section">
            <h2>Professional Experience</h2>
            ${data.experience.map(exp => `
              <div class="simple-job">
                <div class="job-header">
                  <h3>${exp.position}</h3>
                  <span class="job-company">${exp.company}</span>
                  <span class="job-dates">${exp.startDate} - ${exp.endDate || 'Present'}</span>
                </div>
                <div class="job-description">
                  ${formatDescription(exp.description)}
                </div>
              </div>
            `).join('')}
          </section>
          <section class="simple-section">
            <h2>Skills</h2>
            <div class="simple-skills">
              ${data.skills.join(', ')}
            </div>
          </section>
          ${data.education ? `
            <section class="simple-section">
              <h2>Education</h2>
              <div class="simple-education"><p>${data.education}</p></div>
            </section>
          ` : ''}
        </div>
      </div>
    `
  }
};

// Helper function to format descriptions
function formatDescription(description) {
  if (!description) return '<p>• Key responsibilities and achievements</p>';

  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 1) {
    return sentences.map(sentence => `<p>• ${sentence.trim()}.</p>`).join('');
  }
  return `<p>• ${description}</p>`;
}

// Export templates
if (typeof module !== 'undefined' && module.exports) {
  module.exports = resumeTemplates;
}