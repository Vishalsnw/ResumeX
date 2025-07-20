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

  // Real AI content generation using DeepSeek API directly
  async generateContent(type, personalInfo, context = '') {
    try {
      // For demo purposes, you'll need to add your DeepSeek API key here
      // In production, this should be handled securely via a backend
      const DEEPSEEK_API_KEY = 'your-deepseek-api-key-here';
      
      if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-deepseek-api-key-here') {
        // Fallback to mock AI-like content for demo
        return this.generateMockContent(type, personalInfo, context);
      }

      let prompt = this.buildPrompt(type, personalInfo, context);

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return { content: data.choices[0].message.content };
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback to mock content if API fails
      return this.generateMockContent(type, personalInfo, context);
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

  generateMockContent(type, personalInfo, context) {
    switch (type) {
      case 'summary':
        return {
          content: `Dynamic ${context || 'professional'} with expertise in modern technologies and strong problem-solving abilities. Proven track record of delivering high-quality solutions and collaborating effectively in team environments. Passionate about continuous learning and staying current with industry trends.`
        };
      
      case 'skills':
        return {
          content: `Technical Skills: JavaScript, React, Node.js, HTML/CSS, Git, REST APIs, Database Management
          
Soft Skills: Problem Solving, Team Collaboration, Communication, Project Management, Adaptability, Critical Thinking`
        };
      
      default:
        return {
          content: `Enhanced ${type} content for ${personalInfo.fullName} with professional formatting and industry-relevant details.`
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