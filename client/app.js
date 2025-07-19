
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

        const parseResult = await parseResponse.json();

        if (!parseResult.success) {
            throw new Error(parseResult.error);
        }

        resumeData = parseResult.data;
        populateForm(resumeData);
        showToast('Resume parsed successfully!', 'success');
        showStep(2);

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

    // Experience
    if (data.experience && data.experience.length > 0) {
        data.experience.forEach((exp, index) => {
            if (index === 0) {
                addExperience();
            } else {
                addExperience();
            }
            const expElements = document.querySelectorAll('#experienceContainer .experience-item');
            const expElement = expElements[index];
            if (expElement) {
                expElement.querySelector('[name="company"]').value = exp.company || '';
                expElement.querySelector('[name="position"]').value = exp.position || '';
                expElement.querySelector('[name="startDate"]').value = exp.startDate || '';
                expElement.querySelector('[name="endDate"]').value = exp.endDate || '';
                expElement.querySelector('[name="description"]').value = exp.description || '';
            }
        });
    }

    // Education
    if (data.education && data.education.length > 0) {
        data.education.forEach((edu, index) => {
            if (index === 0) {
                addEducation();
            } else {
                addEducation();
            }
            const eduElements = document.querySelectorAll('#educationContainer .education-item');
            const eduElement = eduElements[index];
            if (eduElement) {
                eduElement.querySelector('[name="institution"]').value = edu.institution || '';
                eduElement.querySelector('[name="degree"]').value = edu.degree || '';
                eduElement.querySelector('[name="field"]').value = edu.field || '';
                eduElement.querySelector('[name="startDate"]').value = edu.startDate || '';
                eduElement.querySelector('[name="endDate"]').value = edu.endDate || '';
                eduElement.querySelector('[name="gpa"]').value = edu.gpa || '';
            }
        });
    }
}

// Add experience entry
function addExperience() {
    const container = document.getElementById('experienceContainer');
    const expDiv = document.createElement('div');
    expDiv.className = 'experience-item bg-white bg-opacity-5 rounded p-4 mb-4';
    expDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h4 class="text-white font-semibold">Experience Entry</h4>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input type="text" name="company" placeholder="Company" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="position" placeholder="Position" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="startDate" placeholder="Start Date" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="endDate" placeholder="End Date" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
        </div>
        <textarea name="description" rows="3" placeholder="Job description..." class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30"></textarea>
    `;
    container.appendChild(expDiv);
}

// Add education entry
function addEducation() {
    const container = document.getElementById('educationContainer');
    const eduDiv = document.createElement('div');
    eduDiv.className = 'education-item bg-white bg-opacity-5 rounded p-4 mb-4';
    eduDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h4 class="text-white font-semibold">Education Entry</h4>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input type="text" name="institution" placeholder="Institution" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="degree" placeholder="Degree" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="field" placeholder="Field of Study" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="gpa" placeholder="GPA" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" name="startDate" placeholder="Start Date" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
            <input type="text" name="endDate" placeholder="End Date" class="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30">
        </div>
    `;
    container.appendChild(eduDiv);
}

// Select template
function selectTemplate(template) {
    selectedTemplate = template;
    
    // Update UI
    document.querySelectorAll('.template-option').forEach(el => {
        el.classList.remove('border-white');
        el.classList.add('border-transparent');
    });
    
    event.target.closest('.template-option').classList.remove('border-transparent');
    event.target.closest('.template-option').classList.add('border-white');
    
    // Check if premium template
    if (config.premiumTemplates.includes(template)) {
        showPaymentModal();
    }
}

// Generate preview
async function generatePreview() {
    try {
        showProgress(true);
        
        // Collect form data
        const formData = collectFormData();
        
        // Generate preview HTML
        const previewHtml = generatePreviewHtml(formData);
        document.getElementById('resumePreview').innerHTML = previewHtml;
        
        showStep(3);
        showToast('Preview generated successfully!', 'success');
        
    } catch (error) {
        console.error('Preview error:', error);
        showToast('Failed to generate preview', 'error');
    } finally {
        showProgress(false);
    }
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
            github: document.getElementById('github').value
        },
        summary: document.getElementById('summary').value,
        skills: document.getElementById('skills').value.split(',').map(skill => skill.trim()).filter(skill => skill),
        experience: [],
        education: []
    };

    // Collect experience
    document.querySelectorAll('#experienceContainer .experience-item').forEach(item => {
        data.experience.push({
            company: item.querySelector('[name="company"]').value,
            position: item.querySelector('[name="position"]').value,
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
            startDate: item.querySelector('[name="startDate"]').value,
            endDate: item.querySelector('[name="endDate"]').value,
            gpa: item.querySelector('[name="gpa"]').value
        });
    });

    return data;
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
