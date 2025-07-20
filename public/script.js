
// Global variables
let currentStep = 1;
let resumeData = {
    personalInfo: {},
    experience: [],
    skills: [],
    jobTitle: '',
    targetJobDescription: ''
};
let uploadedResumeFile = null;
let enhancedResumeData = null;
let isProcessing = false;
let selectedTemplate = 'modern';
let jobAnalysisData = null;
let hasUsedAI = false;

// DOM elements
let modal, previewModal, loadingOverlay;

// Start building function - opens the resume builder modal
function startBuilding() {
    console.log('Starting resume building process...');
    const modal = document.getElementById('resumeBuilder');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        currentStep = 1;
        showStep(1);
        updateProgress();
    } else {
        console.error('Resume builder modal not found');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeMobileMenu();

    modal = document.getElementById('resumeBuilder');
    previewModal = document.getElementById('resumePreview');
    loadingOverlay = document.getElementById('loadingOverlay');

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal || event.target === previewModal) {
            closeModal();
        }
    });

    // File upload handler
    const fileUpload = document.getElementById('existingResume');
    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
    }
});

function initializeEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            closeModal();
        };
    });

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle) {
        mobileToggle.onclick = function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        };
    }

    // File upload functionality
    initializeFileUpload();
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

function initializeFileUpload() {
    const uploadArea = document.getElementById('resumeUploadArea');
    const fileInput = document.getElementById('existingResume');

    if (!uploadArea || !fileInput) return;

    // Click to upload
    uploadArea.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) return;
        fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
}

function handleFileUpload(file) {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast('Please upload a PDF, DOC, DOCX, or TXT file', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
    }

    uploadedResumeFile = file;

    const uploadArea = document.getElementById('resumeUploadArea');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    const uploadedInfo = document.getElementById('uploadedFileInfo');
    const fileName = document.getElementById('fileName');
    const enhanceBtn = document.getElementById('enhanceBtn');

    placeholder.style.display = 'none';
    uploadedInfo.style.display = 'flex';
    fileName.textContent = file.name;
    enhanceBtn.style.display = 'inline-block';

    if (file.type === 'application/pdf') {
        showToast('PDF uploaded! AI will extract and enhance the text content.', 'success');
    } else {
        showToast('Resume uploaded successfully!', 'success');
    }
}

function removeUploadedFile() {
    uploadedResumeFile = null;
    enhancedResumeData = null;

    const uploadArea = document.getElementById('resumeUploadArea');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    const uploadedInfo = document.getElementById('uploadedFileInfo');
    const enhanceBtn = document.getElementById('enhanceBtn');
    const fileInput = document.getElementById('existingResume');

    placeholder.style.display = 'block';
    uploadedInfo.style.display = 'none';
    enhanceBtn.style.display = 'none';
    fileInput.value = '';

    showToast('File removed', 'info');
}

async function enhanceExistingResume() {
    if (!uploadedResumeFile) {
        showToast('Please upload a resume first', 'error');
        return;
    }

    showLoading();

    try {
        console.log('Starting resume enhancement...');

        const fileText = await readFileAsText(uploadedResumeFile);
        console.log('File text extracted, length:', fileText.length);

        const jobDescription = document.getElementById('targetJobDescription').value || '';
        const jobTitle = document.getElementById('jobTitle').value || 'Professional';

        console.log('Sending enhancement request...');

        const response = await fetch('/api/enhance-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                resumeText: fileText,
                jobDescription,
                jobTitle
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || `Server error ${response.status}`;
            } catch (e) {
                errorText = await response.text() || `Server error ${response.status}`;
            }
            throw new Error(errorText);
        }

        const result = await response.json();
        console.log('Enhancement result:', result);

        if (result.success && result.enhancedData) {
            populateFormWithEnhancedData(result.enhancedData);
            localStorage.setItem('usedAIEnhancement', 'true');
            showToast('Resume enhanced successfully! Download now requires payment.', 'success');
        } else {
            throw new Error(result.error || 'Enhancement failed - no data returned');
        }
    } catch (error) {
        console.error('Resume enhancement error:', error);
        let errorMessage = 'Failed to enhance resume. Please try again.';

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - Unable to connect to server';
        } else if (error.message.includes('Invalid API key')) {
            errorMessage = 'AI service temporarily unavailable - Please try again later';
        } else if (error.message.includes('Rate limit')) {
            errorMessage = 'Service temporarily busy - Please wait a moment and try again';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        if (file.type === 'application/pdf') {
            extractPDFText(file)
                .then(resolve)
                .catch(reject);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result;
            if (!result || result.trim().length === 0) {
                reject(new Error('File appears to be empty or unreadable'));
                return;
            }
            resolve(result);
        };
        reader.onerror = function(e) {
            console.error('FileReader error:', e);
            reject(new Error('Failed to read file - please try a different file format'));
        };

        reader.readAsText(file);
    });
}

async function extractPDFText(file) {
    try {
        if (typeof pdfjsLib === 'undefined') {
            await loadPDFJS();
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            fullText += pageText + '\n';
        }

        if (!fullText || fullText.trim().length === 0) {
            throw new Error('No text content found in PDF');
        }

        return fullText.trim();
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF. Please ensure the PDF contains selectable text.');
    }
}

function loadPDFJS() {
    return new Promise((resolve, reject) => {
        if (typeof pdfjsLib !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = function() {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
        };
        script.onerror = function() {
            reject(new Error('Failed to load PDF processing library'));
        };

        document.head.appendChild(script);
    });
}

function populateFormWithEnhancedData(data) {
    if (data.personalInfo) {
        if (data.personalInfo.name) document.getElementById('fullName').value = data.personalInfo.name;
        if (data.personalInfo.email) document.getElementById('email').value = data.personalInfo.email;
        if (data.personalInfo.phone) document.getElementById('phone').value = data.personalInfo.phone;
        if (data.personalInfo.location) document.getElementById('location').value = data.personalInfo.location;
    }

    if (data.jobTitle && !document.getElementById('jobTitle').value) {
        document.getElementById('jobTitle').value = data.jobTitle;
    }

    if (data.experience && data.experience.length > 0) {
        const container = document.getElementById('experienceContainer');
        container.innerHTML = '';

        data.experience.forEach((exp, index) => {
            if (index > 0) addExperience();

            const items = container.querySelectorAll('.experience-item');
            const currentItem = items[index];

            if (currentItem) {
                currentItem.querySelector('.company').value = exp.company || '';
                currentItem.querySelector('.position').value = exp.position || '';
                currentItem.querySelector('.startDate').value = exp.startDate || '';
                currentItem.querySelector('.endDate').value = exp.endDate || '';
                currentItem.querySelector('.description').value = exp.description || '';
            }
        });
    }

    if (data.skills) {
        document.getElementById('skills').value = Array.isArray(data.skills) ? data.skills.join(', ') : data.skills;
    }

    if (data.education) {
        document.getElementById('education').value = data.education;
    }

    if (data.certifications) {
        document.getElementById('certifications').value = data.certifications;
    }
}

function viewTemplates() {
    alert('Template gallery coming soon! For now, you can create resumes with our AI-powered builder.');
}

function closeModal() {
    if (modal) modal.style.display = 'none';
    if (previewModal) previewModal.style.display = 'none';
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showStep(stepNumber) {
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');

    steps.forEach((step, index) => {
        if (index + 1 <= stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    formSteps.forEach((step, index) => {
        if (index + 1 === stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        showStep(currentStep);
        updateProgress();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
    }
}

function updateProgress() {
    const progressPercent = (currentStep / 5) * 100;
}

function validateCurrentStep() {
    const currentFormStep = document.getElementById(`step${currentStep}`);
    if (!currentFormStep) return true;

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

async function analyzeJobDescription() {
    const jobDescription = document.getElementById('targetJobDescription').value;
    if (!jobDescription.trim()) {
        showToast('Please enter a job description to analyze', 'error');
        return;
    }

    showLoading();
    try {
        console.log('Starting job analysis...');

        const response = await fetch('/api/analyze-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ jobDescription: jobDescription.trim() })
        });

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = 'Unable to read error response';
            }
            throw new Error(`Server error ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.success && result.analysis) {
            jobAnalysisData = result.analysis;
            displayJobAnalysis(result.analysis);
            showToast('Job description analyzed successfully!', 'success');
        } else {
            throw new Error(result.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Job analysis error:', error);
        let errorMessage = 'Failed to analyze job description';

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - Unable to connect to server';
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

function selectTemplate(templateName) {
    selectedTemplate = templateName;

    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    const templateCard = document.querySelector(`[data-template="${templateName}"]`);
    if (templateCard) {
        templateCard.classList.add('selected');
    }

    showToast(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template selected!`, 'success');
}

function collectFormData() {
    const personalInfo = {
        name: document.getElementById('fullName')?.value || 'Your Name',
        email: document.getElementById('email')?.value || 'your.email@example.com',
        phone: document.getElementById('phone')?.value || '+91 9999999999',
        location: document.getElementById('location')?.value || 'Your Location'
    };

    const jobTitle = document.getElementById('jobTitle')?.value || 'Software Engineer';
    const industryFocus = document.getElementById('industryFocus')?.value || 'Technology';
    const targetJobDescription = document.getElementById('targetJobDescription')?.value || '';

    const experiences = [];
    document.querySelectorAll('.experience-item').forEach(item => {
        const company = item.querySelector('.company')?.value || 'Company Name';
        const position = item.querySelector('.position')?.value || 'Position Title';
        const startDate = item.querySelector('.startDate')?.value || '2023-01-01';
        const endDate = item.querySelector('.endDate')?.value || '';
        const description = item.querySelector('.description')?.value || 'Key responsibilities and achievements';

        experiences.push({
            company,
            position,
            startDate,
            endDate,
            description
        });
    });

    const skillsInput = document.getElementById('skills')?.value || 'JavaScript, Python, React, Node.js';
    const skills = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);

    const education = document.getElementById('education')?.value || 'Bachelor of Technology in Computer Science';
    const certifications = document.getElementById('certifications')?.value || '';

    return {
        personalInfo,
        jobTitle,
        industryFocus,
        targetJobDescription,
        experience: experiences.length > 0 ? experiences : [{
            company: 'Your Company',
            position: jobTitle,
            startDate: '2023-01-01',
            endDate: '',
            description: 'Key responsibilities and achievements in your role'
        }],
        skills: skills.length > 0 ? skills : ['JavaScript', 'Python', 'React', 'Node.js'],
        education,
        certifications,
        selectedTemplate,
        jobAnalysis: jobAnalysisData
    };
}

async function generateResume(type) {
    if (isProcessing) return;

    isProcessing = true;
    resumeData = collectFormData();

    showLoading();

    try {
        if (type === 'basic') {
            await generateBasicResume();
        } else if (type === 'ai') {
            if (!checkPremiumAccess()) {
                await upgradeToPremium();
                return;
            }
            await generateAIResume();
        } else if (type === 'ai-plus') {
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

function checkPremiumAccess() {
    return localStorage.getItem('premiumAccess') === 'true';
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
        const response = await fetch('/api/generate-resume', {
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
            localStorage.setItem('usedAIEnhancement', 'true');

            const resumeHTML = createAIResumeHTML(result.content);
            showResumePreview(resumeHTML, result.content);
            showToast('AI resume generated! Download requires payment.', 'info');
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
        await generateAIResume();

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

        const response = await fetch('/api/score-resume', {
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
        ${scoring.missingKeywords && scoring.missingKeywords.length > 0 ? `
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
                    <h1>&lt;${resumeData.personalInfo.name || 'Developer'}/&gt;</h1>
                    <div class="tech-title">// ${resumeData.jobTitle || 'Software Engineer'}</div>
                    <div class="tech-contact">
                        <span>📧 ${resumeData.personalInfo.email || 'your.email@example.com'}</span>
                        <span>📱 ${resumeData.personalInfo.phone || '+91 9999999999'}</span>
                        <span>📍 ${resumeData.personalInfo.location || 'Your Location'}</span>
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
                            ${resumeData.experience.map((exp, index) => {
                                let company = exp.company || 'TechCompany';
                                let position = exp.position || 'Developer';
                                let description = exp.description || 'Key responsibilities and achievements';

                                if (company.toUpperCase() === 'NA' || company.trim() === '') {
                                    company = 'TechCompany';
                                }
                                if (position.toUpperCase() === 'NA' || position.trim() === '') {
                                    position = 'Developer';
                                }
                                if (description.toUpperCase() === 'NA' || description.trim() === '') {
                                    description = 'Key responsibilities and achievements';
                                }

                                let varName = position.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                                if (!varName || varName === 'na') {
                                    varName = 'experience' + (index + 1);
                                }

                                const lineStart = index * 6 + 1;
                                return `
                                <div class="tech-experience">
                                    <div class="code-line">
                                        <span class="line-number">${lineStart.toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            <span class="keyword">const</span> 
                                            <span class="variable">${varName}</span> = {
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(lineStart + 1).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            position: <span class="string">"${position}"</span>,
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(lineStart + 2).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            company: <span class="string">"${company}"</span>,
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(lineStart + 3).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            period: <span class="string">"${exp.startDate || '2023-01-01'} - ${exp.endDate || 'Present'}"</span>,
                                        </span>
                                    </div>
                                    <div class="code-line indent">
                                        <span class="line-number">${(lineStart + 4).toString().padStart(2, '0')}</span>
                                        <span class="code-text">
                                            achievements: <span class="string">"${description}"</span>
                                        </span>
                                    </div>
                                    <div class="code-line">
                                        <span class="line-number">${(lineStart + 5).toString().padStart(2, '0')}</span>
                                        <span class="code-text">};</span>
                                    </div>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <div class="tech-sidebar">
                    <div class="tech-skills">
                        <h3>// Tech Stack</h3>
                        <div class="tech-skills-list">
                            ${resumeData.skills.map(skill => {
                                const cleanSkill = skill.trim();
                                if (cleanSkill.toUpperCase() === 'NA' || cleanSkill === '') {
                                    return '';
                                }
                                return `
                                <div class="tech-skill">
                                    <span class="skill-icon">⚡</span>
                                    <span>${cleanSkill}</span>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="tech-education">
                        <h3>// Education</h3>
                        <div class="edu-item">
                            <span class="keyword">import</span> knowledge <span class="keyword">from</span> 
                            <span class="string">"${resumeData.education && resumeData.education.toUpperCase() !== 'NA' ? resumeData.education : 'Bachelor of Technology'}"</span>
                        </div>
                    </div>

                    ${resumeData.certifications && resumeData.certifications.toUpperCase() !== 'NA' ? `
                        <div class="tech-certifications">
                            <h3>// Certifications</h3>
                            <div class="cert-item">
                                <span class="keyword">const</span> certifications = [
                                <span class="string">"${resumeData.certifications}"</span>
                                ];
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
        `).join('') : ''}
    `;
}

function showResumePreview(htmlContent) {
    document.getElementById('resumeContent').innerHTML = htmlContent;

    const hasUsedAI = localStorage.getItem('usedAIEnhancement') === 'true';
    if (hasUsedAI && !checkPremiumAccess()) {
        const indicator = document.createElement('div');
        indicator.className = 'ai-usage-indicator';
        indicator.innerHTML = `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; margin: 10px 0; border-radius: 5px; color: #92400e;">
                <i class="fas fa-robot"></i> <strong>AI Enhanced Resume</strong> - Download requires payment (₹99)
            </div>
        `;
        document.getElementById('resumeContent').insertBefore(indicator, document.getElementById('resumeContent').firstChild);
    }

    if (modal) modal.style.display = 'none';
    if (previewModal) previewModal.style.display = 'block';
}

function editResume() {
    if (previewModal) previewModal.style.display = 'none';
    if (modal) modal.style.display = 'block';
}

function downloadPDF() {
    const hasUsedAI = localStorage.getItem('usedAIEnhancement') === 'true';

    if (hasUsedAI && !checkPremiumAccess()) {
        showToast('You used AI enhancement. Download requires payment of ₹99!', 'info');
        upgradeToDownload();
        return;
    }

    if (!hasUsedAI && !checkPremiumAccess()) {
        performDownload();
        return;
    }

    if (checkPremiumAccess()) {
        performDownload();
        return;
    }

    showToast('PDF download requires payment. Pay ₹99 to download your resume!', 'info');
    upgradeToDownload();
}

function performDownload() {
    try {
        const resumeContent = document.getElementById('resumeContent');
        if (!resumeContent) {
            showToast('No resume content found. Please generate a resume first.', 'error');
            return;
        }

        const printContent = resumeContent.innerHTML;
        if (!printContent || printContent.trim().length === 0) {
            showToast('Resume content is empty. Please generate a resume first.', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Popup blocked. Please allow popups and try again.', 'error');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Resume - ${resumeData?.personalInfo?.name || 'Resume'}</title>
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

        setTimeout(() => {
            printWindow.print();
        }, 500);

        showToast('Resume download started!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download resume. Please try again.', 'error');
    }
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

async function upgradeToDownload() {
    await initiatePayment(99, 'Download Access');
}

async function upgradeToPremium() {
    await initiatePayment(99, 'Download Access');
}

async function upgradeToPro() {
    await initiatePayment(99, 'Download Access');
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

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Payment error response:', errorText);
            throw new Error(`Payment service error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.order) {
            if (typeof Razorpay === 'undefined') {
                throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
            }

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
        const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentResponse)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('premiumAccess', 'true');
            showToast('Payment successful! Download access activated.', 'success');
            setTimeout(() => {
                performDownload();
            }, 1000);
        } else {
            throw new Error(result.error || 'Payment verification failed');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        showToast('Payment verification failed. Please contact support.', 'error');
    }
}

function showLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'block';
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'info') {
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
    showStep(currentStep);
    document.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });

    const container = document.getElementById('experienceContainer');
    const firstItem = container.querySelector('.experience-item');
    container.innerHTML = '';
    container.appendChild(firstItem);
    firstItem.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });

    localStorage.removeItem('usedAIEnhancement');
}

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

// Make all functions globally available
window.startBuilding = startBuilding;
window.viewTemplates = viewTemplates;
window.enhanceExistingResume = enhanceExistingResume;
window.removeUploadedFile = removeUploadedFile;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.closeModal = closeModal;
window.generateResume = generateResume;
window.downloadPDF = downloadPDF;
window.editResume = editResume;
window.selectTemplate = selectTemplate;
window.addExperience = addExperience;
window.removeExperience = removeExperience;
window.analyzeJobDescription = analyzeJobDescription;
