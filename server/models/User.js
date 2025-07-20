
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = global.userIdCounter++;
    this.name = userData.name;
    this.email = userData.email.toLowerCase();
    this.password = userData.password;
    this.resumes = [];
    this.subscription = 'free';
    this.subscriptionDate = null;
    this.createdAt = new Date();
  }

  static async findOne(query) {
    return global.users.find(user => {
      if (query.email) return user.email === query.email.toLowerCase();
      if (query.id) return user.id === query.id;
      return false;
    });
  }

  static async findById(id) {
    return global.users.find(user => user.id === parseInt(id));
  }

  async save() {
    // Hash password before saving
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    
    global.users.push(this);
    return this;
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Return user without password
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
