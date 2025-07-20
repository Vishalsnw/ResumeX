class Resume {
  constructor(resumeData) {
    this.id = global.resumeIdCounter++;
    this.user = resumeData.user;
    this.title = resumeData.title || 'My Resume';
    this.template = resumeData.template || 'modern';
    this.personalInfo = resumeData.personalInfo || {};
    this.experience = resumeData.experience || [];
    this.education = resumeData.education || [];
    this.skills = resumeData.skills || [];
    this.projects = resumeData.projects || [];
    this.certifications = resumeData.certifications || [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async find(query) {
    return global.resumes.filter(resume => {
      if (query.user) return resume.user === query.user;
      return true;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  static async findOne(query) {
    return global.resumes.find(resume => {
      if (query.id && query.user) {
        return resume.id === parseInt(query.id) && resume.user === query.user;
      }
      if (query.id) return resume.id === parseInt(query.id);
      return false;
    });
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const resume = await this.findOne(query);
    if (resume) {
      Object.assign(resume, updateData);
      resume.updatedAt = new Date();
      return resume;
    }
    return null;
  }

  static async findOneAndDelete(query) {
    const index = global.resumes.findIndex(resume => {
      if (query.id && query.user) {
        return resume.id === parseInt(query.id) && resume.user === query.user;
      }
      return false;
    });

    if (index > -1) {
      return global.resumes.splice(index, 1)[0];
    }
    return null;
  }

  async save() {
    this.updatedAt = new Date();
    global.resumes.push(this);
    return this;
  }
}

module.exports = Resume;