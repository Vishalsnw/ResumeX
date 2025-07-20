
// Professional Resume Template Samples
// These serve as references for AI-generated content structure

const resumeSamples = {
  software_engineer: {
    name: "Software Engineer Template",
    content: `
JOHN SMITH
Software Engineer
Email: john.smith@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5+ years developing scalable web applications. Proficient in JavaScript, Python, and cloud technologies. Led development of applications serving 100K+ users with 99.9% uptime.

TECHNICAL SKILLS
• Programming Languages: JavaScript, Python, Java, TypeScript
• Frameworks: React, Node.js, Django, Express.js
• Databases: PostgreSQL, MongoDB, Redis
• Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc. | 2022 - Present
• Developed and maintained microservices architecture serving 500K+ daily users
• Reduced application load time by 40% through optimization and caching strategies
• Led team of 4 developers in agile development cycles
• Implemented automated testing reducing bugs by 60%

Software Developer | StartupXYZ | 2020 - 2022
• Built responsive web applications using React and Node.js
• Integrated third-party APIs increasing user engagement by 25%
• Collaborated with UX team to improve user interface design
• Maintained 95% code coverage through comprehensive unit testing

EDUCATION
Bachelor of Science in Computer Science | State University | 2020

CERTIFICATIONS
• AWS Certified Solutions Architect
• Google Cloud Professional Developer
    `
  },

  marketing_manager: {
    name: "Marketing Manager Template",
    content: `
SARAH JOHNSON
Marketing Manager
Email: sarah.johnson@email.com | Phone: (555) 987-6543 | Portfolio: sarahmarketing.com

PROFESSIONAL SUMMARY
Results-driven Marketing Manager with 6+ years experience developing integrated marketing campaigns. Increased brand awareness by 150% and generated $2M+ in revenue through digital marketing strategies.

CORE COMPETENCIES
• Digital Marketing Strategy • Content Marketing • SEO/SEM
• Social Media Management • Marketing Analytics • Campaign Management
• Brand Development • Lead Generation • Marketing Automation

PROFESSIONAL EXPERIENCE

Marketing Manager | Growth Company | 2021 - Present
• Developed comprehensive marketing strategies resulting in 45% increase in qualified leads
• Managed $500K annual marketing budget across multiple channels
• Led cross-functional team of 6 marketing professionals
• Implemented CRM system improving lead tracking by 80%

Digital Marketing Specialist | Business Solutions | 2019 - 2021
• Created content marketing campaigns generating 200K+ monthly website visitors
• Managed social media presence across 5 platforms, growing followers by 300%
• Optimized PPC campaigns achieving 25% reduction in cost-per-acquisition
• Conducted market research informing product development decisions

EDUCATION
Master of Business Administration | Business School | 2019
Bachelor of Arts in Communications | University College | 2017

ACHIEVEMENTS
• "Marketing Professional of the Year" Award 2023
• Certified Google Ads Professional
• HubSpot Content Marketing Certification
    `
  },

  project_manager: {
    name: "Project Manager Template", 
    content: `
MICHAEL CHEN
Project Manager, PMP
Email: michael.chen@email.com | Phone: (555) 456-7890 | LinkedIn: linkedin.com/in/michaelchen

PROFESSIONAL SUMMARY
Certified Project Manager with 8+ years experience leading cross-functional teams in delivering complex projects. Successfully managed $10M+ in project budgets with 98% on-time delivery rate.

CORE COMPETENCIES
• Project Planning & Execution • Risk Management • Stakeholder Communication
• Agile & Waterfall Methodologies • Budget Management • Team Leadership
• Quality Assurance • Process Improvement • Vendor Management

PROFESSIONAL EXPERIENCE

Senior Project Manager | Enterprise Solutions | 2020 - Present
• Led 15+ concurrent projects with teams of 20+ members across multiple departments
• Implemented agile methodologies reducing project delivery time by 30%
• Managed vendor relationships saving company $200K annually
• Developed project templates and processes adopted company-wide

Project Manager | Innovation Labs | 2018 - 2020
• Coordinated product launches generating $5M in first-year revenue
• Facilitated daily standups and sprint planning for development teams
• Created project documentation and reporting dashboards
• Maintained 95% client satisfaction rating across all projects

EDUCATION
Master of Project Management | Professional Institute | 2018
Bachelor of Science in Business Administration | State University | 2016

CERTIFICATIONS
• Project Management Professional (PMP)
• Certified ScrumMaster (CSM)
• Lean Six Sigma Green Belt
    `
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = resumeSamples;
} else if (typeof window !== 'undefined') {
  window.resumeSamples = resumeSamples;
}
