
// Frontend-only API service using localStorage
class APIService {
  constructor() {
    this.baseURL = '';
    this.users = JSON.parse(localStorage.getItem('resumex_users') || '[]');
    this.resumes = JSON.parse(localStorage.getItem('resumex_resumes') || '[]');
    this.currentUser = JSON.parse(localStorage.getItem('resumex_current_user') || 'null');
  }

  // Auth methods
  async register(userData) {
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = {
      id: Date.now(),
      ...userData,
      subscription: 'free',
      createdAt: new Date().toISOString()
    };

    this.users.push(user);
    localStorage.setItem('resumex_users', JSON.stringify(this.users));
    
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    localStorage.setItem('resumex_token', token);
    localStorage.setItem('resumex_current_user', JSON.stringify(user));
    
    return { token, user };
  }

  async login(credentials) {
    const user = this.users.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    localStorage.setItem('resumex_token', token);
    localStorage.setItem('resumex_current_user', JSON.stringify(user));
    
    return { token, user };
  }

  // Resume methods
  async getResumes() {
    if (!this.currentUser) return [];
    return this.resumes.filter(r => r.user === this.currentUser.id);
  }

  async createResume(resumeData) {
    const resume = {
      id: Date.now(),
      user: this.currentUser.id,
      ...resumeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.resumes.push(resume);
    localStorage.setItem('resumex_resumes', JSON.stringify(this.resumes));
    return resume;
  }

  async updateResume(id, updateData) {
    const index = this.resumes.findIndex(r => r.id === parseInt(id) && r.user === this.currentUser.id);
    if (index === -1) throw new Error('Resume not found');

    this.resumes[index] = { ...this.resumes[index], ...updateData, updatedAt: new Date().toISOString() };
    localStorage.setItem('resumex_resumes', JSON.stringify(this.resumes));
    return this.resumes[index];
  }

  async deleteResume(id) {
    const index = this.resumes.findIndex(r => r.id === parseInt(id) && r.user === this.currentUser.id);
    if (index === -1) throw new Error('Resume not found');

    this.resumes.splice(index, 1);
    localStorage.setItem('resumex_resumes', JSON.stringify(this.resumes));
    return { message: 'Resume deleted successfully' };
  }

  // AI content generation (direct API calls)
  async generateContent(type, context, jobTitle, experience) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ 
          role: "user", 
          content: this.getPrompt(type, context, jobTitle, experience)
        }],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return { content: data.choices[0].message.content };
  }

  getPrompt(type, context, jobTitle, experience) {
    switch (type) {
      case 'summary':
        return `Create a professional resume summary for a ${jobTitle} with ${experience} years of experience. Context: ${context}`;
      case 'experience':
        return `Write 3-4 bullet points describing achievements for a ${jobTitle} role. Focus on quantifiable results. Context: ${context}`;
      case 'skills':
        return `List relevant technical and soft skills for a ${jobTitle} position. Separate by categories.`;
      default:
        return '';
    }
  }
}

export default new APIService();
