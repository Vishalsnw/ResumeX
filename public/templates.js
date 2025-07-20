
// Professional Resume Templates Collection
const resumeTemplates = {
  modern: {
    name: "Modern Professional",
    description: "Clean and contemporary design perfect for tech and creative industries",
    html: (data) => `
      <div class="resume-container modern-template">
        <div class="resume-header modern-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="subtitle">${data.jobTitle}</div>
          <div class="contact-info">
            <span><i class="fas fa-envelope"></i> ${data.personalInfo.email}</span>
            <span><i class="fas fa-phone"></i> ${data.personalInfo.phone}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${data.personalInfo.location}</span>
          </div>
        </div>
        <div class="resume-body modern-body">
          <div class="main-content">
            <div class="resume-section">
              <h2><i class="fas fa-briefcase"></i> Professional Experience</h2>
              ${data.experience.map(exp => `
                <div class="experience-item modern-experience">
                  <div class="experience-header">
                    <div class="position-company">
                      <h3>${exp.position}</h3>
                      <h4>${exp.company}</h4>
                    </div>
                    <div class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                  </div>
                  <div class="description">${formatDescription(exp.description)}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="sidebar">
            <div class="resume-section">
              <h2><i class="fas fa-cog"></i> Core Skills</h2>
              <div class="skills-grid">
                ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
            ${data.education ? `
              <div class="resume-section">
                <h2><i class="fas fa-graduation-cap"></i> Education</h2>
                <div class="education-item"><p>${data.education}</p></div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `
  },

  executive: {
    name: "Executive Professional",
    description: "Sophisticated design for senior-level positions and leadership roles",
    html: (data) => `
      <div class="resume-container executive-template">
        <div class="executive-header">
          <div class="name-title">
            <h1>${data.personalInfo.name}</h1>
            <div class="executive-title">${data.jobTitle}</div>
          </div>
          <div class="executive-contact">
            <div>${data.personalInfo.email}</div>
            <div>${data.personalInfo.phone}</div>
            <div>${data.personalInfo.location}</div>
          </div>
        </div>
        <div class="executive-summary">
          <h2>Executive Summary</h2>
          <p>Results-driven ${data.jobTitle} with proven track record of delivering exceptional business outcomes and leading high-performing teams.</p>
        </div>
        <div class="resume-section executive-section">
          <h2>Professional Experience</h2>
          ${data.experience.map(exp => `
            <div class="experience-item executive-experience">
              <div class="experience-header">
                <div class="left-column">
                  <h3>${exp.position}</h3>
                  <h4>${exp.company}</h4>
                </div>
                <div class="right-column">
                  <div class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                </div>
              </div>
              <div class="executive-achievements">${formatDescription(exp.description)}</div>
            </div>
          `).join('')}
        </div>
        <div class="executive-footer">
          <div class="footer-section">
            <h3>Core Competencies</h3>
            <div class="competencies-grid">
              ${data.skills.map(skill => `<span>${skill}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `
  },

  creative: {
    name: "Creative Professional",
    description: "Eye-catching design for creative industries and marketing roles",
    html: (data) => `
      <div class="resume-container creative-template">
        <div class="creative-sidebar">
          <div class="profile-section">
            <div class="profile-circle">
              <span>${data.personalInfo.name.charAt(0)}</span>
            </div>
            <h1>${data.personalInfo.name}</h1>
            <div class="title">${data.jobTitle}</div>
          </div>
          <div class="contact-section">
            <h3>Contact</h3>
            <div class="contact-item">
              <i class="fas fa-envelope"></i>
              <span>${data.personalInfo.email}</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-phone"></i>
              <span>${data.personalInfo.phone}</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${data.personalInfo.location}</span>
            </div>
          </div>
          <div class="skills-section">
            <h3>Skills</h3>
            ${data.skills.map(skill => `
              <div class="skill-item">
                <span>${skill}</span>
                <div class="skill-bar">
                  <div class="skill-progress" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="creative-main">
          <div class="resume-section">
            <h2>Experience</h2>
            ${data.experience.map(exp => `
              <div class="experience-item creative-experience">
                <div class="timeline-dot"></div>
                <div class="experience-content">
                  <h3>${exp.position}</h3>
                  <h4>${exp.company} • ${exp.startDate} - ${exp.endDate || 'Present'}</h4>
                  ${formatDescription(exp.description)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
  },

  minimalist: {
    name: "Minimalist Clean",
    description: "Simple and elegant design that focuses on content",
    html: (data) => `
      <div class="resume-container minimalist-template">
        <header class="minimalist-header">
          <h1>${data.personalInfo.name}</h1>
          <div class="minimalist-contact">
            ${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}
          </div>
        </header>
        <section class="minimalist-section">
          <h2>${data.jobTitle}</h2>
        </section>
        <section class="minimalist-section">
          <h2>Experience</h2>
          ${data.experience.map(exp => `
            <div class="minimalist-item">
              <div class="item-header">
                <span class="position">${exp.position}</span>
                <span class="company">${exp.company}</span>
                <span class="dates">${exp.startDate}—${exp.endDate || 'Present'}</span>
              </div>
              ${formatDescription(exp.description)}
            </div>
          `).join('')}
        </section>
        <section class="minimalist-section">
          <h2>Skills</h2>
          <p>${data.skills.join(', ')}</p>
        </section>
      </div>
    `
  },

  classic: {
    name: "Classic Traditional",
    description: "Traditional format perfect for conservative industries",
    html: (data) => `
      <div class="resume-container classic-template">
        <div class="resume-header classic-header">
          <h1>${data.personalInfo.name}</h1>
          <hr class="classic-divider">
          <div class="contact-line">
            ${data.personalInfo.email} • ${data.personalInfo.phone} • ${data.personalInfo.location}
          </div>
          <div class="objective">
            <strong>${data.jobTitle}</strong>
          </div>
        </div>
        <div class="resume-section classic-section">
          <h2>PROFESSIONAL EXPERIENCE</h2>
          ${data.experience.map(exp => `
            <div class="experience-item classic-experience">
              <div class="experience-header">
                <div><strong>${exp.position}</strong> | ${exp.company}</div>
                <div class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
              </div>
              <div class="classic-description">${formatDescription(exp.description)}</div>
            </div>
          `).join('')}
        </div>
        <div class="resume-section classic-section">
          <h2>CORE COMPETENCIES</h2>
          <p>${data.skills.join(' • ')}</p>
        </div>
      </div>
    `
  },

  tech: {
    name: "Tech Professional",
    description: "Code-inspired design perfect for developers and tech professionals",
    html: (data) => `
      <div class="resume-container tech-template">
        <div class="tech-header">
          <div class="tech-profile">
            <h1>&lt;${data.personalInfo.name}/&gt;</h1>
            <div class="tech-title">// ${data.jobTitle}</div>
            <div class="tech-contact">
              <span>📧 ${data.personalInfo.email}</span>
              <span>📱 ${data.personalInfo.phone}</span>
              <span>📍 ${data.personalInfo.location}</span>
            </div>
          </div>
        </div>
        <div class="tech-grid">
          <div class="tech-main">
            <div class="code-block">
              <div class="code-header">
                <span class="code-tab">experience.js</span>
              </div>
              <div class="code-content">
                ${data.experience.map((exp, index) => `
                  <div class="tech-experience">
                    <div class="code-line">
                      <span class="line-number">${String(index * 6 + 1).padStart(2, '0')}</span>
                      <span class="code-text">
                        <span class="keyword">const</span> 
                        <span class="variable">experience${index + 1}</span> = {
                      </span>
                    </div>
                    <div class="code-line indent">
                      <span class="line-number">${String(index * 6 + 2).padStart(2, '0')}</span>
                      <span class="code-text">
                        position: <span class="string">"${exp.position}"</span>,
                      </span>
                    </div>
                    <div class="code-line indent">
                      <span class="line-number">${String(index * 6 + 3).padStart(2, '0')}</span>
                      <span class="code-text">
                        company: <span class="string">"${exp.company}"</span>,
                      </span>
                    </div>
                    <div class="code-line">
                      <span class="line-number">${String(index * 6 + 4).padStart(2, '0')}</span>
                      <span class="code-text">};</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="tech-sidebar">
            <div class="tech-skills">
              <h3>// Tech Stack</h3>
              <div class="tech-skills-list">
                ${data.skills.map(skill => `
                  <div class="tech-skill">
                    <span class="skill-icon">⚡</span>
                    <span>${skill}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
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
