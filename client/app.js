// Global variables
let currentStep = 1;
let resumeData = null;
let selectedTemplate = 'modern';
let uploadedFile = null;

// Configuration
const config = {
    apiUrl: window.location.origin,
    razorpayKeyId: 'rzp_test_1234567890', // Replace with actual key
    premiumTemplates: ['executive', 'creative']
};

console.log('Config loaded successfully');

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    showStep(1);
    setupDragAndDrop();
    setupManualCreation();
});

// Show specific step
function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Show current step
    document.getElementById(`step${step}`).classList.remove('hidden');
    currentStep = step;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const dropZone = document.querySelector('.border-dashed');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-400');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-400');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-400');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files } });
        }
    });
}

// Setup manual resume creation
function setupManualCreation() {
    // Add manual creation button after file input button
    const fileButton = document.querySelector('button[onclick="document.getElementById(\'fileInput\').click()"]');
    if (fileButton && fileButton.parentElement) {
        const manualButton = document.createElement('button');
        manualButton.className = 'bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition ml-4';
        manualButton.innerHTML = '<i class="fas fa-edit mr-2"></i>Create Manually';
        manualButton.onclick = startManualCreation;
        fileButton.parentElement.appendChild(manualButton);
    }
}

// Start manual resume creation
function startManualCreation() {
    resumeData = {
        personalInfo: {
            name: '',
            email: '',
            phone: '',
            address: '',
            linkedin: '',
            github: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
    };
    
    // Add one experience and education item by default
    showStep(2);
    addExperience();
    addEducation();
    showToast('Ready to create your resume manually!', 'success');
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Please upload a PDF or DOCX file', 'error');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
    }

    uploadedFile = file;
    showProgress(true);

    try {
        // Upload file
        const formData = new FormData();
        formData.append('resume', file);

        const uploadResponse = await fetch(`${config.apiUrl}/api/upload`, {
            method: 'POST',
            body: formData
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
            throw new Error(uploadResult.error);
        }

        // Parse uploaded file
        const parseResponse = await fetch(`${config.apiUrl}/api/parse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: uploadResult.filename })
        });

        if (!parseResponse.ok) {
            const errorData = await parseResponse.json();
            throw new Error(errorData.error || 'Failed to parse resume');
        }

        const parseResult = await parseResponse.json();

        if (!parseResult.success) {
            throw new Error(parseResult.error || 'Parsing failed');
        }

        resumeData = parseResult.data;
        
        // Show step 2 first, then populate with AI data
        showStep(2);
        
        // Add default items if not present
        if (!resumeData.experience || resumeData.experience.length === 0) {
            addExperience();
        }
        if (!resumeData.education || resumeData.education.length === 0) {
            addEducation();
        }
        
        // Auto-fill with AI extracted data
        populateForm(resumeData);
        showToast('Resume parsed and auto-filled successfully!', 'success');

    } catch (error) {
        console.error('Upload error:', error);
        showToast(error.message || 'Failed to process resume', 'error');
    } finally {
        showProgress(false);
    }
}

// Show/hide progress
function showProgress(show) {
    const progress = document.getElementById('uploadProgress');
    if (show) {
        progress.classList.remove('hidden');
    } else {
        progress.classList.add('hidden');
    }
}

// Populate form with parsed data
function populateForm(data) {
    // Personal info
    if (data.personalInfo) {
        document.getElementById('name').value = data.personalInfo.name || '';
        document.getElementById('email').value = data.personalInfo.email || '';
        document.getElementById('phone').value = data.personalInfo.phone || '';
        document.getElementById('address').value = data.personalInfo.address || '';
        document.getElementById('linkedin').value = data.personalInfo.linkedin || '';
        document.getElementById('github').value = data.personalInfo.github || '';
    }

    // Summary
    document.getElementById('summary').value = data.summary || '';

    // Skills
    if (data.skills && data.skills.length > 0) {
        document.getElementById('skills').value = data.skills.join(', ');
    }

    // Experience - populate existing items or add new ones
    if (data.experience && data.experience.length > 0) {
        // Clear existing experience items first
        document.getElementById('experienceContainer').innerHTML = '';
        
        data.experience.forEach((exp, index) => {
            addExperience();
            const expElements = document.querySelectorAll('#experienceContainer .experience-item');
            const expElement = expElements[index];
            if (expElement) {
                expElement.querySelector('[name="company"]').value = exp.company || '';
                expElement.querySelector('[name="position"]').value = exp.position || '';
                expElement.querySelector('[name="startDate"]').value = exp.startDate || '';
                expElement.querySelector('[name="endDate"]').value = exp.endDate || '';
                expElement.querySelector('[name="description"]').value = exp.description || '';
                expElement.querySelector('[name="employmentType"]').value = exp.employmentType || '';
                expElement.querySelector('[name="workLocation"]').value = exp.workLocation || '';
            }
        });
    }

    // Education - populate existing items or add new ones
    if (data.education && data.education.length > 0) {
        // Clear existing education items first
        document.getElementById('educationContainer').innerHTML = '';
        
        data.education.forEach((edu, index) => {
            addEducation();
            const eduElements = document.querySelectorAll('#educationContainer .education-item');
            const eduElement = eduElements[index];
            if (eduElement) {
                eduElement.querySelector('[name="institution"]').value = edu.institution || '';
                eduElement.querySelector('[name="degree"]').value = edu.degree || '';
                eduElement.querySelector('[name="field"]').value = edu.field || '';
                eduElement.querySelector('[name="startDate"]').value = edu.startDate || '';
                eduElement.querySelector('[name="endDate"]').value = edu.endDate || '';
                eduElement.querySelector('[name="gpa"]').value = edu.gpa || '';
                eduElement.querySelector('[name="studyMode"]').value = edu.studyMode || '';
            }
        });
    }
}

// Add experience item
function addExperience() {
    const container = document.getElementById('experienceContainer');
    const expDiv = document.createElement('div');
    expDiv.className = 'experience-item bg-white bg-opacity-5 rounded-lg p-4 mb-4';
    expDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" name="company" placeholder="Company Name" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="position" placeholder="Job Title" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <select name="employmentType" class="w-full p-3 rounded bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                <option value="" class="text-gray-800">Employment Type</option>
                <option value="full-time" class="text-gray-800">Full-time</option>
                <option value="part-time" class="text-gray-800">Part-time</option>
                <option value="contract" class="text-gray-800">Contract</option>
                <option value="internship" class="text-gray-800">Internship</option>
                <option value="freelance" class="text-gray-800">Freelance</option>
            </select>
            <select name="workLocation" class="w-full p-3 rounded bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                <option value="" class="text-gray-800">Work Location</option>
                <option value="onsite" class="text-gray-800">On-site</option>
                <option value="remote" class="text-gray-800">Remote</option>
                <option value="hybrid" class="text-gray-800">Hybrid</option>
            </select>
            <input type="month" name="startDate" placeholder="Start Date" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="month" name="endDate" placeholder="End Date" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
        </div>
        <textarea name="description" rows="3" placeholder="Job description and achievements..." class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30 mb-3"></textarea>
        <button type="button" onclick="this.parentElement.remove()" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Remove</button>
    `;
    container.appendChild(expDiv);
}

// Add education item
function addEducation() {
    const container = document.getElementById('educationContainer');
    const eduDiv = document.createElement('div');
    eduDiv.className = 'education-item bg-white bg-opacity-5 rounded-lg p-4 mb-4';
    eduDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" name="institution" placeholder="Institution Name" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <select name="degree" class="w-full p-3 rounded bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                <option value="" class="text-gray-800">Degree Type</option>
                <option value="High School" class="text-gray-800">High School</option>
                <option value="Associate" class="text-gray-800">Associate Degree</option>
                <option value="Bachelor" class="text-gray-800">Bachelor's Degree</option>
                <option value="Master" class="text-gray-800">Master's Degree</option>
                <option value="PhD" class="text-gray-800">PhD</option>
                <option value="Certificate" class="text-gray-800">Certificate</option>
                <option value="Diploma" class="text-gray-800">Diploma</option>
            </select>
            <input type="text" name="field" placeholder="Field of Study" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <select name="studyMode" class="w-full p-3 rounded bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                <option value="" class="text-gray-800">Study Mode</option>
                <option value="full-time" class="text-gray-800">Full-time</option>
                <option value="part-time" class="text-gray-800">Part-time</option>
                <option value="online" class="text-gray-800">Online</option>
                <option value="correspondence" class="text-gray-800">Correspondence</option>
            </select>
            <input type="month" name="startDate" placeholder="Start Date" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="month" name="endDate" placeholder="End Date" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="gpa" placeholder="GPA (optional)" class="w-full p-3 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Remove</button>
    `;
    container.appendChild(eduDiv);
}

// Collect form data
function collectFormData() {
    const data = {
        personalInfo: {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            linkedin: document.getElementById('linkedin').value,
            github: document.getElementById('github').value,
            experienceLevel: document.getElementById('experienceLevel').value,
            jobType: document.getElementById('jobType').value
        },
        summary: document.getElementById('summary').value,
        skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s),
        experience: [],
        education: []
    };

    // Collect experience
    document.querySelectorAll('#experienceContainer .experience-item').forEach(item => {
        data.experience.push({
            company: item.querySelector('[name="company"]').value,
            position: item.querySelector('[name="position"]').value,
            employmentType: item.querySelector('[name="employmentType"]').value,
            workLocation: item.querySelector('[name="workLocation"]').value,
            startDate: item.querySelector('[name="startDate"]').value,
            endDate: item.querySelector('[name="endDate"]').value,
            description: item.querySelector('[name="description"]').value
        });
    });

    // Collect education
    document.querySelectorAll('#educationContainer .education-item').forEach(item => {
        data.education.push({
            institution: item.querySelector('[name="institution"]').value,
            degree: item.querySelector('[name="degree"]').value,
            field: item.querySelector('[name="field"]').value,
            studyMode: item.querySelector('[name="studyMode"]').value,
            startDate: item.querySelector('[name="startDate"]').value,
            endDate: item.querySelector('[name="endDate"]').value,
            gpa: item.querySelector('[name="gpa"]').value
        });
    });

    return data;
}

// Generate preview and show step 3
function generatePreview() {
    const formData = collectFormData();
    const previewHtml = generatePreviewHtml(formData);
    document.getElementById('resumePreview').innerHTML = previewHtml;
    showStep(3);
}

// Generate preview HTML
function generatePreviewHtml(data) {
    return `
        <div class="p-8 max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8 border-b-2 border-gray-300 pb-6">
                <h1 class="text-4xl font-bold text-gray-800 mb-2">${data.personalInfo.name || 'Your Name'}</h1>
                <div class="flex justify-center space-x-4 text-gray-600">
                    ${data.personalInfo.email ? `<span><i class="fas fa-envelope mr-1"></i>${data.personalInfo.email}</span>` : ''}
                    ${data.personalInfo.phone ? `<span><i class="fas fa-phone mr-1"></i>${data.personalInfo.phone}</span>` : ''}
                </div>
                ${data.personalInfo.address ? `<p class="text-gray-600 mt-2">${data.personalInfo.address}</p>` : ''}
                <div class="flex justify-center space-x-4 mt-2">
                    ${data.personalInfo.linkedin ? `<a href="${data.personalInfo.linkedin}" class="text-blue-600"><i class="fab fa-linkedin mr-1"></i>LinkedIn</a>` : ''}
                    ${data.personalInfo.github ? `<a href="${data.personalInfo.github}" class="text-blue-600"><i class="fab fa-github mr-1"></i>GitHub</a>` : ''}
                </div>
            </div>

            <!-- Summary -->
            ${data.summary ? `
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Professional Summary</h2>
                    <p class="text-gray-700 leading-relaxed">${data.summary}</p>
                </div>
            ` : ''}

            <!-- Experience -->
            ${data.experience.length > 0 ? `
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="mb-6">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="text-xl font-semibold text-gray-800">${exp.position || 'Position'}</h3>
                                <span class="text-gray-600">${exp.startDate || ''} - ${exp.endDate || ''}</span>
                            </div>
                            <p class="text-lg text-gray-600 mb-2">${exp.company || 'Company'}</p>
                            <p class="text-gray-700">${exp.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Education -->
            ${data.education.length > 0 ? `
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Education</h2>
                    ${data.education.map(edu => `
                        <div class="mb-4">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="text-xl font-semibold text-gray-800">${edu.degree || 'Degree'} ${edu.field ? `in ${edu.field}` : ''}</h3>
                                <span class="text-gray-600">${edu.startDate || ''} - ${edu.endDate || ''}</span>
                            </div>
                            <p class="text-lg text-gray-600">${edu.institution || 'Institution'}</p>
                            ${edu.gpa ? `<p class="text-gray-600">GPA: ${edu.gpa}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Skills -->
            ${data.skills.length > 0 ? `
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Skills</h2>
                    <div class="flex flex-wrap gap-2">
                        ${data.skills.map(skill => `
                            <span class="bg-gray-200 px-3 py-1 rounded-full text-gray-700 font-medium">${skill}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Download PDF
async function downloadPDF() {
    try {
        showProgress(true);

        const formData = collectFormData();

        const response = await fetch(`${config.apiUrl}/api/pdf/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeData: formData,
                template: selectedTemplate
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.personalInfo.name || 'resume'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('PDF downloaded successfully!', 'success');

    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download PDF', 'error');
    } finally {
        showProgress(false);
    }
}

// Payment modal functions
function showPaymentModal() {
    document.getElementById('paymentModal').classList.remove('hidden');
    document.getElementById('paymentModal').classList.add('flex');

    document.getElementById('payButton').onclick = initializePayment;
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    document.getElementById('paymentModal').classList.remove('flex');

    // Reset to free template
    selectedTemplate = 'modern';
    document.querySelectorAll('.template-option').forEach(el => {
        el.classList.remove('border-white');
        el.classList.add('border-transparent');
    });
    document.querySelector('.template-option').classList.remove('border-transparent');
    document.querySelector('.template-option').classList.add('border-white');
}

// Initialize payment
async function initializePayment() {
    try {
        // Create order
        const response = await fetch(`${config.apiUrl}/api/payment/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 99,
                currency: 'INR'
            })
        });

        const order = await response.json();

        if (!order.success) {
            throw new Error(order.error);
        }

        // Initialize Razorpay
        const options = {
            key: config.razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            name: 'ResumeX',
            description: 'Premium Template Access',
            order_id: order.order_id,
            handler: function(response) {
                verifyPayment(response);
            },
            theme: {
                color: '#667eea'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error('Payment error:', error);
        showToast('Failed to initialize payment', 'error');
    }
}

// Verify payment
async function verifyPayment(paymentData) {
    try {
        const response = await fetch(`${config.apiUrl}/api/payment/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Payment successful! Premium template unlocked', 'success');
            closePaymentModal();

            // Store premium access in localStorage
            localStorage.setItem('premiumAccess', 'true');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Verification error:', error);
        showToast('Payment verification failed', 'error');
    }
}

// Select template
function selectTemplate(template, event) {
    // Check if premium template and user doesn't have access
    if (config.premiumTemplates.includes(template) && !localStorage.getItem('premiumAccess')) {
        showPaymentModal();
        return;
    }

    selectedTemplate = template;

    // Update UI
    document.querySelectorAll('.template-option').forEach(el => {
        el.classList.remove('border-white');
        el.classList.add('border-transparent');
    });

    if (event && event.target) {
        const templateOption = event.target.closest('.template-option');
        if (templateOption) {
            templateOption.classList.remove('border-transparent');
            templateOption.classList.add('border-white');
        }
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;

    // Set toast color based on type
    toast.className = `toast ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg`;

    // Show toast
    toast.classList.add('show');

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}