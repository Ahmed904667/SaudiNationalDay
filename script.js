// Simple data
const moods = {
    'happy': 'Images/Image1.PNG',
    'proud': 'Images/Image2.PNG',
    'grateful': 'Images/Image3.PNG',
    'excited': 'Images/Image4.PNG'
};

// Google Sheets Configuration
// Replace these values with your actual Google Sheets setup
const GOOGLE_SHEETS_CONFIG = {
    // You'll need to replace this with your actual Google Sheets URL
    // Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid=0
    SHEET_ID: '1QZ1Tw-X0yS0wnGWbodFCMoOp2N5lR_padOnSHd4GOOM',
    
    // Google Apps Script Web App URL for writing data
    // You'll create this in Google Apps Script
    WRITE_URL: 'https://script.google.com/macros/s/AKfycbxxjIumxc6FOITrT0fvC-5mtuBRFUrbIpFNb-nhsE3NyvvdelbzB72xWGMzDOOaRuSi/exec',
    
    // Google Sheets API URL for reading data (you'll need API key)
    READ_URL: 'https://script.google.com/macros/s/AKfycbxxjIumxc6FOITrT0fvC-5mtuBRFUrbIpFNb-nhsE3NyvvdelbzB72xWGMzDOOaRuSi/exec'
};

// Mood translations for Arabic
const MOOD_NAMES = {
    'happy': 'سعيد',
    'proud': 'فخور', 
    'grateful': 'ممتن',
    'excited': 'متحمس'
};

// Card navigation functions with modern scale + blur animation
function showMoodSelection() {
    // Check if user already submitted today
    const hasSubmitted = localStorage.getItem('saudiNationSubmitted');
    const submissionDate = localStorage.getItem('saudiNationSubmissionDate');
    const today = new Date().toDateString();
    
    if (hasSubmitted && submissionDate === today) {
        // User already submitted - go directly to results
        switchCard('introCard', 'resultsCard');
        loadResults();
        return;
    }
    
    switchCard('introCard', 'moodCard');
}

function showIntro() {
    switchCard(['moodCard', 'resultsCard'], 'introCard');
}

function showResults() {
    switchCard('moodCard', 'resultsCard');
    loadResults(); // Load results when showing the results card
}

// Generic card switching function
function switchCard(fromCardId, toCardId) {
    // Handle multiple from cards (array) or single card (string)
    const fromCards = Array.isArray(fromCardId) ? fromCardId : [fromCardId];
    const toCard = document.getElementById(toCardId);
    
    // Start switching animation for all from cards
    fromCards.forEach(cardId => {
        const fromCard = document.getElementById(cardId);
        if (fromCard && (fromCard.classList.contains('active') || fromCard.classList.contains('initial-load'))) {
            fromCard.classList.remove('initial-load', 'active');
            fromCard.classList.add('switching');
        }
    });
    
    // Quick transition to target card
    setTimeout(() => {
        fromCards.forEach(cardId => {
            const fromCard = document.getElementById(cardId);
            if (fromCard) {
                fromCard.classList.remove('switching');
                fromCard.classList.add('inactive');
            }
        });
        
        if (toCard) {
            toCard.classList.remove('inactive');
            toCard.classList.add('active');
        }
    }, 200);
}

// Select mood and save to Google Sheets
async function selectMood(mood) {
    // Check if user already submitted today
    const hasSubmitted = localStorage.getItem('saudiNationSubmitted');
    const submissionDate = localStorage.getItem('saudiNationSubmissionDate');
    const today = new Date().toDateString();
    
    if (hasSubmitted && submissionDate === today) {
        // User already submitted today - show message and redirect to results
        alert('شكراً لك! لقد شاركت بالفعل اليوم. يمكنك المشاركة مرة واحدة فقط يومياً.');
        showResults();
        return;
    }
    
    // Track submission immediately
    trackSubmission(mood);
    
    // Show the mood image modal IMMEDIATELY for better UX
    showMood(mood);
    
    // Switch to results card in the background (user won't see this yet)
    switchCard('moodCard', 'resultsCard');
    loadResults(); // Load results data
    
    // Save data in the background
    try {
        await saveMoodToSheets(mood);
        
        // Show a subtle success indicator in the modal
        
        // Refresh results after successful save
        setTimeout(() => {
            loadResults();
        }, 1000);
        
    } catch (error) {
        // Still works with local storage fallback
        // Results will show local data
    }
}

// Show mood - detect device and show appropriate modal
function showMood(mood) {
    const isDesktop = window.innerWidth >= 769;
    
    if (isDesktop) {
        // Desktop modal
        const modal = document.getElementById('modalDesktop');
        const modalContent = modal.querySelector('.modal-content-desktop');
        const modalControls = modal.querySelector('.modal-controls-desktop');
        const modalLoading = document.getElementById('modalLoadingDesktop');
        const image = document.getElementById('modalImageDesktop');
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        modal.style.display = 'flex';
        modalLoading.style.display = 'flex';
        modalControls.classList.remove('show'); // Hide controls initially
        
        setTimeout(() => {
            modal.classList.add('show');
            modalContent.classList.add('show');
        }, 10);
        
        image.onload = function() {
            modalLoading.style.display = 'none';
            setTimeout(() => {
                image.classList.add('loaded');
                modalControls.classList.add('show'); // Show controls after image loads
            }, 100);
        };
        
        image.src = moods[mood];
    } else {
        // Mobile modal
        const modal = document.getElementById('modalMobile');
        const modalContent = modal.querySelector('.modal-content-mobile');
        const modalActions = modal.querySelector('.modal-actions-mobile');
        const modalLoading = document.getElementById('modalLoadingMobile');
        const image = document.getElementById('modalImageMobile');
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        modal.style.display = 'flex';
        modalLoading.style.display = 'flex';
        modalActions.classList.remove('show'); // Hide actions initially
        
        setTimeout(() => {
            modal.classList.add('show');
            modalContent.classList.add('show');
        }, 10);
        
        image.onload = function() {
            modalLoading.style.display = 'none';
            setTimeout(() => {
                image.classList.add('loaded');
                modalActions.classList.add('show'); // Show actions after image loads
            }, 100);
        };
        
        image.src = moods[mood];
    }
}

// Close modal - handle both desktop and mobile with animations
function closeModal() {
    const desktopModal = document.getElementById('modalDesktop');
    const mobileModal = document.getElementById('modalMobile');
    
    // Close desktop modal with animations
    if (desktopModal.style.display === 'flex') {
        const modalContent = desktopModal.querySelector('.modal-content-desktop');
        const modalControls = desktopModal.querySelector('.modal-controls-desktop');
        const modalLoading = document.getElementById('modalLoadingDesktop');
        const image = document.getElementById('modalImageDesktop');
        
        // Re-enable body scroll
        document.body.classList.remove('modal-open');
        
        // Start close animations
        modalControls.classList.remove('show'); // Hide controls first
        image.classList.remove('loaded'); // Scale down image
        modalLoading.style.display = 'none';
        
        setTimeout(() => {
            modalContent.classList.remove('show'); // Content animation
        }, 100);
        
        setTimeout(() => {
            desktopModal.classList.remove('show'); // Background fade
        }, 200);
        
        setTimeout(() => {
            desktopModal.style.display = 'none';
        }, 600);
    }
    
    // Close mobile modal with animations
    if (mobileModal.style.display === 'flex') {
        const modalContent = mobileModal.querySelector('.modal-content-mobile');
        const modalActions = mobileModal.querySelector('.modal-actions-mobile');
        const modalLoading = document.getElementById('modalLoadingMobile');
        const image = document.getElementById('modalImageMobile');
        
        // Re-enable body scroll
        document.body.classList.remove('modal-open');
        
        // Start close animations
        modalActions.classList.remove('show'); // Hide actions first
        image.classList.remove('loaded'); // Scale down image
        modalLoading.style.display = 'none';
        
        setTimeout(() => {
            modalContent.classList.remove('show'); // Content animation
        }, 100);
        
        setTimeout(() => {
            mobileModal.classList.remove('show'); // Background fade
        }, 200);
        
        setTimeout(() => {
            mobileModal.style.display = 'none';
        }, 600);
    }
}

// Save image - simple approach
function saveImage(event) {
    // Prevent event propagation to avoid closing modal
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const desktopImage = document.getElementById('modalImageDesktop');
    const mobileImage = document.getElementById('modalImageMobile');
    const image = desktopImage && desktopImage.src ? desktopImage : mobileImage;
    
    if (!image || !image.src) {
        alert('لا يمكن تحميل الصورة');
        return false;
    }
    
    // Simple direct download
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `saudi-national-day-mood-${Date.now()}.png`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showDownloadSuccess();
    return false;
}

// Direct link download fallback
function downloadDirectLink(imageSrc) {
    hideDownloadProgress();
    
    // Extract file extension from source
    const extension = imageSrc.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    const fileExt = validExtensions.includes(extension) ? extension : 'png';
    
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `saudi-national-day-mood-${Date.now()}.${fileExt}`;
    link.style.display = 'none';
    link.style.position = 'absolute';
    link.style.left = '-9999px';
    
    document.body.appendChild(link);
    
    try {
        link.click();
        showDownloadSuccess();
    } catch (clickError) {
        // Last resort - show instructions for manual download
        alert('لتحميل الصورة: انقر بالزر الأيمن على الصورة واختر "حفظ الصورة باسم"');
    }
    
    setTimeout(() => {
        if (link.parentNode) {
            document.body.removeChild(link);
        }
    }, 100);
}

// Show download progress indicator
function showDownloadProgress() {
    // Remove any existing indicators
    const existingIndicators = document.querySelectorAll('.download-progress-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    const indicator = document.createElement('div');
    indicator.className = 'download-progress-indicator';
    indicator.textContent = 'جاري تحميل الصورة... ⏳';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 138, 74, 0.7);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
        z-index: 99999;
        animation: slideInDown 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        pointer-events: none;
    `;
    
    document.body.appendChild(indicator);
}

// Hide download progress indicator
function hideDownloadProgress() {
    const indicators = document.querySelectorAll('.download-progress-indicator');
    indicators.forEach(indicator => {
        if (indicator.parentNode) {
            indicator.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                if (indicator.parentNode) {
                    document.body.removeChild(indicator);
                }
            }, 300);
        }
    });
}

// Show download success indicator
function showDownloadSuccess() {
    // Remove any existing indicators
    const existingIndicators = document.querySelectorAll('.download-success-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Create success message
    const indicator = document.createElement('div');
    indicator.className = 'download-success-indicator';
    indicator.textContent = 'تم تحميل النشرة بنجاح! ✅';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 138, 74, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
        z-index: 99999;
        animation: slideInDown 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        pointer-events: none;
    `;
    
    document.body.appendChild(indicator);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (indicator && indicator.parentNode) {
            indicator.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                if (indicator.parentNode) {
                    document.body.removeChild(indicator);
                }
            }, 300);
        }
    }, 4000);
}

// Share image - handle both modal types
async function shareImage() {
    const desktopImage = document.getElementById('modalImageDesktop');
    const mobileImage = document.getElementById('modalImageMobile');
    const image = desktopImage.src ? desktopImage : mobileImage;
    
    try {
        // Convert image to blob
        const response = await fetch(image.src);
        const blob = await response.blob();
        const file = new File([blob], `spimaco-mood-${Date.now()}.png`, { type: blob.type });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            // Share the actual image file
            await navigator.share({
                title: 'شارك شعورك اليوم',
                text: 'شاهد هذه الصورة التي تعبر عن شعوري اليوم',
                files: [file]
            });
        } else if (navigator.share) {
            // Fallback to URL sharing
            await navigator.share({
                title: 'شارك شعورك اليوم',
                text: 'شاهد هذه الصورة التي تعبر عن شعوري اليوم',
                url: image.src
            });
        } else {
            // Final fallback - copy to clipboard
            await navigator.clipboard.writeText(image.src);
            alert('تم نسخ رابط الصورة!');
        }
    } catch (error) {
        // Fallback - copy to clipboard
        try {
            await navigator.clipboard.writeText(image.src);
            alert('تم نسخ رابط الصورة!');
        } catch (clipboardError) {
            alert('لا يمكن مشاركة الصورة');
        }
    }
}

// Close modal and show results (results are already active in background)
function closeModalAndShowResults() {
    closeModal();
    // Results card is already active, user will see it immediately
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});



// Add indicator to modal
function addModalIndicator(message, type) {
    // Remove any existing indicators
    const existingIndicators = document.querySelectorAll('.save-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = `save-indicator save-indicator-${type}`;
    indicator.textContent = message;
    
    // Style the indicator
    indicator.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(0, 212, 170, 0.9)' : 'rgba(255, 193, 7, 0.9)'};
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Cairo', sans-serif;
        z-index: 1005;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        opacity: 0;
        animation: slideInFade 0.3s ease-out forwards;
    `;
    
    // Add CSS animation
    if (!document.getElementById('indicatorStyles')) {
        const style = document.createElement('style');
        style.id = 'indicatorStyles';
        style.textContent = `
            @keyframes slideInFade {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to appropriate modal
    const desktopModal = document.getElementById('modalDesktop');
    const mobileModal = document.getElementById('modalMobile');
    
    if (desktopModal.style.display === 'flex') {
        desktopModal.appendChild(indicator);
    } else if (mobileModal.style.display === 'flex') {
        mobileModal.appendChild(indicator);
    }
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }
    }, 3000);
}

// Google Sheets Integration Functions

// Save mood selection to Google Sheets
async function saveMoodToSheets(mood) {
    if (GOOGLE_SHEETS_CONFIG.WRITE_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        saveMoodLocally(mood);
        return;
    }

    const data = {
        timestamp: new Date().toISOString(),
        mood: mood,
        moodArabic: MOOD_NAMES[mood],
        userAgent: navigator.userAgent,
        sessionId: getOrCreateSessionId()
    };

    try {
        // Try multiple methods to ensure data gets through
        
        // Method 1: URL-encoded form data
        const params = new URLSearchParams();
        params.append('timestamp', data.timestamp);
        params.append('mood', data.mood);
        params.append('moodArabic', data.moodArabic);
        params.append('userAgent', data.userAgent);
        params.append('sessionId', data.sessionId);

        const response = await fetch(GOOGLE_SHEETS_CONFIG.WRITE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
            mode: 'cors'
        });

        if (response.ok) {
            const result = await response.json();
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        // Fallback to local storage
        saveMoodLocally(mood);
        throw error;
    }
}

// Fallback: Save mood to local storage
function saveMoodLocally(mood) {
    const data = {
        timestamp: new Date().toISOString(),
        mood: mood,
        moodArabic: MOOD_NAMES[mood],
        sessionId: getOrCreateSessionId()
    };

    let savedMoods = JSON.parse(localStorage.getItem('saudiNationMoods') || '[]');
    savedMoods.push(data);
    localStorage.setItem('saudiNationMoods', JSON.stringify(savedMoods));
}

// Generate or retrieve session ID
function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('saudiNationSessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('saudiNationSessionId', sessionId);
    }
    return sessionId;
}

// Load results from Google Sheets
async function loadResults() {
    const loadingEl = document.getElementById('resultsLoading');
    const contentEl = document.getElementById('resultsContent');
    
    // Show loading state
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';

    try {
        let results;
        
        if (GOOGLE_SHEETS_CONFIG.READ_URL === 'YOUR_GOOGLE_SHEETS_API_READ_URL_HERE') {
            results = loadResultsFromLocal();
        } else {
            results = await loadResultsFromSheets();
        }

        displayResults(results);
    } catch (error) {
        // Fallback to local storage
        const results = loadResultsFromLocal();
        displayResults(results);
    } finally {
        // Hide loading and show content
        setTimeout(() => {
            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';
        }, 1000); // Minimum loading time for better UX
    }
}

// Load results from Google Sheets
async function loadResultsFromSheets() {
    const response = await fetch(GOOGLE_SHEETS_CONFIG.READ_URL);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return processSheetData(data);
}

// Process Google Sheets data
function processSheetData(data) {
    // Handle the response from our Apps Script
    const rows = data.values || [];
    const moodCounts = { happy: 0, proud: 0, grateful: 0, excited: 0 };
    
    
    // Skip header row and count moods
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row.length > 1) {
            const mood = row[1]; // Mood is in column B (index 1)
            
            if (moodCounts.hasOwnProperty(mood)) {
                moodCounts[mood]++;
            }
        }
    }
    
    return moodCounts;
}

// Load results from local storage (fallback)
function loadResultsFromLocal() {
    const savedMoods = JSON.parse(localStorage.getItem('saudiNationMoods') || '[]');
    const moodCounts = { happy: 0, proud: 0, grateful: 0, excited: 0 };
    
    savedMoods.forEach(entry => {
        if (moodCounts.hasOwnProperty(entry.mood)) {
            moodCounts[entry.mood]++;
        }
    });
    
    return moodCounts;
}

// Display results in the UI
function displayResults(moodCounts) {
    const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
    
    // Update total count
    document.getElementById('totalCount').textContent = total.toLocaleString('ar-SA');
    
    // Update each mood in legend
    Object.keys(moodCounts).forEach(mood => {
        const count = moodCounts[mood];
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        
        // Update count and percentage
        document.getElementById(`${mood}Count`).textContent = count.toLocaleString('ar-SA');
        document.getElementById(`${mood}Percentage`).textContent = `(${percentage}%)`;
    });
    
    // Create pie chart
    createPieChart(moodCounts, total);
    
    // Add animation class to trigger count up animation
    document.getElementById('totalCount').style.animation = 'none';
    setTimeout(() => {
        document.getElementById('totalCount').style.animation = 'countUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 100);
}

// Create animated pie chart
function createPieChart(moodCounts, total) {
    const svg = document.getElementById('pieChart');
    const centerX = 140;
    const centerY = 140;
    const radius = 100;
    
    // Clear existing chart
    svg.innerHTML = '';
    
    // Mood colors matching the legend
    const moodColors = {
        'happy': ['#ffd700', '#ffb347'],
        'proud': ['#ff6b6b', '#ff8e8e'],
        'grateful': ['#4ecdc4', '#7fdbda'],
        'excited': ['#9b59b6', '#c39bd3']
    };
    
    // Create gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    Object.keys(moodColors).forEach(mood => {
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', `gradient-${mood}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', moodColors[mood][0]);
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', moodColors[mood][1]);
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
    });
    svg.appendChild(defs);
    
    if (total === 0) {
        // Show empty state
        const emptyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        emptyCircle.setAttribute('cx', centerX);
        emptyCircle.setAttribute('cy', centerY);
        emptyCircle.setAttribute('r', radius);
        emptyCircle.setAttribute('fill', 'none');
        emptyCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
        emptyCircle.setAttribute('stroke-width', '2');
        emptyCircle.setAttribute('stroke-dasharray', '10,5');
        svg.appendChild(emptyCircle);
        return;
    }
    
    let currentAngle = -90; // Start from top
    
    Object.keys(moodCounts).forEach((mood, index) => {
        const count = moodCounts[mood];
        if (count === 0) return;
        
        const percentage = count / total;
        const angle = percentage * 360;
        
        // Create path for pie slice
        const startAngle = (currentAngle * Math.PI) / 180;
        const endAngle = ((currentAngle + angle) * Math.PI) / 180;
        
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', `url(#gradient-${mood})`);
        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('opacity', '0');
        path.style.cursor = 'pointer';
        
        // Add hover effects
        path.addEventListener('mouseenter', () => {
            path.setAttribute('transform', `scale(1.05) translate(${centerX * -0.05}, ${centerY * -0.05})`);
            path.setAttribute('opacity', '0.9');
            
            // Highlight corresponding legend item
            const legendItem = document.querySelector(`.legend-item[data-mood="${mood}"]`);
            if (legendItem) {
                legendItem.style.transform = 'translateY(-3px) scale(1.02)';
                legendItem.style.background = 'rgba(0, 0, 0, 0.4)';
            }
        });
        
        path.addEventListener('mouseleave', () => {
            path.setAttribute('transform', 'scale(1) translate(0, 0)');
            path.setAttribute('opacity', '0.8');
            
            // Remove highlight from legend item
            const legendItem = document.querySelector(`.legend-item[data-mood="${mood}"]`);
            if (legendItem) {
                legendItem.style.transform = '';
                legendItem.style.background = '';
            }
        });
        
        svg.appendChild(path);
        
        // Animate the slice
        setTimeout(() => {
            path.setAttribute('opacity', '0.8');
        }, index * 200 + 300);
        
        currentAngle += angle;
    });
}

// Check if user has already submitted and handle page initialization
function initializePage() {
    const hasSubmitted = localStorage.getItem('saudiNationSubmitted');
    const submissionDate = localStorage.getItem('saudiNationSubmissionDate');
    const today = new Date().toDateString();
    
    // Check if user submitted today
    if (hasSubmitted && submissionDate === today) {
        // User already submitted today - show results directly
        showResultsDirectly();
        disableFormSubmission();
    } else if (hasSubmitted && submissionDate !== today) {
        // User submitted on a different day - reset for new day
        localStorage.removeItem('saudiNationSubmitted');
        localStorage.removeItem('saudiNationSubmissionDate');
        localStorage.removeItem('saudiNationSelectedMood');
    }
}

// Show results directly without going through mood selection
function showResultsDirectly() {
    // Hide intro card and show results card immediately
    const introCard = document.getElementById('introCard');
    const resultsCard = document.getElementById('resultsCard');
    
    if (introCard) {
        introCard.classList.remove('initial-load', 'active');
        introCard.classList.add('inactive');
        
        // Update intro card to show submission status
        const navBtn = introCard.querySelector('.nav-btn span');
        if (navBtn) {
            navBtn.textContent = 'عرض النتائج';
        }
    }
    
    if (resultsCard) {
        resultsCard.classList.remove('inactive');
        resultsCard.classList.add('active');
        loadResults();
    }
}

// Disable form submission for users who already submitted
function disableFormSubmission() {
    const moodButtons = document.querySelectorAll('.btn');
    const moodCard = document.getElementById('moodCard');
    
    // Disable all mood buttons
    moodButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.style.pointerEvents = 'none';
    });
    
    // Add a message to the mood card
    if (moodCard) {
        const title = moodCard.querySelector('.title');
        if (title) {
            title.textContent = 'شكراً لمشاركتك! يمكنك المشاركة مرة واحدة فقط يومياً';
            title.style.fontSize = '1.8rem';
        }
    }
}

// Track submission when user selects a mood
function trackSubmission(mood) {
    const today = new Date().toDateString();
    localStorage.setItem('saudiNationSubmitted', 'true');
    localStorage.setItem('saudiNationSubmissionDate', today);
    localStorage.setItem('saudiNationSelectedMood', mood);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
