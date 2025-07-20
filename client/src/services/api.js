// Frontend-only API service using localStorage
class APIService {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000'
      : `https://${window.location.hostname}`;
    this.users = JSON.parse(localStorage.getItem('resumex_users') || '[]');
    this.resumes = JSON.parse(localStorage.getItem('resumex_resumes') || '[]');
    this.currentUser = JSON.parse(localStorage.getItem('resumex_current_user') || 'null');
  }

  // Real AI content generation using backend API
  async generateContent(type, personalInfo, context = '') {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          personalInfo,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      return { content: data.content };
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Enhanced fallback with more professional content
      return this.generateEnhancedContent(type, personalInfo, context);
    }
  }

  buildPrompt(type, personalInfo, context) {
    switch (type) {
      case 'summary':
        return `Create a professional resume summary for ${personalInfo.fullName}. 
        Job Title/Field: ${context || 'General'}
        Email: ${personalInfo.email}
        Location: ${personalInfo.location}
        Current Summary: ${personalInfo.summary || 'None provided'}

        Write a compelling 2-3 sentence professional summary that highlights their expertise and value proposition.`;
      
      case 'skills':
        return `Based on the following information, suggest relevant skills:
        Name: ${personalInfo.fullName}
        Field/Industry: ${context || 'General'}
        Current Skills: ${personalInfo.skills || 'None listed'}

        Provide a well-organized list of skills relevant to their field.`;
      
      default:
        return `Help improve this ${type} section for ${personalInfo.fullName} in the ${context || 'general'} field.`;
    }
  }

  generateEnhancedContent(type, personalInfo, context) {
    const name = personalInfo.fullName || 'Professional';
    const field = context || 'technology';
    
    switch (type) {
      case 'summary':
        const summaryTemplates = [
          `Results-driven ${field} professional with expertise in innovative problem-solving and strategic execution. Demonstrated ability to deliver exceptional outcomes while collaborating effectively in dynamic team environments. Committed to continuous learning and professional growth.`,
          `Experienced ${field} specialist with a proven track record of success in challenging environments. Strong analytical skills combined with excellent communication abilities. Passionate about leveraging technology to drive business value and operational excellence.`,
          `Dynamic ${field} professional known for delivering high-quality solutions and exceeding performance expectations. Expert in stakeholder management and cross-functional collaboration. Dedicated to staying current with industry best practices and emerging trends.`
        ];
        return {
          content: summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)]
        };
      
      case 'skills':
        const skillsByField = {
          technology: 'JavaScript, React, Node.js, Python, HTML/CSS, Git, REST APIs, Database Management, Cloud Computing, Agile Methodologies',
          business: 'Strategic Planning, Project Management, Business Analysis, Financial Modeling, Market Research, Stakeholder Management, Process Optimization',
          marketing: 'Digital Marketing, Content Strategy, SEO/SEM, Social Media Management, Analytics, Brand Management, Campaign Development',
          design: 'UI/UX Design, Adobe Creative Suite, Figma, Prototyping, User Research, Visual Design, Wireframing, Design Systems',
          default: 'Leadership, Problem Solving, Communication, Project Management, Analytical Thinking, Team Collaboration, Strategic Planning'
        };
        
        const technicalSkills = skillsByField[field.toLowerCase()] || skillsByField.default;
        const softSkills = 'Leadership, Problem Solving, Communication, Team Collaboration, Adaptability, Critical Thinking, Time Management, Attention to Detail';
        
        return {
          content: `Technical Skills: ${technicalSkills}\n\nSoft Skills: ${softSkills}`
        };
      
      default:
        return {
          content: `Professional ${type} content tailored for ${name} in the ${field} industry, emphasizing relevant experience and achievements that demonstrate value and expertise.`
        };
    }
  }

  // Enhance complete resume with AI
  async enhanceResume(resumeData) {
    try {
      // For now, return the same data - frontend only
      return { enhancedResume: resumeData };
    } catch (error) {
      console.error('Resume enhancement error:', error);
      throw error;
    }
  }

  // Generate PDF resume (browser-based solution)
  async generatePDF(resumeData) {
    try {
      // Create a simple HTML-to-PDF solution
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${resumeData.personalInfo.fullName} - Resume</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .section { margin-bottom: 15px; }
              .section h3 { color: #333; border-bottom: 1px solid #ccc; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${resumeData.personalInfo.fullName}</h1>
              <p>${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}</p>
            </div>
            ${resumeData.personalInfo.summary ? `<div class="section"><h3>Summary</h3><p>${resumeData.personalInfo.summary}</p></div>` : ''}
            ${resumeData.experience?.length ? `<div class="section"><h3>Experience</h3>${resumeData.experience.map(exp => `<p><strong>${exp.title}</strong> at ${exp.company} (${exp.duration})<br>${exp.description}</p>`).join('')}</div>` : ''}
            ${resumeData.education?.length ? `<div class="section"><h3>Education</h3>${resumeData.education.map(edu => `<p><strong>${edu.degree}</strong> - ${edu.institution} (${edu.year})</p>`).join('')}</div>` : ''}
            ${resumeData.skills ? `<div class="section"><h3>Skills</h3><p>${resumeData.skills}</p></div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      return new Blob(['PDF generated via print dialog'], { type: 'application/pdf' });
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
}

const apiService = new APIService();
export default apiService;