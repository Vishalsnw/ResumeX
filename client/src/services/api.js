// Frontend-only API service using localStorage
class APIService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production'
      ? 'https://your-app-name.replit.app'
      : 'http://localhost:5000';
    this.users = JSON.parse(localStorage.getItem('resumex_users') || '[]');
    this.resumes = JSON.parse(localStorage.getItem('resumex_resumes') || '[]');
    this.currentUser = JSON.parse(localStorage.getItem('resumex_current_user') || 'null');
  }

  // Real AI content generation using OpenAI
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
        throw new Error('Failed to generate AI content');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  // Enhance complete resume with AI
  async enhanceResume(resumeData) {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/enhance-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData })
      });

      if (!response.ok) {
        throw new Error('Failed to enhance resume');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Resume enhancement error:', error);
      throw error;
    }
  }

  // Generate PDF resume
  async generatePDF(resumeData) {
    try {
      const response = await fetch(`${this.baseURL}/api/resumes/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
}

const apiService = new APIService();
export default apiService;