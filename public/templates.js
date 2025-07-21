
// Professional Resume Templates Collection - Converted from DOCX
const resumeTemplates = {
  ats_bold_accounting: {
    name: "ATS Bold Accounting",
    description: "ATS-optimized template perfect for accounting and finance professionals",
    html: (data) => {
      const formatDescription = (description) => {
        if (!description || description.trim() === '') {
          return '<p>• Key responsibilities and achievements</p>';
        }
        
        let formatted = description.trim();
        if (formatted.includes('•') || formatted.includes('\n•')) {
          return formatted.split('\n')
            .filter(line => line.trim())
            .map(line => {
              line = line.trim();
              if (!line.startsWith('•')) {
                line = '• ' + line;
              }
              return `<p>${line}</p>`;
            })
            .join('');
        }
        
        return `<p>• ${formatted}</p>`;
      };

      return `
        <div class="resume-container ats-bold-template">
          <div class="ats-header">
            <h1>${data.personalInfo.name}</h1>
            <div class="ats-subtitle">${data.jobTitle}</div>
            <div class="ats-contact">
              <span>${data.personalInfo.email}</span>
              <span>${data.personalInfo.phone}</span>
              <span>${data.personalInfo.location}</span>
            </div>
          </div>
          <div class="ats-body">
            <section class="ats-section">
              <h2>PROFESSIONAL EXPERIENCE</h2>
              ${data.experience.map(exp => `
                <div class="ats-experience">
                  <div class="experience-header">
                    <h3>${exp.position}</h3>
                    <span class="company">${exp.company}</span>
                    <span class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</span>
                  </div>
                  <div class="experience-details">
                    ${formatDescription(exp.description)}
                  </div>
                </div>
              `).join('')}
            </section>
            <section class="ats-section">
              <h2>CORE SKILLS</h2>
              <div class="skills-list">
                ${data.skills.join(' • ')}
              </div>
            </section>
            ${data.education ? `
              <section class="ats-section">
                <h2>EDUCATION</h2>
                <p>${data.education}</p>
              </section>
            ` : ''}
          </div>
        </div>
      `;
    }
  },

  ats_classic_hr: {
    name: "ATS Classic HR",
    description: "Professional HR template optimized for applicant tracking systems",
    html: (data) => `
      <div class="resume-container ats-hr-template">
        <div class="hr-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="hr-title">Human Resources Professional</div>
          <div class="hr-contact">
            <div class="contact-item">
              <i class="fas fa-envelope"></i> ${data.personalInfo.email}
            </div>
            <div class="contact-item">
              <i class="fas fa-phone"></i> ${data.personalInfo.phone}
            </div>
            <div class="contact-item">
              <i class="fas fa-map-marker-alt"></i> ${data.personalInfo.location}
            </div>
          </div>
        </div>
        <div class="hr-body">
          <section class="hr-section">
            <h2>PROFESSIONAL EXPERIENCE</h2>
            ${data.experience.map(exp => `
              <div class="hr-experience">
                <div class="role-header">
                  <div class="role-title">
                    <h3>${exp.position}</h3>
                    <div class="company-name">${exp.company}</div>
                  </div>
                  <div class="role-duration">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                </div>
                <div class="role-description">
                  <p>${exp.description || 'Key responsibilities and achievements in human resources management'}</p>
                </div>
              </div>
            `).join('')}
          </section>
          <section class="hr-section">
            <h2>CORE COMPETENCIES</h2>
            <div class="competencies-grid">
              ${data.skills.map(skill => `<div class="competency">${skill}</div>`).join('')}
            </div>
          </section>
        </div>
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
                  <p>${exp.description || 'Legal expertise and case management responsibilities'}</p>
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
          <h1>${data.personalInfo.name}</h1>
          <div class="manager-title">Industry Manager</div>
          <div class="manager-contact">
            ${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}
          </div>
        </div>
        <div class="manager-body">
          <section class="manager-section">
            <h2>LEADERSHIP EXPERIENCE</h2>
            ${data.experience.map(exp => `
              <div class="manager-experience">
                <div class="leadership-role">
                  <h3>${exp.position}</h3>
                  <div class="organization">${exp.company}</div>
                  <div class="tenure">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                </div>
                <div class="achievements">
                  <p>${exp.description || 'Strategic leadership and operational excellence achievements'}</p>
                </div>
              </div>
            `).join('')}
          </section>
          <section class="manager-section">
            <h2>CORE COMPETENCIES</h2>
            <div class="competencies">
              ${data.skills.map(skill => `<span class="competency-tag">${skill}</span>`).join('')}
            </div>
          </section>
        </div>
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
          <div class="nursing-credentials">Registered Nurse</div>
          <div class="nursing-contact">
            <span><i class="fas fa-envelope"></i> ${data.personalInfo.email}</span>
            <span><i class="fas fa-phone"></i> ${data.personalInfo.phone}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${data.personalInfo.location}</span>
          </div>
        </div>
        <div class="nursing-body">
          <div class="nursing-main">
            <section class="nursing-section">
              <h2><i class="fas fa-user-md"></i> Clinical Experience</h2>
              ${data.experience.map(exp => `
                <div class="nursing-experience">
                  <div class="experience-header">
                    <h3>${exp.position}</h3>
                    <div class="facility-info">
                      <span class="facility-name">${exp.company}</span>
                      <span class="experience-dates">${exp.startDate} - ${exp.endDate || 'Present'}</span>
                    </div>
                  </div>
                  <div class="clinical-details">
                    <p>${exp.description || 'Patient care, clinical assessments, and healthcare delivery'}</p>
                  </div>
                </div>
              `).join('')}
            </section>
          </div>
          <div class="nursing-sidebar">
            <section class="nursing-section">
              <h3><i class="fas fa-stethoscope"></i> Clinical Skills</h3>
              <div class="nursing-skills">
                ${data.skills.map(skill => `<div class="nursing-skill">${skill}</div>`).join('')}
              </div>
            </section>
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
                  <p>${exp.description || 'Key responsibilities and achievements'}</p>
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

// Make templates available globally
window.resumeTemplates = resumeTemplates;
