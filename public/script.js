// Global variables
let currentStep = 1;
let resumeData = {
    personalInfo: {},
    experience: [],
    skills: [],
    jobTitle: '',
    targetJobDescription: ''
};

// Start building function - opens the resume builder modal
function startBuilding() {
    console.log('Starting resume building process...');
    const modal = document.getElementById('resumeBuilder');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        // Reset to first step
        currentStep = 1;
        showStep(1);
        updateProgress();
    } else {
        console.error('Resume builder modal not found');
    }
}
let isProcessing = false;
let selectedTemplate = 'modern';
let jobAnalysisData = null;

// DOM elements
const modal = document.getElementById('resumeBuilder');
const previewModal = document.getElementById('resumePreview');
const loadingOverlay = document.getElementById('loadingOverlay');
const steps = document.querySelectorAll('.step');
const formSteps = document.querySelectorAll('.form-step');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeMobileMenu();
});

function initializeEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            closeModal();
        };
    });

    // Click outside modal to close
    window.onclick = function(event) {
        if (event.target === modal || event.target === previewModal) {
            closeModal();
        }
    };

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle) {
        mobileToggle.onclick = function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        };
    }
}

function initializeMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');

    // Close mobile menu when clicking on nav items
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.onclick = function() {
            if (window.innerWidth <= 768) {
                navMenu.style.display = 'none';
            }
        };
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navMenu.style.display = 'flex';
        } else {
            navMenu.style.display = 'none';
        }
    });
}

// Navigation functions
function viewTemplates() {
    alert('Template gallery coming soon! For now, you can create resumes with our AI-powered builder.');
}

function closeModal() {
    modal.style.display = 'none';
    previewModal.style.display = 'none';
    loadingOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Step navigation
function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        updateStepDisplay();
        updateProgress();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        updateProgress();
    }
}

function updateStepDisplay() {
    // Update step indicators
    steps.forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update form steps
    formSteps.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function updateProgress() {
    const progressPercent = (currentStep / 5) * 100;
    // You can add a progress bar here if needed
}

// Form validation
function validateCurrentStep() {
    const currentFormStep = document.getElementById(`step${currentStep}`);
    const requiredInputs = currentFormStep.querySelectorAll('[required]');

    for (let input of requiredInputs) {
        if (!input.value.trim()) {
            input.focus();
            showToast('Please fill in all required fields', 'error');
            return false;
        }
    }
    return true;
}

// Experience management
function addExperience() {
    const container = document.getElementById('experienceContainer');
    const experienceItem = document.createElement('div');
    experienceItem.className = 'experience-item';
    experienceItem.innerHTML = `
        <div class="form-group">
            <label>Company</label>
            <input type="text" class="company" required>
        </div>
        <div class="form-group">
            <label>Position</label>
            <input type="text" class="position" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" class="startDate" required>
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" class="endDate">
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="description" rows="3" placeholder="Describe your responsibilities and achievements"></textarea>
        </div>
        <button type="button" class="btn-secondary btn-small" onclick="removeExperience(this)">Remove</button>
    `;
    container.appendChild(experienceItem);
}

function removeExperience(button) {
    button.parentElement.remove();
}

// Job Description Analysis
async function analyzeJobDescription() {
    const jobDescription = document.getElementById('targetJobDescription').value;
    if (!jobDescription.trim()) {
        showToast('Please enter a job description to analyze', 'error');
        return;
    }

    showLoading();
    try {
        console.log('Starting job analysis...');
        console.log('Job description length:', jobDescription.length);

        const response = await fetch('/api/analyze-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ jobDescription: jobDescription.trim() })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                console.error('Error response text:', errorText);
            } catch (e) {
                errorText = 'Unable to read error response';
            }
            throw new Error(`Server error ${response.status}: ${errorText}`);
        }

        let result;
        const responseText = await response.text();
        console.log('Raw response text:', responseText);

        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            console.error('Response was:', responseText);
            throw new Error('Invalid server response format - not valid JSON');
        }

        console.log('Parsed job analysis response:', result);

        if (result.success && result.analysis) {
            jobAnalysisData = result.analysis;
            displayJobAnalysis(result.analysis);
            showToast('Job description analyzed successfully!', 'success');
        } else {
            console.error('Analysis failed:', result);
            throw new Error(result.error || 'Analysis failed - no data received');
        }
    } catch (error) {
        console.error('Job analysis error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 3),
            toString: error.toString(),
            cause: error.cause
        });

        let errorMessage = 'Failed to analyze job description';

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - Unable to connect to server';
        } else if (error.message.includes('Invalid server response')) {
            errorMessage = 'Server returned invalid response - Please try again';
        } else if (error.message.includes('API key not configured')) {
            errorMessage = 'AI service not configured - Please check environment variables';
        } else if (error.message.includes('Rate limit exceeded')) {
            errorMessage = 'Too many requests - Please wait a moment and try again';
        } else if (error.message.includes('Network error')) {
            errorMessage = 'Unable to connect to AI service - Please try again';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

function displayJobAnalysis(analysis) {
    const analysisDiv = document.getElementById('jobAnalysis');
    analysisDiv.innerHTML = `
        <div class="analysis-card">
            <h4><i class="fas fa-chart-line"></i> Job Analysis Results</h4>
            <div class="analysis-section">
                <h5>Key Skills Required:</h5>
                <div class="skill-tags">
                    ${analysis.requiredSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="analysis-section">
                <h5>Experience Level:</h5>
                <p>${analysis.experienceLevel}</p>
            </div>
            <div class="analysis-section">
                <h5>Industry Focus:</h5>
                <p>${analysis.industry}</p>
            </div>
            <div class="analysis-section">
                <h5>Recommendations:</h5>
                <ul>
                    ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    analysisDiv.style.display = 'block';
}

// Template Selection
function selectTemplate(templateName) {
    selectedTemplate = templateName;

    // Update UI to show selected template
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-template="${templateName}"]`).classList.add('selected');

    // All templates are now free to use
    showToast(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template selected!`, 'success');
}

// Data collection
function collectFormData() {
    const personalInfo = {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value
    };

    const jobTitle = document.getElementById('jobTitle').value;
    const industryFocus = document.getElementById('industryFocus').value;
    const targetJobDescription = document.getElementById('targetJobDescription').value;

    const experiences = [];
    document.querySelectorAll('.experience-item').forEach(item => {
        experiences.push({
            company: item.querySelector('.company').value,
            position: item.querySelector('.position').value,
            startDate: item.querySelector('.startDate').value,
            endDate: item.querySelector('.endDate').value,
            description: item.querySelector('.description').value
        });
    });

    const skills = document.getElementById('skills').value;
    const education = document.getElementById('education').value;
    const certifications = document.getElementById('certifications').value;

    return {
        personalInfo,
        jobTitle,
        industryFocus,
        targetJobDescription,
        experience: experiences,
        skills: skills.split(',').map(skill => skill.trim()),
        education,
        certifications,
        selectedTemplate,
        jobAnalysis: jobAnalysisData
    };
}

// Resume generation
async function generateResume(type) {
    if (isProcessing) return;

    isProcessing = true;
    resumeData = collectFormData();

    showLoading();

    try {
        if (type === 'basic') {
            await generateBasicResume();
        } else if (type === 'ai') {
            // Check if user has premium access
            if (!checkPremiumAccess()) {
                await upgradeToPremium();
                return;
            }
            await generateAIResume();
        } else if (type === 'ai-plus') {
            // Check if user has pro access
            if (!checkProAccess()) {
                await upgradeToPro();
                return;
            }
            await generateAIPlusResume();
        }
    } catch (error) {
        console.error('Resume generation error:', error);
        showToast('Failed to generate resume. Please try again.', 'error');
    } finally {
        hideLoading();
        isProcessing = false;
    }
}

function checkProAccess() {
    return localStorage.getItem('proAccess') === 'true';
}

async function generateBasicResume() {
    const resumeHTML = createBasicResumeHTML();
    showResumePreview(resumeHTML);
}

async function generateAIResume() {
    try {
        // Get base URL for API calls
        const baseURL = window.location.origin;

        const response = await fetch(`${baseURL}/api/generate-resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resumeData)
        });

        if (!response.ok) {
            throw new Error('Failed to generate AI resume');
        }

        const result = await response.json();

        if (result.success) {
            const resumeHTML = createAIResumeHTML(result.content);
            showResumePreview(resumeHTML, result.content);
        } else {
            throw new Error(result.error || 'AI generation failed');
        }
    } catch (error) {
        console.error('AI Resume generation error:', error);
        showToast('Failed to generate AI resume. Please try again.', 'error');
    }
}

async function generateAIPlusResume() {
    try {
        // First generate the AI resume
        await generateAIResume();

        // Then get scoring and feedback if job description provided
        if (resumeData.targetJobDescription) {
            await scoreResume();
        }
    } catch (error) {
        console.error('AI Plus generation error:', error);
        showToast('Failed to generate AI Plus resume. Please try again.', 'error');
    }
}

async function scoreResume() {
    try {
        const resumeContent = document.getElementById('resumeContent').innerText;

        // Get base URL for API calls
        const baseURL = window.location.origin;

        const response = await fetch(`${baseURL}/api/score-resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeContent,
                jobDescription: resumeData.targetJobDescription
            })
        });

        const result = await response.json();

        if (result.success) {
            displayResumeScoring(result.scoring);
        }
    } catch (error) {
        console.error('Resume scoring error:', error);
        showToast('Failed to score resume', 'error');
    }
}

function displayResumeScoring(scoring) {
    const scoringDiv = document.createElement('div');
    scoringDiv.className = 'resume-scoring';
    scoringDiv.innerHTML = `
        <div class="scoring-header">
            <h3><i class="fas fa-chart-bar"></i> Resume Analysis</h3>
            <div class="overall-score">
                <span class="score-number">${scoring.overallScore}/100</span>
                <span class="score-label">Overall Match</span>
            </div>
        </div>
        <div class="score-breakdown">
            <div class="score-item">
                <span>Keyword Match</span>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${scoring.scores.keywordMatch}%"></div>
                </div>
                <span>${scoring.scores.keywordMatch}/100</span>
            </div>
            <div class="score-item">
                <span>Experience Relevance</span>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${scoring.scores.experienceRelevance}%"></div>
                </div>
                <span>${scoring.scores.experienceRelevance}/100</span>
            </div>
            <div class="score-item">
                <span>Skills Alignment</span>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${scoring.scores.skillsAlignment}%"></div>
                </div>
                <span>${scoring.scores.skillsAlignment}/100</span>
            </div>
            <div class="score-item">
                <span>ATS Compatibility</span>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${scoring.scores.atsCompatibility}%"></div>
                </div>
                <span>${scoring.scores.atsCompatibility}/100</span>
            </div>
        </div>
        <div class="recommendations">
            <h4>Improvement Recommendations:</h4>
            <ul>
                ${scoring.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ${scoring.missingKeywords.length > 0 ? `
            <div class="missing-keywords">
                <h4>Consider Adding These Keywords:</h4>
                <div class="keyword-suggestions">
                    ${scoring.missingKeywords.map(keyword => `<span class="keyword-suggestion">${keyword}</span>`).join('')}
                </div>
            </div>
        ` : ''}
    `;

    const previewModal = document.getElementById('resumePreview');
    previewModal.querySelector('.modal-body').appendChild(scoringDiv);
}

function createBasicResumeHTML() {
    const templateClass = `template-${selectedTemplate}`;

    switch(selectedTemplate) {
        case 'modern':
            return createModernTemplate();
        case 'classic':
            return createClassicTemplate();
        case 'creative':
            return createCreativeTemplate();
        case 'executive':
            return createExecutiveTemplate();
        case 'minimalist':
            return createMinimalistTemplate();
        case 'tech':
            return createTechTemplate();
        default:
            return createModernTemplate();
    }
}

function createModernTemplate() {
    return `
        <div class="resume-container modern-template">
            <div class="resume-header modern-header">
                <h1>${resumeData.personalInfo.name}</h1>
                <div class="subtitle">${resumeData.jobTitle}</div>
                <div class="contact-info">
                    <span><i class="fas fa-envelope"></i> ${resumeData.personalInfo.email}</span>
                    <span><i class="fas fa-phone"></i> ${resumeData.personalInfo.phone}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${resumeData.personalInfo.location}</span>
                </div>
            </div>

            <div class="resume-body modern-body">
                <div class="main-content">
                    <div class="resume-section">
                        <h2><i class="fas fa-briefcase"></i> Experience</h2>
                        ${resumeData.experience.map(exp => `
                            <div class="experience-item modern-experience">
                                <div class="experience-header">
                                    <div class="position-company">
                                        <h3>${exp.position}</h3>
                                        <h4>${exp.company}</h4>
                                    </div>
                                    <div class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                                </div>
                                <p>${exp.description || 'Key responsibilities and achievements will be listed here.'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sidebar">
                    <div class="resume-section">
                        <h2><i class="fas fa-cog"></i> Skills</h2>
                        <div class="skills-grid">
                            ${resumeData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>

                    ${resumeData.education ? `
                        <div class="resume-section">
                            <h2><i class="fas fa-graduation-cap"></i> Education</h2>
                            <p>${resumeData.education}</p>
                        </div>
                    ` : ''}

                    ${resumeData.certifications ? `
                        <div class="resume-section">
                            <h2><i class="fas fa-certificate"></i> Certifications</h2>
                            <p>${resumeData.certifications}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createClassicTemplate() {
    return `
        <div class="resume-container classic-template">
            <div class="resume-header classic-header">
                <h1>${resumeData.personalInfo.name}</h1>
                <hr class="classic-divider">
                <div class="contact-line">
                    ${resumeData.personalInfo.email} • ${resumeData.personalInfo.phone} • ${resumeData.personalInfo.location}
                </div>
                <div class="objective">
                    <strong>${resumeData.jobTitle}</strong>
                </div>
            </div>

            <div class="resume-section classic-section">
                <h2>PROFESSIONAL EXPERIENCE</h2>
                ${resumeData.experience.map(exp => `
                    <div class="experience-item classic-experience">
                        <div class="experience-header">
                            <div><strong>${exp.position}</strong> | ${exp.company}</div>
                            <div class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                        </div>
                        <ul class="classic-list">
                            <li>${exp.description || 'Key responsibilities and achievements'}</li>
                        </ul>
                    </div>
                `).join('')}
            </div>

            <div class="resume-section classic-section">
                <h2>CORE COMPETENCIES</h2>
                <p>${resumeData.skills.join(' • ')}</p>
            </div>

            ${resumeData.education ? `
                <div class="resume-section classic-section">
                    <h2>EDUCATION</h2>
                    <p>${resumeData.education}</p>
                </div>
            ` : ''}

            ${resumeData.certifications ? `
                <div class="resume-section classic-section">
                    <h2>CERTIFICATIONS</h2>
                    <p>${resumeData.certifications}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function createCreativeTemplate() {
    return `
        <div class="resume-container creative-template">
            <div class="creative-sidebar">
                <div class="profile-section">
                    <div class="profile-circle">
                        <span>${resumeData.personalInfo.name.charAt(0)}</span>
                    </div>
                    <h1>${resumeData.personalInfo.name}</h1>
                    <div class="title">${resumeData.jobTitle}</div>
                </div>

                <div class="contact-section">
                    <h3>Contact</h3>
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>${resumeData.personalInfo.email}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${resumeData.personalInfo.phone}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${resumeData.personalInfo.location}</span>
                    </div>
                </div>

                <div class="skills-section">
                    <h3>Skills</h3>
                    ${resumeData.skills.map(skill => `
                        <div class="skill-item">
                            <span>${skill}</span>
                            <div class="skill-bar">
                                <div class="skill-progress"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="creative-main">
                <div class="resume-section">
                    <h2>Experience</h2>
                    ${resumeData.experience.map(exp => `
                        <div class="experience-item creative-experience">
                            <div class="timeline-dot"></div>
                            <div class="experience-content">
                                <h3>${exp.position}</h3>
                                <h4>${exp.company} • ${exp.startDate} - ${exp.endDate || 'Present'}</h4>
                                <p>${exp.description || 'Key responsibilities and achievements'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${resumeData.education ? `
                    <div class="resume-section">
                        <h2>Education</h2>
                        <p>${resumeData.education}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createExecutiveTemplate() {
    return `
        <div class="resume-container executive-template">
            <div class="executive-header">
                <div class="name-title">
                    <h1>${resumeData.personalInfo.name}</h1>
                    <div class="executive-title">${resumeData.jobTitle}</div>
                </div>
                <div class="executive-contact">
                    <div>${resumeData.personalInfo.email}</div>
                    <div>${resumeData.personalInfo.phone}</div>
                    <div>${resumeData.personalInfo.location}</div>
                </div>
            </div>

            <div class="executive-summary">
                <h2>Executive Summary</h2>
                <p>Accomplished ${resumeData.jobTitle} with extensive experience in driving business growth and operational excellence.</p>
            </div>

            <div class="resume-section executive-section">
                <h2>Professional Experience</h2>
                ${resumeData.experience.map(exp => `
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
                        <div class="executive-achievements">
                            <p>${exp.description || 'Strategic leadership and key accomplishments'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="executive-footer">
                <div class="footer-section">
                    <h3>Core Competencies</h3>
                    <div class="competencies-grid">
                        ${resumeData.skills.map(skill => `<span>${skill}</span>`).join('')}
                    </div>
                </div>

                ${resumeData.education ? `
                    <div class="footer-section">
                        <h3>Education</h3>
                        <p>${resumeData.education}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createMinimalistTemplate() {
    return `
        <div class="resume-container minimalist-template">
            <header class="minimalist-header">
                <h1>${resumeData.personalInfo.name}</h1>
                <div class="minimalist-contact">
                    ${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}
                </div>
            </header>

            <section class="minimalist-section">
                <h2>${resumeData.jobTitle}</h2>
            </section>

            <section class="minimalist-section">
                <h2>Experience</h2>
                ${resumeData.experience.map(exp => `
                    <div class="minimalist-item">
                        <div class="item-header">
                            <span class="position">${exp.position}</span>
                            <span class="company">${exp.company}</span>
                            <span class="dates">${exp.startDate}—${exp.endDate || 'Present'}</span>
                        </div>
                        <p class="item-description">${exp.description || 'Key responsibilities and achievements'}</p>
                    </div>
                `).join('')}
            </section>

            <section class="minimalist-section">
                <h2>Skills</h2>
                <p>${resumeData.skills.join(', ')}</p>
            </section>

            ${resumeData.education ? `
                <section class="minimalist-section">
                    <h2>Education</h2>
                    <p>${resumeData.education}</p>
                </section>
            ` : ''}
        </div>
    `;
}

function createTechTemplate() {
    return `
        <div class="resume-container tech-template">
            <div class="tech-header">
                <div class="tech-profile">
                    <h1>&lt;${resumeData.personalInfo.name}/&gt;</h1>
                    <div class="tech-title">// ${resumeData.jobTitle}</div>
                    <div class="tech-contact">
                        <span>📧 ${resumeData.personalInfo.email}</span>
                        <span>📱 ${resumeData.personalInfo.phone}</span>
                        <span>📍 ${resumeData.personalInfo.location}</span>
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
                            ${resumeData.experience.map((exp, index) => `
                                <div class="tech-experience">
                                    <div class="code-line">
                                        <span class="line-number">${(index + 1).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            <span class="keyword">const</span> 
                                            <span class="variable">${exp.position.replace(/\s+/g, '')}</span> = {
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(index + 2).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            company: <span class="string">"${exp.company}"</span>,
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(index + 3).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            period: <span class="string">"${exp.startDate} - ${exp.endDate || 'Present'}"</span>,
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(index + 4).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            achievements: <span class="string">"${exp.description || 'Key contributions'}"</span>
                                        </span>
                                    </div>
                                    <div class="code-line">
                                        <span class="line-number">${(index + 5).toString().padStart(2, '0')}</span>
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
                            ${resumeData.skills.map(skill => `
                                <div class="tech-skill">
                                    <span class="skill-icon">⚡</span>
                                    <span>${skill}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${resumeData.education ? `
                        <div class="tech-education">
                            <h3>// Education</h3>
                            <div class="edu-item">
                                <span class="keyword">import</span> knowledge <span class="keyword">from</span> 
                                <span class="string">"${resumeData.education}"</span>;
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createAIResumeHTML(aiContent) {
    return `
        <div class="resume-header">
            <h1>${resumeData.personalInfo.name}</h1>
            <p>${resumeData.jobTitle}</p>
            <p>${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}</p>
        </div>

        ${aiContent.summary ? `
            <div class="resume-section">
                <h2>Professional Summary</h2>
                <p>${aiContent.summary}</p>
            </div>
        ` : ''}

        <div class="resume-section">
            <h2>Experience</h2>
            ${aiContent.enhancedExperience ? aiContent.enhancedExperience.map((exp, index) => `
                <div class="experience-item-resume">
                    <div class="experience-header">
                        <div class="company-position">
                            <strong>${resumeData.experience[index]?.position || exp.position}</strong> at ${resumeData.experience[index]?.company || exp.company}
                        </div>
                        <div class="dates">${resumeData.experience[index]?.startDate} - ${resumeData.experience[index]?.endDate || 'Present'}</div>
                    </div>
                    <p>${exp.description}</p>
                </div>
            `).join('') : resumeData.experience.map(exp => `
                <div class="experience-item-resume">
                    <div class="experience-header">
                        <div class="company-position">
                            <strong>${exp.position}</strong> at ${exp.company}
                        </div>
                        <div class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                    </div>
                    <p>${exp.description}</p>
                </div>
            `).join('')}
        </div>

        <div class="resume-section">
            <h2>Skills</h2>
            <p>${aiContent.optimizedSkills ? aiContent.optimizedSkills.join(', ') : resumeData.skills.join(', ')}</p>
        </div>

        ${resumeData.education ? `
            <div class="resume-section">
                <h2>Education</h2>
                <p>${resumeData.education}</p>
            </div>
        ` : ''}

        ${resumeData.certifications ? `
            <div class="resume-section">
                <h2>Certifications</h2>
                <p>${resumeData.certifications}</p>
            </div>
        ` : ''}

        ${aiContent.additionalSections ? aiContent.additionalSections.map(section => `
            <div class="resume-section">
                <h2>${section.title}</h2>
                <p>${section.content}</p>
            </div>
        `).join('')` : ''}
`;
}

// Preview and export functions
function showResumePreview(htmlContent) {
    document.getElementById('resumeContent').innerHTML = htmlContent;
    modal.style.display = 'none';
    previewModal.style.display = 'block';
}

function editResume() {
    previewModal.style.display = 'none';
    modal.style.display = 'block';
}

function downloadPDF() {
    // Check for premium access for downloads
    if (!checkPremiumAccess()) {
        showToast('PDF download requires premium access. Upgrade to download your resume!', 'info');
        upgradeToPremium();
        return;
    }

    // Simple print functionality - in production, you'd use a proper PDF library
    const printContent = document.getElementById('resumeContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Resume - ${resumeData.personalInfo.name}</title>
                <style>
                    ${getResumeStyles()}
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function getResumeStyles() {
    return `
        body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .resume-header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 1rem; margin-bottom: 2rem; }
        .resume-header h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #1e293b; }
        .resume-section { margin-bottom: 2rem; }
        .resume-section h2 { color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .experience-item-resume { margin-bottom: 1.5rem; }
        .experience-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
        .company-position { font-weight: bold; color: #1e293b; }
        .dates { color: #64748b; font-style: italic; }
        @media print { body { margin: 0; padding: 0; } }
    `;
}

// Payment functions
function checkPremiumAccess() {
    // In a real app, this would check user's subscription status
    return localStorage.getItem('premiumAccess') === 'true';
}

async function upgradeToPremium() {
    await initiatePayment(299, 'Premium Plan');
}

async function upgradeToPro() {
    await initiatePayment(599, 'Pro Plan');
}

async function initiatePayment(amount, planName) {
    try {
        showLoading();
        console.log('Initiating payment for:', planName, 'Amount:', amount);

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        });

        console.log('Payment response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Payment error response:', errorText);
            throw new Error(`Payment service error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Payment order result:', result);

        if (result.success && result.order) {
            // Check if Razorpay is loaded
            if (typeof Razorpay === 'undefined') {
                throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
            }

            // Get Razorpay key from backend
            const keyResponse = await fetch('/api/razorpay-key');
            const keyData = await keyResponse.json();

            const options = {
                key: keyData.key,
                amount: result.order.amount,
                currency: result.order.currency,
                name: 'AI Resume Builder',
                description: planName,
                order_id: result.order.id,
                handler: function(response) {
                    console.log('Payment successful:', response);
                    verifyPayment(response);
                },
                prefill: {
                    name: resumeData.personalInfo?.name || '',
                    email: resumeData.personalInfo?.email || ''
                },
                theme: {
                    color: '#4f46e5'
                },
                modal: {
                    ondismiss: function() {
                        console.log('Payment cancelled by user');
                        showToast('Payment cancelled', 'info');
                        hideLoading();
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            throw new Error(result.error || 'Failed to create payment order');
        }
    } catch (error) {
        console.error('Payment initialization error:', error);
        let errorMessage = 'Payment initialization failed';

        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - Please check your connection';
        } else if (error.message.includes('Payment service error')) {
            errorMessage = 'Payment service unavailable - Please try again later';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

async function verifyPayment(paymentResponse) {
    try {
        // Get base URL for API calls
        const baseURL = window.location.origin;

        const response = await fetch(`${baseURL}/api/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentResponse)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('premiumAccess', 'true');
            showToast('Payment successful! Premium features activated.', 'success');
            // Continue with AI resume generation
            await generateAIResume();
        } else {
            throw new Error(result.error || 'Payment verification failed');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        showToast('Payment verification failed. Please contact support.', 'error');
    }
}

// Utility functions
function showLoading() {
    loadingOverlay.style.display = 'block';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    // Simple toast notification - in production, use a proper toast library
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#4f46e5'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 4000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function resetForm() {
    currentStep = 1;
    updateStepDisplay();
    document.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });

    // Reset experience items to just one
    const container = document.getElementById('experienceContainer');
    const firstItem = container.querySelector('.experience-item');
    container.innerHTML = '';
    container.appendChild(firstItem);
    firstItem.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);