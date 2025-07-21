
// Global variables - Initialize only if not already defined
if (typeof window.currentStep === 'undefined') {
    window.currentStep = 1;
    window.resumeData = {
        personalInfo: {},
        experience: [],
        skills: [],
        jobTitle: '',
        targetJobDescription: ''
    };
    window.uploadedResumeFile = null;
    window.enhancedResumeData = null;
    window.isProcessing = false;
    window.selectedTemplate = 'modern';
    window.jobAnalysisData = null;
    window.hasUsedAI = false;
}

// Local references to global variables
let currentStep = window.currentStep;
let resumeData = window.resumeData;
let uploadedResumeFile = window.uploadedResumeFile;
let enhancedResumeData = window.enhancedResumeData;
let isProcessing = window.isProcessing;
let selectedTemplate = window.selectedTemplate;
let jobAnalysisData = window.jobAnalysisData;
let hasUsedAI = window.hasUsedAI;

let modal, previewModal, loadingOverlay;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    modal = document.getElementById('resumeBuilder');
    previewModal = document.getElementById('resumePreview');
    loadingOverlay = document.getElementById('loadingOverlay');

    initializeEventListeners();
    initializeMobileMenu();
    initializeFileUpload();

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal || event.target === previewModal) {
            closeModal();
        }
    });
});

// Start building function - opens the resume builder modal
function startBuilding() {
    console.log('Starting resume building process...');
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

function viewTemplates() {
    alert('Template gallery coming soon! For now, you can create resumes with our AI-powered builder.');
}

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
}

function initializeMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');

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
    enhanceBtn.style.display = 'block';
    enhanceBtn.style.marginTop = '10px';

    showToast('Resume uploaded successfully! AI enhancement starting...', 'success');

    // Auto-start AI enhancement
    setTimeout(() => {
        enhanceExistingResume();
    }, 1000);
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
        const fileText = await readFileAsText(uploadedResumeFile);
        const jobDescription = document.getElementById('targetJobDescription').value || '';
        const jobTitle = document.getElementById('jobTitle').value || 'Professional';

        console.log('Starting resume enhancement...');
        console.log('Resume text length:', fileText.length);

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
            }),
            signal: AbortSignal.timeout(120000) // 2 minutes timeout
        });

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
            // Validate and clean the enhanced data
            const cleanedData = validateAndCleanEnhancedData(result.enhancedData);
            console.log('Cleaned enhanced data:', cleanedData);

            populateFormWithEnhancedData(cleanedData);
            window.enhancedResumeData = cleanedData;
            localStorage.setItem('usedAIEnhancement', 'true');
            showToast('Resume enhanced successfully! You can now edit and preview.', 'success');

            // Hide enhance button and show preview button
            const enhanceBtn = document.getElementById('enhanceBtn');
            if (enhanceBtn) {
                enhanceBtn.innerHTML = '<i class="fas fa-eye"></i> Preview & Download';
                enhanceBtn.onclick = function() {
                    showEnhancedResumePreview();
                };
                enhanceBtn.classList.add('btn-success');
            }
        } else {
            throw new Error(result.error || 'AI enhancement failed - no data returned');
        }
    } catch (error) {
        console.error('Resume enhancement error:', error);

        let errorMessage = 'AI enhancement failed. Please try again.';

        if (error.name === 'TimeoutError') {
            errorMessage = 'Enhancement timeout - please try with a shorter resume or check your connection.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Enhancement was cancelled - please try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - please check your connection and try again.';
        }

        showToast(errorMessage, 'error');

        // Try to use basic extraction as fallback
        try {
            const fileText = await readFileAsText(uploadedResumeFile);
            const fallbackData = extractBasicResumeInfo(fileText);
            populateFormWithEnhancedData(fallbackData);
            showToast('Basic resume info extracted successfully!', 'success');
        } catch (fallbackError) {
            console.error('Fallback extraction also failed:', fallbackError);
        }
    } finally {
        hideLoading();
    }
}

// Helper function for basic resume info extraction
function extractBasicResumeInfo(resumeText) {
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);

    // Extract email
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // Extract phone
    const phoneMatch = resumeText.match(/[\+]?[(]?[\d\s\-\(\)]{10,}/);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    // Extract name (first meaningful line)
    let name = '';
    for (const line of lines.slice(0, 5)) {
        if (!line.includes('@') && !line.match(/[\d\-\(\)]{6,}/) && line.length > 2 && line.length < 60) {
            name = line.trim();
            break;
        }
    }

    // Extract skills
    const skillKeywords = ['javascript', 'python', 'java', 'react', 'node', 'html', 'css', 'sql'];
    const foundSkills = skillKeywords.filter(skill => 
        resumeText.toLowerCase().includes(skill)
    ).map(skill => skill.charAt(0).toUpperCase() + skill.slice(1));

    return {
        personalInfo: {
            name: name || 'Your Name',
            email: email || 'your.email@example.com',
            phone: phone || '+1234567890',
            location: 'Your Location'
        },
        jobTitle: 'Professional',
        experience: [{
            company: 'Previous Company',
            position: 'Professional',
            startDate: '2023-01-01',
            endDate: '',
            description: 'Key responsibilities and achievements'
        }],
        skills: foundSkills.length > 0 ? foundSkills : ['Communication', 'Problem Solving', 'Teamwork'],
        education: 'Your Education',
        certifications: ''
    };
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
    try {
        // Clean and validate data first
        const cleanedData = cleanResumeData(data);

        // Populate personal info
        if (cleanedData.personalInfo) {
            const fields = ['fullName', 'email', 'phone', 'location'];
            const dataKeys = ['name', 'email', 'phone', 'location'];

            fields.forEach((field, index) => {
                const element = document.getElementById(field);
                const value = cleanedData.personalInfo[dataKeys[index]];
                if (element && value) {
                    element.value = value;
                }
            });
        }

        // Populate job title
        if (cleanedData.jobTitle) {
            const jobTitleElement = document.getElementById('jobTitle');
            if (jobTitleElement) {
                jobTitleElement.value = cleanedData.jobTitle;
            }
        }

        // Clear and populate experience with better structure
        const container = document.getElementById('experienceContainer');
        if (container) {
            container.innerHTML = '';

            if (cleanedData.experience && cleanedData.experience.length > 0) {
                cleanedData.experience.forEach((exp, index) => {
                    const experienceItem = document.createElement('div');
                    experienceItem.className = 'experience-item';

                    // Clean and format description
                    const formattedDescription = formatExperienceDescription(exp.description || '');

                    experienceItem.innerHTML = `
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" class="company" value="${escapeHtml(exp.company || '')}" required>
                        </div>
                        <div class="form-group">
                            <label>Position</label>
                            <input type="text" class="position" value="${escapeHtml(exp.position || '')}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Start Date</label>
                                <input type="date" class="startDate" value="${exp.startDate || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>End Date</label>
                                <input type="date" class="endDate" value="${exp.endDate || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea class="description" rows="4" placeholder="Describe your responsibilities and achievements">${escapeHtml(formattedDescription)}</textarea>
                        </div>
                        ${index > 0 ? '<button type="button" class="btn-secondary btn-small" onclick="removeExperience(this)">Remove</button>' : ''}
                    `;
                    container.appendChild(experienceItem);
                });
            } else {
                addDefaultExperience();
            }
        }

        // Populate skills
        if (data.skills) {
            const skillsValue = Array.isArray(data.skills) ? data.skills.join(', ') : data.skills;
            const skillsElement = document.getElementById('skills');
            if (skillsElement) {
                skillsElement.value = skillsValue;
            }
        }

        // Populate education
        if (data.education && data.education !== 'NA') {
            const educationElement = document.getElementById('education');
            if (educationElement) {
                educationElement.value = data.education;
            }
        }

        // Populate certifications
        if (data.certifications && data.certifications !== 'NA') {
            const certificationsElement = document.getElementById('certifications');
            if (certificationsElement) {
                certificationsElement.value = data.certifications;
            }
        }

        // Update global resumeData
        window.resumeData = {
            personalInfo: cleanedData.personalInfo || window.resumeData.personalInfo,
            jobTitle: cleanedData.jobTitle || window.resumeData.jobTitle,
            experience: cleanedData.experience || window.resumeData.experience,
            skills: cleanedData.skills || window.resumeData.skills,
            education: cleanedData.education || window.resumeData.education,
            certifications: cleanedData.certifications || window.resumeData.certifications,
            selectedTemplate: window.selectedTemplate,
            targetJobDescription: window.resumeData.targetJobDescription
        };

        console.log('Form populated with enhanced data:', window.resumeData);
    } catch (error) {
        console.error('Error populating form:', error);
        showToast('Error loading resume data', 'error');
    }
}

function addDefaultExperience() {
    const container = document.getElementById('experienceContainer');
    const experienceItem = document.createElement('div');
    experienceItem.className = 'experience-item';
    experienceItem.innerHTML = `
        <div class="form-group">
            <label>Company</label>
            <input type="text" class="company" placeholder="Company Name" required>
        </div>
        <div class="form-group">
            <label>Position</label>
            <input type="text" class="position" placeholder="Job Title" required>
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
    `;
    container.appendChild(experienceItem);
}

// Helper function to clean and validate resume data
function cleanResumeData(data) {
    if (!data) return {};

    const cleaned = {
        personalInfo: {},
        experience: [],
        skills: [],
        jobTitle: '',
        education: '',
        certifications: ''
    };

    // Clean personal info
    if (data.personalInfo) {
        cleaned.personalInfo = {
            name: cleanString(data.personalInfo.name),
            email: cleanString(data.personalInfo.email),
            phone: cleanString(data.personalInfo.phone),
            location: cleanString(data.personalInfo.location)
        };
    }

    // Clean job title
    cleaned.jobTitle = cleanString(data.jobTitle) || 'Professional';

    // Clean experience array
    if (Array.isArray(data.experience)) {
        cleaned.experience = data.experience
            .filter(exp => exp && typeof exp === 'object')
            .map(exp => ({
                company: cleanString(exp.company),
                position: cleanString(exp.position),
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                description: cleanString(exp.description)
            }))
            .filter(exp => exp.company && exp.position); // Only keep if has company and position
    }

    // Clean skills
    if (Array.isArray(data.skills)) {
        cleaned.skills = data.skills.filter(skill => skill && typeof skill === 'string' && skill.trim() !== '');
    } else if (typeof data.skills === 'string') {
        cleaned.skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    }

    // Clean education and certifications
    cleaned.education = cleanString(data.education);
    cleaned.certifications = cleanString(data.certifications);

    return cleaned;
}

// Function to validate and clean enhanced data
function validateAndCleanEnhancedData(data) {
    const cleaned = {
        personalInfo: {},
        experience: [],
        skills: [],
        jobTitle: '',
        education: '',
        certifications: ''
    };

    // Clean personal info
    if (data.personalInfo) {
        cleaned.personalInfo = {
            name: cleanString(data.personalInfo.name),
            email: cleanString(data.personalInfo.email),
            phone: cleanString(data.personalInfo.phone),
            location: cleanString(data.personalInfo.location)
        };
    }

    // Clean job title
    cleaned.jobTitle = cleanString(data.jobTitle) || 'Professional';

    // Clean and extract ALL experience entries
    if (Array.isArray(data.experience)) {
        cleaned.experience = data.experience
            .filter(exp => exp && typeof exp === 'object')
            .map(exp => ({
                company: cleanString(exp.company),
                position: cleanString(exp.position),
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                description: cleanString(exp.description)
            }))
            .filter(exp => exp.company && exp.position);
    }

    // Clean skills with better object handling
    if (data.skills) {
        if (Array.isArray(data.skills)) {
            cleaned.skills = data.skills
                .filter(skill => skill && typeof skill === 'string' && skill.trim() !== '')
                .map(skill => skill.trim());
        } else if (typeof data.skills === 'object') {
            // Handle skills object with categories
            const allSkills = [];
            Object.values(data.skills).forEach(category => {
                if (Array.isArray(category)) {
                    allSkills.push(...category.filter(skill => typeof skill === 'string' && skill.trim()));
                } else if (typeof category === 'string') {
                    allSkills.push(category.trim());
                }
            });
            cleaned.skills = allSkills;
        } else if (typeof data.skills === 'string') {
            cleaned.skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
        }
    }

    // Clean education and certifications
    cleaned.education = cleanString(data.education);
    cleaned.certifications = cleanString(data.certifications);

    return cleaned;
}

// Helper function to clean strings
function cleanString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').replace(/^(NA|N\/A|null|undefined)$/i, '');
}

// Helper function to format experience descriptions
function formatExperienceDescription(description) {
    if (!description || typeof description !== 'string') return '';

    // Clean the description
    let cleaned = description.trim();

    // If it's a very long single sentence, try to split it into bullet points
    if (cleaned.length > 200 && !cleaned.includes('\n') && !cleaned.includes('•')) {
        // Split by periods and create bullet points
        const sentences = cleaned.split(/\.(?=\s+[A-Z])/);
        if (sentences.length > 1) {
            cleaned = sentences
                .filter(sentence => sentence.trim().length > 10)
                .map(sentence => sentence.trim())
                .join('.\n• ');
            cleaned = '• ' + cleaned + (cleaned.endsWith('.') ? '' : '.');
        }
    }

    return cleaned;
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = progressPercent + '%';
    }
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
    if (!analysisDiv) return;

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
        const company = item.querySelector('.company')?.value?.trim();
        const position = item.querySelector('.position')?.value?.trim();
        const startDate = item.querySelector('.startDate')?.value;
        const endDate = item.querySelector('.endDate')?.value;
        const description = item.querySelector('.description')?.value?.trim();

        // Only add experience if it has meaningful content
        if (company && position && company !== '' && position !== '') {
            experiences.push({
                company: company || 'Company Name',
                position: position || 'Position Title',
                startDate: startDate || '',
                endDate: endDate || '',
                description: description || 'Key responsibilities and achievements'
            });
        }
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
            position: 'Software Engineer',
            startDate: '2023-01-01',
            endDate: '',
            description: 'Key responsibilities and achievements in your role'
        }],
        skills: skills.length > 0 ? skills : ['JavaScript', 'Python', 'React', 'Node.js'],
        education,
        certifications,
        selectedTemplate: window.selectedTemplate,
        jobAnalysis: window.jobAnalysisData
    };
}

async function generateResume(type) {
    if (isProcessing) return;

    isProcessing = true;
    window.resumeData = collectFormData();

    showLoading();

    try {
        console.log('Generating AI-enhanced resume...');
        await generateAIResume();
    } catch (error) {
        console.error('Resume generation error:', error);
        showToast('Failed to generate resume. Please try again.', 'error');
    } finally {
        hideLoading();
        isProcessing = false;
    }
}

async function generateAIResume() {
    try {
        const response = await fetch('/api/generate-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(window.resumeData)
        });

        const result = await response.json();

        if (result.success) {
            displayResumePreview(result.resumeHtml);
            showToast('Resume generated successfully!', 'success');
        } else {
            throw new Error(result.error || 'Failed to generate resume');
        }
    } catch (error) {
        console.error('AI Resume generation error:', error);
        showToast('Failed to generate AI-enhanced resume', 'error');
    }
}

function displayResumePreview(resumeHtml) {
    const previewContent = document.getElementById('resumePreviewContent');
    if (previewContent && resumeHtml) {
        previewContent.innerHTML = resumeHtml;
        previewModal.style.display = 'block';
    }
}

async function downloadPDF() {
    try {
        showLoading();
        
        // Get the resume content
        const resumeContent = document.getElementById('resumePreviewContent').innerHTML;
        
        if (!resumeContent) {
            throw new Error('No resume content to download');
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Resume</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .modern-template { max-width: 800px; margin: 0 auto; }
                    @media print {
                        body { margin: 0; padding: 10px; }
                        .modern-template { max-width: none; }
                    }
                </style>
            </head>
            <body>
                ${resumeContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            hideLoading();
            showToast('Resume download initiated!', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download resume', 'error');
        hideLoading();
    }
}

function editResume() {
    closeModal();
}

function showEnhancedResumePreview() {
    if (window.enhancedResumeData) {
        window.resumeData = window.enhancedResumeData;
        generateAIResume();
    } else {
        showToast('No enhanced resume data available', 'error');
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

// Helper function to format dates properly
function formatDate(dateString) {
    if (!dateString) return 'Present';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
        return dateString;
    }
}

function resetForm() {
    currentStep = 1;
    showStep(currentStep);
    document.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });

    const container = document.getElementById('experienceContainer');
    if (container) {
        const firstItem = container.querySelector('.experience-item');
        container.innerHTML = '';
        if (firstItem) {
            container.appendChild(firstItem);
            firstItem.querySelectorAll('input, textarea').forEach(input => {
                input.value = '';
            });
        } else {
            addDefaultExperience();
        }
    }

    localStorage.removeItem('usedAIEnhancement');
}

// Add animation styles only if not already added
if (!document.querySelector('style[data-animations]')) {
    const animationsStyle = document.createElement('style');
    animationsStyle.setAttribute('data-animations', 'true');
    animationsStyle.textContent = `
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
    document.head.appendChild(animationsStyle);
}

// Make all functions globally available for HTML onclick handlers
window.startBuilding = startBuilding;
window.viewTemplates = viewTemplates;
window.enhanceExistingResume = enhanceExistingResume;
window.showEnhancedResumePreview = showEnhancedResumePreview;
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
window.enhanceUploadedResume = enhanceExistingResume; // Alias for compatibility
