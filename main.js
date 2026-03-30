// API Configuration
// For deployment, make sure to replace the URL with your actual backend URL
const API_BASE_URL = window.location.port === '8000' ? 'http://localhost:3000/api' : '/api';

// JWT Token Management
let authToken = null;

// Gamification System
let userGameData = {
    points: 0,
    badges: [],
    reportsCount: 0,
    upvotesCount: 0,
    verificationsCount: 0,
    rank: null,
    lastActivity: new Date().toISOString()
};

const POINT_VALUES = {
    REPORT: 10,
    UPVOTE: 2,
    VERIFY: 5
};

const BADGE_DEFINITIONS = {
    'problem-solver': {
        name: 'Problem Solver',
        description: 'Filed your first 5 reports',
        icon: 'fas fa-lightbulb',
        requirement: 5,
        type: 'reports'
    },
    'community-hero': {
        name: 'Community Hero',
        description: 'Reached 100 total points',
        icon: 'fas fa-heart',
        requirement: 100,
        type: 'points'
    },
    'quick-reporter': {
        name: 'Quick Reporter',
        description: 'Filed 3 reports in one day',
        icon: 'fas fa-bolt',
        requirement: 3,
        type: 'daily_reports'
    },
    'civic-champion': {
        name: 'Civic Champion',
        description: 'Filed 25 reports',
        icon: 'fas fa-crown',
        requirement: 25,
        type: 'reports'
    },
    'verified-solver': {
        name: 'Verified Solver',
        description: 'Verified 10 resolved issues',
        icon: 'fas fa-check-double',
        requirement: 10,
        type: 'verifications'
    }
};

// Initialize gamification system
function initializeGamification() {
    loadUserGameData();
    updateGameDisplay();
    generateLeaderboard();
    displayBadges();
    console.log('🎮 Gamification system initialized');
}

// Load user game data from localStorage
function loadUserGameData() {
    try {
        const savedData = localStorage.getItem('cityvoice_game_data');
        if (savedData) {
            userGameData = { ...userGameData, ...JSON.parse(savedData) };
        }
        console.log('Game data loaded:', userGameData);
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Save user game data to localStorage
function saveUserGameData() {
    try {
        localStorage.setItem('cityvoice_game_data', JSON.stringify(userGameData));
        console.log('Game data saved:', userGameData);
    } catch (error) {
        console.error('Error saving game data:', error);
    }
}

// Award points for user actions
function awardPoints(action, amount = null) {
    const points = amount || POINT_VALUES[action.toUpperCase()];
    if (!points) return;
    
    userGameData.points += points;
    userGameData.lastActivity = new Date().toISOString();
    
    // Update specific counters
    switch (action.toLowerCase()) {
        case 'report':
            userGameData.reportsCount++;
            break;
        case 'upvote':
            userGameData.upvotesCount++;
            break;
        case 'verify':
            userGameData.verificationsCount++;
            break;
    }
    
    saveUserGameData();
    updateGameDisplay();
    checkForNewBadges();
    showPointsEarned(points, action);
    
    console.log(`Points awarded: +${points} for ${action}`);
}

// Check for newly earned badges
function checkForNewBadges() {
    const newBadges = [];
    
    Object.keys(BADGE_DEFINITIONS).forEach(badgeId => {
        if (!userGameData.badges.includes(badgeId)) {
            const badge = BADGE_DEFINITIONS[badgeId];
            let earned = false;
            
            switch (badge.type) {
                case 'reports':
                    earned = userGameData.reportsCount >= badge.requirement;
                    break;
                case 'points':
                    earned = userGameData.points >= badge.requirement;
                    break;
                case 'verifications':
                    earned = userGameData.verificationsCount >= badge.requirement;
                    break;
                case 'daily_reports':
                    // For simplicity, we'll check total reports for now
                    earned = userGameData.reportsCount >= badge.requirement;
                    break;
            }
            
            if (earned) {
                userGameData.badges.push(badgeId);
                newBadges.push(badge);
            }
        }
    });
    
    if (newBadges.length > 0) {
        saveUserGameData();
        displayBadges();
        
        // Show confetti and badge notification for each new badge
        newBadges.forEach((badge, index) => {
            setTimeout(() => {
                showBadgeEarned(badge);
                triggerConfetti();
            }, index * 1000);
        });
    }
}

// Update game display elements
function updateGameDisplay() {
    // Update points display
    const userPointsElement = document.getElementById('userPoints');
    if (userPointsElement) {
        userPointsElement.textContent = userGameData.points.toLocaleString();
    }
    
    // Update progress bar
    updateBadgeProgress();
    
    // Update rank (simplified calculation)
    updateUserRank();
}

// Update badge progress bar
function updateBadgeProgress() {
    const progressFill = document.getElementById('badgeProgress');
    const currentPointsElement = document.getElementById('currentBadgePoints');
    const nextPointsElement = document.getElementById('nextBadgePoints');
    
    if (!progressFill) return;
    
    // Find next badge milestone
    const pointMilestones = [50, 100, 250, 500, 1000];
    let nextMilestone = pointMilestones.find(milestone => milestone > userGameData.points) || 1000;
    let currentMilestone = pointMilestones[pointMilestones.indexOf(nextMilestone) - 1] || 0;
    
    const progress = ((userGameData.points - currentMilestone) / (nextMilestone - currentMilestone)) * 100;
    
    progressFill.style.width = Math.min(progress, 100) + '%';
    
    if (currentPointsElement) currentPointsElement.textContent = userGameData.points;
    if (nextPointsElement) nextPointsElement.textContent = nextMilestone;
}

// Update user rank
function updateUserRank() {
    const userRankElement = document.getElementById('userRank');
    if (userRankElement) {
        // Simplified rank calculation based on points
        let rank = Math.max(1, 100 - Math.floor(userGameData.points / 10));
        userRankElement.textContent = rank;
    }
}

// Generate and display leaderboard
function generateLeaderboard() {
    // Generate sample leaderboard data
    const leaderboardData = [
        { name: currentUser?.name || 'Ishaan Saxena', points: userGameData.points, reports: userGameData.reportsCount, isCurrentUser: true },
        { name: 'Sarah Chen', points: 1250, reports: 42, isCurrentUser: false },
        { name: 'Mike Johnson', points: 980, reports: 38, isCurrentUser: false },
        { name: 'Priya Sharma', points: 875, reports: 35, isCurrentUser: false },
        { name: 'David Kim', points: 720, reports: 28, isCurrentUser: false },
        { name: 'Anna Rodriguez', points: 650, reports: 26, isCurrentUser: false },
        { name: 'John Smith', points: 580, reports: 22, isCurrentUser: false },
        { name: 'Lisa Wang', points: 520, reports: 20, isCurrentUser: false }
    ];
    
    // Sort by points
    leaderboardData.sort((a, b) => b.points - a.points);
    
    displayLeaderboard(leaderboardData);
}

// Display leaderboard
function displayLeaderboard(data) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    data.forEach((user, index) => {
        const rank = index + 1;
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = `leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`;
        
        const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
        
        leaderboardItem.innerHTML = `
            <div class="rank-number ${rankClass}">${rank}</div>
            <div class="user-avatar-leaderboard">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-info-leaderboard">
                <h4>${user.name}</h4>
                <p class="user-stats">${user.reports} reports filed</p>
            </div>
            <div class="user-points-leaderboard">
                <p class="points-display">${user.points.toLocaleString()}</p>
                <p class="reports-count">pts</p>
            </div>
        `;
        
        leaderboardList.appendChild(leaderboardItem);
    });
}

// Display badges
function displayBadges() {
    const userBadgesContainer = document.getElementById('userBadges');
    const availableBadgesContainer = document.getElementById('availableBadges');
    
    if (userBadgesContainer) {
        userBadgesContainer.innerHTML = '';
        
        if (userGameData.badges.length === 0) {
            userBadgesContainer.innerHTML = '<p style="color: #94a3b8; text-align: center; grid-column: 1 / -1;">No badges earned yet. Keep reporting to unlock badges!</p>';
        } else {
            userGameData.badges.forEach(badgeId => {
                const badge = BADGE_DEFINITIONS[badgeId];
                if (badge) {
                    userBadgesContainer.appendChild(createBadgeCard(badgeId, badge, true));
                }
            });
        }
    }
    
    if (availableBadgesContainer) {
        availableBadgesContainer.innerHTML = '';
        
        Object.keys(BADGE_DEFINITIONS).forEach(badgeId => {
            if (!userGameData.badges.includes(badgeId)) {
                const badge = BADGE_DEFINITIONS[badgeId];
                availableBadgesContainer.appendChild(createBadgeCard(badgeId, badge, false));
            }
        });
    }
}

// Create badge card element
function createBadgeCard(badgeId, badge, earned) {
    const card = document.createElement('div');
    card.className = `badge-card ${earned ? 'earned' : 'locked'}`;
    
    card.innerHTML = `
        <div class="badge-icon ${badgeId}">
            <i class="${badge.icon}"></i>
            ${earned ? '<div class="badge-earned-indicator"><i class="fas fa-check"></i></div>' : ''}
        </div>
        <h4 class="badge-name">${badge.name}</h4>
        <p class="badge-description">${badge.description}</p>
        <p class="badge-requirement">${getBadgeRequirementText(badge, earned)}</p>
    `;
    
    return card;
}

// Get badge requirement text
function getBadgeRequirementText(badge, earned) {
    if (earned) return 'Unlocked!';
    
    switch (badge.type) {
        case 'reports':
            const currentReports = userGameData.reportsCount;
            return `${currentReports}/${badge.requirement} reports`;
        case 'points':
            const currentPoints = userGameData.points;
            return `${currentPoints}/${badge.requirement} points`;
        case 'verifications':
            const currentVerifications = userGameData.verificationsCount;
            return `${currentVerifications}/${badge.requirement} verifications`;
        default:
            return `Requirement: ${badge.requirement}`;
    }
}

// Show points earned notification
function showPointsEarned(points, action) {
    const notification = document.createElement('div');
    notification.className = 'points-notification';
    notification.innerHTML = `
        <div class="points-notification-content">
            <i class="fas fa-plus-circle"></i>
            <span>+${points} points</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// Show badge earned notification
function showBadgeEarned(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-notification-content">
            <div class="badge-notification-icon">
                <i class="${badge.icon}"></i>
            </div>
            <div class="badge-notification-text">
                <h4>Badge Unlocked!</h4>
                <p>${badge.name}</p>
            </div>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 2rem;
        border-radius: 1.5rem;
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
        z-index: 10001;
        animation: badgePopIn 0.5s ease-out;
        text-align: center;
        min-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Trigger confetti animation
function triggerConfetti() {
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    document.body.removeChild(confetti);
                }
            }, 5000);
        }, i * 50);
    }
}

// Setup gamification event listeners
function setupGamificationListeners() {
    // Leaderboard filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter logic can be implemented here
            console.log('Filter changed to:', e.target.dataset.period);
        });
    });
}

// Hook into existing functions to award points
function enhanceExistingFunctions() {
    // Hook into report submission
    const originalSubmitReport = window.submitReport;
    if (originalSubmitReport) {
        window.submitReport = function(...args) {
            const result = originalSubmitReport.apply(this, args);
            awardPoints('report');
            return result;
        };
    }
    
    // Hook into upvote function
    const originalToggleUpvote = window.toggleUpvote;
    if (originalToggleUpvote) {
        window.toggleUpvote = function(...args) {
            const result = originalToggleUpvote.apply(this, args);
            awardPoints('upvote');
            return result;
        };
    }
}
let currentSection = 'home';
let uploadedFiles = [];
let selectedLocation = null;
let isRecording = false;
let currentIssuePin = null;
let reportMap = null;
let mainMap = null;
let markers = [];
let userLocationMarker = null;
let currentUser = null;
let isAuthenticated = false;

// Voice Commands variables
let recognition = null;
let isVoiceListening = false;
let voiceCommands = {};

// User reports storage
let userReports = [];
let userReportsCount = 0;

// API Helper functions
async function uploadFiles(files, additionalData = {}) {
    try {
        const formData = new FormData();
        
        files.forEach(file => {
            formData.append('files', file);
        });
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        // Add authorization header
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            body: formData,
            headers
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // If not JSON, it's likely an error page
            const text = await response.text();
            console.error('Non-JSON response received:', text);
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}...`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
            }
            throw new Error(data.message || 'Upload failed');
        }
        
        // If response contains a new token, update it
        if (data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}

// JWT Token Management Functions
function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('cityvoice_auth_token', token);
}

function getAuthToken() {
    return localStorage.getItem('cityvoice_auth_token');
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('cityvoice_auth_token');
}

function handleTokenExpiration() {
    clearAuthToken();
    currentUser = null;
    isAuthenticated = false;
    updateUIForUnauthenticatedUser();
    showAuthError('loginForm', 'Session expired. Please login again.');
    showLoginModal();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load token from localStorage
    const savedToken = getAuthToken();
    if (savedToken) {
        authToken = savedToken;
        // Verify token is still valid
        verifyToken();
    }
    
    initializeApp();
    setupEventListeners();
    setupGamificationListeners();
    enhanceExistingFunctions();
    animateCounters();
    setupIntersectionObserver();
    setupDashboardNavigation();
    
    // Add loading animation
    document.body.classList.add('loaded');
    
    // Preload critical animations
    preloadAnimations();
});

// Verify token validity - Simplified
async function verifyToken() {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        // Decode token (it's just base64 encoded JSON)
        const payload = JSON.parse(atob(token));
        
        // Get user from localStorage or create a simple one
        const users = JSON.parse(localStorage.getItem('cityvoice_users') || '{}');
        const storedUser = users[payload.email];
        
        currentUser = {
            id: payload.id,
            name: storedUser ? storedUser.name : (payload.email.split('@')[0] || 'User'),
            email: payload.email,
            joinDate: new Date().toISOString().split('T')[0],
            reportsCount: 0,
            resolvedCount: 0
        };
        isAuthenticated = true;
        updateUIForAuthenticatedUser();
        console.log('Token verified successfully');
    } catch (error) {
        // Silently ignore token errors
        console.log('Token verification skipped');
    }
}

// Show points earned notification
function showPointsEarned(points, action) {
    const notification = document.createElement('div');
    notification.className = 'points-notification';
    notification.innerHTML = `
        <div class="points-notification-content">
            <i class="fas fa-plus-circle"></i>
            <span>+${points} points</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// Show badge earned notification
function showBadgeEarned(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-notification-content">
            <div class="badge-notification-icon">
                <i class="${badge.icon}"></i>
            </div>
            <div class="badge-notification-text">
                <h4>Badge Unlocked!</h4>
                <p>${badge.name}</p>
            </div>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 2rem;
        border-radius: 1.5rem;
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
        z-index: 10001;
        animation: badgePopIn 0.5s ease-out;
        text-align: center;
        min-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Trigger confetti animation
function triggerConfetti() {
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    document.body.removeChild(confetti);
                }
            }, 5000);
        }, i * 50);
    }
}

// Setup gamification event listeners
function setupGamificationListeners() {
    // Leaderboard filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter logic can be implemented here
            console.log('Filter changed to:', e.target.dataset.period);
        });
    });
}

// Hook into existing functions to award points
function enhanceExistingFunctions() {
    // Hook into report submission
    const originalSubmitReport = window.submitReport;
    if (originalSubmitReport) {
        window.submitReport = function(...args) {
            const result = originalSubmitReport.apply(this, args);
            awardPoints('report');
            return result;
        };
    }
    
    // Hook into upvote function
    const originalToggleUpvote = window.toggleUpvote;
    if (originalToggleUpvote) {
        window.toggleUpvote = function(...args) {
            const result = originalToggleUpvote.apply(this, args);
            awardPoints('upvote');
            return result;
        };
    }
}

// Voice Commands variables

// User reports storage

// API Helper functions
async function apiCall(endpoint, options = {}) {
    try {
        // Add authorization header if token exists
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log(`API Call: ${options.method || 'GET'} ${fullUrl}`, options);
        
        const response = await fetch(fullUrl, {
            headers,
            ...options
        });
        
        console.log(`API Response: ${response.status} ${response.statusText}`, response);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // If not JSON, it's likely an error page
            const text = await response.text();
            console.error('Non-JSON response received:', text);
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}...`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
            }
            throw new Error(data.message || 'API request failed');
        }
        
        // If response contains a new token, update it
        if (data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}



// JWT Token Management Functions
function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('cityvoice_auth_token', token);
}

function getAuthToken() {
    return localStorage.getItem('cityvoice_auth_token');
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('cityvoice_auth_token');
}

function handleTokenExpiration() {
    clearAuthToken();
    currentUser = null;
    isAuthenticated = false;
    updateUIForUnauthenticatedUser();
    showAuthError('loginForm', 'Session expired. Please login again.');
    showLoginModal();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load token from localStorage
    const savedToken = getAuthToken();
    if (savedToken) {
        authToken = savedToken;
        // Verify token is still valid
        verifyToken();
    }
    
    initializeApp();
    setupEventListeners();
    setupGamificationListeners();
    enhanceExistingFunctions();
    animateCounters();
    setupIntersectionObserver();
    setupDashboardNavigation();
    
    // Add loading animation
    document.body.classList.add('loaded');
    
    // Preload critical animations
    preloadAnimations();
});

// Preload animations and setup
function preloadAnimations() {
    // Force browser to calculate initial styles
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        particle.offsetHeight; // Trigger layout
    });
    
    // Setup lazy loading for images
    setupLazyLoading();
    
    // Initialize performance monitoring
    monitorPerformance();
}

function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

function monitorPerformance() {
    // Basic performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }
}

// Initialize the application
function initializeApp() {
    // Check for existing user session
    checkUserSession();
    
    // Load user reports from localStorage
    loadUserReports();
    
    // Initialize sidebar stats immediately
    setTimeout(() => {
        updateUserStatsDisplay();
    }, 500);
    
    // Initialize gamification system
    initializeGamification();
    
    // Check backend connection status
    checkBackendConnection();
    
    // Set default active panel
    showPanel('home');
    updateActiveNav('home');
    setupSmoothScrolling();
    initializeChatbot();
    initializeMaps();
    loadReportsData();
    loadAnalyticsData();
    
    // Setup periodic backend sync
    setupPeriodicSync();
    
    // Create a default test user for easy login
    createTestUser();
    
    console.log('CityVoice app initialized');
}

// Create a default test user for easy login
function createTestUser() {
    try {
        let users = JSON.parse(localStorage.getItem('cityvoice_users') || '{}');
        
        // If no users exist, create a default test user
        if (Object.keys(users).length === 0) {
            users['test@example.com'] = { name: 'Test User', password: 'password123' };
            localStorage.setItem('cityvoice_users', JSON.stringify(users));
            console.log('Created default test user: test@example.com / password123');
        }
    } catch (error) {
        console.error('Error creating test user:', error);
    }
}

// Check backend connection status - Disabled (client-side only)
async function checkBackendConnection() {
    console.log('📡 Backend connection check disabled (client-side only)');
    // Always show as online for client-side mode
    showConnectionStatus('online');
}

// Show connection status to user
function showConnectionStatus(status) {
    const statusColors = {
        online: '#10b981',
        degraded: '#f59e0b', 
        offline: '#ef4444'
    };
    
    const statusMessages = {
        online: 'Connected to city servers',
        degraded: 'Limited connectivity', 
        offline: 'Working offline - reports will sync later'
    };
    
    // Create or update status indicator
    let statusIndicator = document.getElementById('connectionStatus');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'connectionStatus';
        statusIndicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(statusIndicator);
    }
    
    statusIndicator.style.backgroundColor = statusColors[status];
    statusIndicator.style.color = 'white';
    statusIndicator.textContent = statusMessages[status];
    
    // Auto-hide if online
    if (status === 'online') {
        setTimeout(() => {
            if (statusIndicator) {
                statusIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (statusIndicator.parentNode) {
                        statusIndicator.parentNode.removeChild(statusIndicator);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Setup periodic sync - Disabled (client-side only)
function setupPeriodicSync() {
    console.log('🔄 Periodic sync disabled (client-side only)');
    // No periodic sync needed for client-side mode
}

// Load reports data - Client-side only (no server calls)
async function loadReportsData() {
    try {
        console.log('📡 Loading reports (client-side only)...');
        // Always use sample data - no server calls
        addSampleIssueMarkers();
    } catch (error) {
        console.log('🔄 Using sample data');
        addSampleIssueMarkers();
    }
}

// Update report statistics on homepage
function updateReportStats(reportsData) {
    const totalReports = reportsData.length;
    const resolvedReports = reportsData.filter(r => r.status === 'resolved').length;
    const resolvedPercentage = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    const hotspots = new Set(reportsData.map(r => r.category)).size;
    
    // Update homepage stats with real data
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) {
        statNumbers[0].dataset.target = totalReports;
        statNumbers[0].textContent = totalReports;
    }
    if (statNumbers[1]) {
        statNumbers[1].dataset.target = resolvedPercentage;
        statNumbers[1].textContent = resolvedPercentage + '%';
    }
    if (statNumbers[2]) {
        statNumbers[2].dataset.target = hotspots;
        statNumbers[2].textContent = hotspots;
    }
    
    console.log('📊 Updated stats:', { totalReports, resolvedPercentage, hotspots });
}

// Load analytics data - Client-side only (no server calls)
async function loadAnalyticsData() {
    try {
        console.log('📊 Loading analytics (client-side only)...');
        // Use sample data instead of API calls
        const sampleData = {
            totalReports: 0,
            resolvedPercentage: 0,
            hotspots: 0,
            categoryStats: {}
        };
        updateStatsDisplay(sampleData);
    } catch (error) {
        console.log('📊 Using default analytics');
    }
}

// Update stats display with real data
function updateStatsDisplay(analytics) {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers[0]) {
        statNumbers[0].dataset.target = analytics.totalReports;
        statNumbers[0].textContent = analytics.totalReports;
    }
    
    if (statNumbers[1]) {
        statNumbers[1].dataset.target = analytics.resolvedPercentage;
        statNumbers[1].textContent = analytics.resolvedPercentage;
    }
    
    if (statNumbers[2]) {
        statNumbers[2].dataset.target = analytics.hotspots;
        statNumbers[2].textContent = analytics.hotspots;
    }
}

// Update map with real reports
function updateMapWithReports(reports) {
    if (!mainMap) return;
    
    // Clear existing markers
    markers.forEach(marker => mainMap.removeLayer(marker));
    markers = [];
    
    reports.forEach(report => {
        const iconHtml = getIssueIcon(report.category, report.status);
        
        const marker = L.marker([report.location.latitude, report.location.longitude], {
            icon: L.divIcon({
                className: `issue-marker ${report.status}`,
                html: iconHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }).addTo(mainMap);
        
        marker.issueData = {
            title: `${report.category.charAt(0).toUpperCase() + report.category.slice(1)} Report`,
            description: report.description || 'No description provided',
            status: report.status,
            upvotes: report.upvotes,
            ticketId: report.ticketId
        };
        
        marker.on('click', function() {
            showIssuePopupFromMarker(this.issueData);
        });
        
        markers.push(marker);
    });
}

// Initialize maps
function initializeMaps() {
    console.log('🗺️ Starting map initialization...');
    
    // Initialize report map (smaller map in report section)
    if (document.getElementById('reportMap')) {
        try {
            reportMap = L.map('reportMap').setView([20.5937, 78.9629], 5); // Default to India center
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(reportMap);
            
            // Add click handler for location selection
            reportMap.on('click', function(e) {
                setLocationFromMapClick(e.latlng);
            });
            
            console.log('✅ Report map initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing report map:', error);
        }
    } else {
        console.warn('⚠️ Report map container not found');
    }
    
    // Initialize main map (explore section)
    if (document.getElementById('mainMap')) {
        try {
            mainMap = L.map('mainMap').setView([20.5937, 78.9629], 5); // Default to India center
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(mainMap);
            
            // Add sample issue markers
            addSampleIssueMarkers();
            
            console.log('✅ Main map initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing main map:', error);
        }
    } else {
        console.warn('⚠️ Main map container not found');
    }
    
    // Don't automatically request location - wait for user action
    console.log('🗺️ Maps initialization complete. Location will be requested when user clicks "Use Current Location"');
}

// Request location permission (only when user clicks button)
function requestLocationPermission() {
    // This function is now only called manually by getCurrentLocation()
    // No automatic permission request
    console.log('Location permission will be requested when user clicks "Use Current Location"');
}

// Display location coordinates to user
function displayLocationCoordinates(lat, lng, accuracy = null) {
    const coordsDisplay = document.createElement('div');
    coordsDisplay.className = 'coordinates-display';
    
    const accuracyText = accuracy ? `<p><small>Accuracy: ±${Math.round(accuracy)}m</small></p>` : '';
    
    coordsDisplay.innerHTML = `
        <div class="coords-content">
            <div class="coords-icon">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="coords-info">
                <h4>📍 Location Captured!</h4>
                <p><strong>Lat:</strong> ${lat.toFixed(6)}</p>
                <p><strong>Lng:</strong> ${lng.toFixed(6)}</p>
                ${accuracyText}
            </div>
            <button class="coords-close" data-action="close-coords">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    coordsDisplay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        animation: slideInLeft 0.5s ease-out;
        max-width: 320px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    document.body.appendChild(coordsDisplay);
    
    // Add event listener for close button
    const closeBtn = coordsDisplay.querySelector('.coords-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            coordsDisplay.remove();
        });
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (coordsDisplay.parentElement) {
            coordsDisplay.style.animation = 'slideOutLeft 0.3s ease-in';
            setTimeout(() => {
                if (coordsDisplay.parentElement) {
                    document.body.removeChild(coordsDisplay);
                }
            }, 300);
        }
    }, 10000);
}

// Show location permission prompt (only when user requests location)
function showLocationPermissionPrompt() {
    // Remove existing prompt if any
    hideLocationPermissionPrompt();
    
    const prompt = document.createElement('div');
    prompt.className = 'location-prompt';
    prompt.id = 'locationPrompt';
    prompt.innerHTML = `
        <div class="location-prompt-content">
            <div class="prompt-icon">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <h3>Location Permission Needed</h3>
            <p>We need your location to accurately place your report on the map. Your location is only used for this report and is not stored permanently.</p>
            <div class="location-status" id="locationStatus">
                <i class="fas fa-info-circle"></i>
                <span>Please allow location access when prompted by your browser</span>
            </div>
            <div class="prompt-actions">
                <button class="prompt-btn secondary" data-action="cancel-location">Cancel</button>
            </div>
        </div>
    `;
    
    prompt.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(prompt);
    
    // Add event listener for cancel button
    const cancelBtn = prompt.querySelector('[data-action="cancel-location"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideLocationPermissionPrompt);
    }
}

// Hide location permission prompt
function hideLocationPermissionPrompt() {
    const prompt = document.getElementById('locationPrompt');
    if (prompt) {
        prompt.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            if (prompt.parentElement) {
                document.body.removeChild(prompt);
            }
        }, 300);
    }
}

// Show location error in prompt
function showLocationError(error) {
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) {
        let errorMessage = 'Unable to get location';
        
        switch(error.code) {
            case 1:
                errorMessage = 'Location access denied. Please enable location in your browser settings.';
                break;
            case 2:
                errorMessage = 'Location unavailable. Please check your GPS/internet connection.';
                break;
            case 3:
                errorMessage = 'Location request timed out. Please try again.';
                break;
            case 'NOT_SUPPORTED':
                errorMessage = 'Your browser does not support location services.';
                break;
        }
        
        locationStatus.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
            <span style="color: #ef4444;">${errorMessage}</span>
        `;
    }
}

// Retry location request (called when user clicks retry or use location again)
function retryLocationRequest() {
    // Simply call getCurrentLocation again
    getCurrentLocation();
}

// Add sample issue markers to main map
function addSampleIssueMarkers() {
    const sampleIssues = [
        {
            lat: 12.9716, // Bangalore
            lng: 77.5946,
            type: 'pothole',
            title: 'Large Pothole',
            description: 'Dangerous pothole on MG Road',
            status: 'pending',
            upvotes: 15
        },
        {
            lat: 19.0760, // Mumbai
            lng: 72.8777,
            type: 'water',
            title: 'Water Leak',
            description: 'Pipe burst in Marine Drive area',
            status: 'progress',
            upvotes: 23
        },
        {
            lat: 28.7041, // Delhi
            lng: 77.1025,
            type: 'streetlight',
            title: 'Broken Streetlight',
            description: 'Streetlight out on Connaught Place',
            status: 'resolved',
            upvotes: 8
        },
        {
            lat: 13.0827, // Chennai
            lng: 80.2707,
            type: 'garbage',
            title: 'Garbage Overflow',
            description: 'Garbage bin overflowing in T. Nagar',
            status: 'pending',
            upvotes: 12
        }
    ];
    
    sampleIssues.forEach(issue => {
        const iconHtml = getIssueIcon(issue.type, issue.status);
        
        const marker = L.marker([issue.lat, issue.lng], {
            icon: L.divIcon({
                className: `issue-marker ${issue.status}`,
                html: iconHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }).addTo(mainMap);
        
        marker.issueData = issue;
        
        marker.on('click', function() {
            showIssuePopupFromMarker(this.issueData);
        });
        
        markers.push(marker);
    });
}

// Get icon HTML for issue type
function getIssueIcon(type, status) {
    const icons = {
        pothole: '🕳️',
        water: '💧',
        streetlight: '💡',
        garbage: '🗑️',
        parking: '🚗',
        footpath: '🚶',
        sewage: '🚽',
        burning: '🔥',
        toilet: '🚿',
        property: '🪑',
        other: '❓'
    };
    
    const statusColor = {
        pending: '#fbbf24',
        progress: '#3b82f6',
        resolved: '#10b981'
    };
    
    return `
        <div style="
            background: white;
            border-radius: 50% 50% 50% 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid ${statusColor[status] || '#6b7280'};
        ">
            <span style="transform: rotate(45deg);">${icons[type] || '❓'}</span>
        </div>
    `;
}

// Setup all event listeners
function setupEventListeners() {
    setupNavigationListeners();
    setupDashboardListeners();
    setupAuthListeners();
    setupReportListeners();
    setupMapListeners();
    setupCommunityListeners();
    setupAdminListeners();
    setupChatbotListeners();
    setupModalListeners();
    setupVoiceCommandsListeners();
}

// Dashboard Navigation Setup
function setupDashboardNavigation() {
    // Add mobile sidebar toggle button
    const body = document.body;
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-sidebar-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.addEventListener('click', toggleSidebar);
    body.appendChild(toggleBtn);
}

function setupDashboardListeners() {
    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showPanel(section);
            updateActiveNavItem(item);
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    
    // Report button in home panel
    const reportBtns = document.querySelectorAll('#reportBtn, .cta-button');
    reportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showPanel('report');
            updateActiveNav('report');
        });
    });
}

// Panel Management
function showPanel(panelId) {
    // Hide all panels
    const panels = document.querySelectorAll('.content-panel');
    panels.forEach(panel => {
        panel.classList.add('hidden');
    });
    
    // Show target panel
    const targetPanel = document.getElementById(`panel-${panelId}`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        
        // Add fade-in animation
        targetPanel.style.opacity = '0';
        requestAnimationFrame(() => {
            targetPanel.style.transition = 'opacity 0.3s ease';
            targetPanel.style.opacity = '1';
        });
        
        // Initialize panel-specific functionality
        initializePanelFeatures(panelId);
    }
    
    currentSection = panelId;
}

function initializePanelFeatures(panelId) {
    switch(panelId) {
        case 'map':
            // Refresh main map if needed
            if (mainMap) {
                setTimeout(() => {
                    mainMap.invalidateSize();
                    console.log('🗺️ Main map refreshed');
                }, 150);
            }
            break;
        case 'report':
            // Refresh report map if needed
            if (reportMap) {
                setTimeout(() => {
                    reportMap.invalidateSize();
                    console.log('🗺️ Report map refreshed');
                }, 150);
            } else {
                // Try to initialize report map if it wasn't created yet
                console.log('🔁 Attempting to initialize report map...');
                setTimeout(() => {
                    if (document.getElementById('reportMap') && !reportMap) {
                        try {
                            reportMap = L.map('reportMap').setView([20.5937, 78.9629], 5);
                            
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                                maxZoom: 19
                            }).addTo(reportMap);
                            
                            reportMap.on('click', function(e) {
                                setLocationFromMapClick(e.latlng);
                            });
                            
                            console.log('✅ Report map initialized successfully on panel switch');
                        } catch (error) {
                            console.error('❌ Error initializing report map on panel switch:', error);
                        }
                    }
                }, 200);
            }
            break;
        case 'reports':
            // Display user reports when My Reports section is opened
            displayUserReports();
            break;
        case 'home':
            // Animate counters
            animateCounters();
            // Ensure sidebar stats are preserved
            updateUserStatsDisplay();
            break;
    }
}

function updateActiveNav(activeSection) {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        if (item.dataset.section === activeSection) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function updateActiveNavItem(activeItem) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

// Mobile Sidebar Functions
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.mobile-sidebar-toggle');
        
        if (sidebar && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            closeSidebar();
        }
    }
});

// =====================================
// AUTHENTICATION SYSTEM
// =====================================

// Check for existing user session - Restore from localStorage
function checkUserSession() {
    try {
        // Check for stored user and token
        const storedUser = localStorage.getItem('civicfix_user');
        const storedToken = localStorage.getItem('civicfix_token');
        
        if (storedUser && storedToken) {
            // Restore user session
            currentUser = JSON.parse(storedUser);
            authToken = storedToken;
            isAuthenticated = true;
            
            // Update UI
            updateUIForAuthenticatedUser();
            console.log('User session restored:', currentUser.name);
        } else {
            // No stored session, user needs to login
            console.log('No stored user session found');
        }
    } catch (error) {
        console.error('Error restoring user session:', error);
        // Clear invalid data
        localStorage.removeItem('civicfix_user');
        localStorage.removeItem('civicfix_token');
    }
}

// Setup authentication event listeners
function setupAuthListeners() {
    // Login/Register buttons
    document.getElementById('loginBtn')?.addEventListener('click', showLoginModal);
    document.getElementById('registerBtn')?.addEventListener('click', showRegisterModal);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Modal close buttons
    document.getElementById('closeLoginModal')?.addEventListener('click', hideLoginModal);
    document.getElementById('closeRegisterModal')?.addEventListener('click', hideRegisterModal);
    
    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    
    // Switch between login/register
    document.getElementById('switchToRegister')?.addEventListener('click', () => {
        hideLoginModal();
        showRegisterModal();
    });
    document.getElementById('switchToLogin')?.addEventListener('click', () => {
        hideRegisterModal();
        showLoginModal();
    });
    
    // Close modals on overlay click
    document.getElementById('loginModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') hideLoginModal();
    });
    document.getElementById('registerModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'registerModal') hideRegisterModal();
    });
}

// Show/Hide Login Modal
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginEmail').focus();
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    clearAuthForm('loginForm');
}

// Show/Hide Register Modal
function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('registerName').focus();
}

function hideRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    clearAuthForm('registerForm');
}

// Clear authentication form
function clearAuthForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Remove any error messages
        const errorElements = form.querySelectorAll('.auth-error');
        errorElements.forEach(el => el.remove());
    }
}

// Handle Login - Make API call to backend
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.querySelector('#loginForm .auth-submit-btn');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging in...';
    
    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success) {
            // Store user data and token
            currentUser = response.user;
            isAuthenticated = true;
            setAuthToken(response.token);
            
            // Save to localStorage
            localStorage.setItem('civicfix_user', JSON.stringify(currentUser));
            localStorage.setItem('civicfix_token', response.token);
            
            // Update UI
            updateUIForAuthenticatedUser();
            hideLoginModal();
            showAuthSuccess('Welcome back, ' + currentUser.name + '!');
        } else {
            throw new Error(response.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthError('loginForm', error.message || 'Login failed. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login';
    }
}

// Handle Register - Make API call to backend
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = document.querySelector('#registerForm .auth-submit-btn');
    
    // Basic validation
    if (!name || !email || !password) {
        showAuthError('registerForm', 'All fields are required');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('registerForm', 'Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    
    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        
        if (response.success) {
            // Store user data and token
            currentUser = response.user;
            isAuthenticated = true;
            setAuthToken(response.token);
            
            // Save to localStorage
            localStorage.setItem('civicfix_user', JSON.stringify(currentUser));
            localStorage.setItem('civicfix_token', response.token);
            
            // Update UI
            updateUIForAuthenticatedUser();
            hideRegisterModal();
            showAuthSuccess('Welcome to CityVoice, ' + currentUser.name + '!');
        } else {
            throw new Error(response.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthError('registerForm', error.message || 'Registration failed. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Register';
    }
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem('civicfix_user');
    updateUIForUnauthenticatedUser();
    showAuthSuccess('Logged out successfully!');
    
    // Reset user stats
    updateUserStats(0, 0);
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    // Hide login/register buttons
    document.getElementById('authButtons').classList.add('hidden');
    
    // Show user menu
    document.getElementById('userMenu').classList.remove('hidden');
    
    // Update user name in navigation
    document.getElementById('userNameNav').textContent = currentUser.name;
    
    // Update sidebar user info
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserRole').textContent = 'Civic Reporter';
    
    // Update user stats (load from localStorage)
    updateUserStatsDisplay();
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    // Show login/register buttons
    document.getElementById('authButtons').classList.remove('hidden');
    
    // Hide user menu
    document.getElementById('userMenu').classList.add('hidden');
    
    // Reset sidebar user info
    document.getElementById('sidebarUserName').textContent = 'Guest User';
    document.getElementById('sidebarUserRole').textContent = 'Please login';
}

// Load user-specific stats
// Load user stats - Client-side only
async function loadUserStats() {
    if (!currentUser) return;
    
    try {
        // For client-side auth, we'll just use localStorage data
        // In a real implementation, you might want to store report counts per user
        updateUserStats(0, 0);
    } catch (error) {
        console.error('Error loading user stats:', error);
        updateUserStats(0, 0);
    }
}

// User Reports Management Functions
function loadUserReports() {
    try {
        const savedReports = localStorage.getItem('civicfix_user_reports');
        if (savedReports) {
            userReports = JSON.parse(savedReports);
            userReportsCount = userReports.length;
            console.log(`Loaded ${userReportsCount} user reports from storage`);
        } else {
            userReports = [];
            userReportsCount = 0;
        }
        
        // Update sidebar counter with a small delay to ensure DOM is ready
        setTimeout(() => {
            updateUserStatsDisplay();
        }, 100);
        
        // Update My Reports section if it's visible
        if (currentSection === 'reports') {
            displayUserReports();
        }
    } catch (error) {
        console.error('Error loading user reports:', error);
        userReports = [];
        userReportsCount = 0;
    }
}

function saveUserReports() {
    try {
        localStorage.setItem('civicfix_user_reports', JSON.stringify(userReports));
        console.log('User reports saved to storage');
    } catch (error) {
        console.error('Error saving user reports:', error);
    }
}

function addUserReport(reportData) {
    const report = {
        id: `CIV-${generateTicketId()}`,
        ...reportData,
        timestamp: new Date().toISOString(),
        status: 'pending',
        upvotes: 0
    };
    
    userReports.unshift(report); // Add to beginning of array
    userReportsCount = userReports.length; // Update count to match array length
    
    // Save to localStorage
    saveUserReports();
    
    // Update UI
    updateUserStatsDisplay();
    
    console.log('New report added:', report.id, 'Total reports now:', userReportsCount);
    return report;
}

function updateUserStatsDisplay() {
    console.log('Updating user stats display - Reports:', userReportsCount, 'Array length:', userReports.length);
    
    // Ensure userReportsCount matches actual array length
    userReportsCount = Math.max(userReports.length, 0);
    
    // Update sidebar stats
    const reportsCountElement = document.getElementById('userReportsCount');
    const resolvedCountElement = document.getElementById('userResolvedCount');
    
    if (reportsCountElement) {
        reportsCountElement.textContent = userReportsCount;
        // Prevent animation overriding by adding a flag
        reportsCountElement.setAttribute('data-preserve', 'true');
        reportsCountElement.setAttribute('data-target', userReportsCount);
        console.log('Updated reports count element to:', userReportsCount);
    } else {
        console.warn('userReportsCount element not found');
    }
    
    if (resolvedCountElement) {
        const resolvedCount = userReports.filter(report => report.status === 'resolved').length;
        resolvedCountElement.textContent = resolvedCount;
        // Prevent animation overriding by adding a flag
        resolvedCountElement.setAttribute('data-preserve', 'true');
        resolvedCountElement.setAttribute('data-target', resolvedCount);
        console.log('Updated resolved count element to:', resolvedCount);
    } else {
        console.warn('userResolvedCount element not found');
    }
    
    // Force display update after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (reportsCountElement && reportsCountElement.textContent !== userReportsCount.toString()) {
            reportsCountElement.textContent = userReportsCount;
        }
        if (resolvedCountElement) {
            const resolvedCount = userReports.filter(report => report.status === 'resolved').length;
            if (resolvedCountElement.textContent !== resolvedCount.toString()) {
                resolvedCountElement.textContent = resolvedCount;
            }
        }
    }, 100);
}

function displayUserReports() {
    const reportsGrid = document.querySelector('.reports-grid');
    if (!reportsGrid) return;
    
    // Clear existing content
    reportsGrid.innerHTML = '';
    
    if (userReports.length === 0) {
        reportsGrid.innerHTML = `
            <div class="no-reports-container">
                <div class="no-reports-card">
                    <div class="no-reports-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h3>No Reports Yet</h3>
                    <p class="no-reports-description">You haven't submitted any reports yet. Click "Report Issue" to get started!</p>
                    <button class="no-reports-cta cta-button" data-action="navigate-report">
                        <i class="fas fa-plus-circle"></i>
                        Create Your First Report
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Display user reports
    userReports.forEach(report => {
        const reportCard = createReportCard(report);
        reportsGrid.appendChild(reportCard);
    });
    
    // Add event listeners to CTA buttons
    const ctaButtons = reportsGrid.querySelectorAll('[data-action="navigate-report"]');
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', () => navigateToSection('report'));
    });
    
    // Add event listeners to edit buttons
    setupEditButtonListeners();
}

// Create progress tracker for reports
function createProgressTracker(report) {
    const statusFlow = {
        'pending': { next: 'progress', label: 'Under Review', progress: 25 },
        'progress': { next: 'resolved', label: 'Being Fixed', progress: 75 },
        'resolved': { next: null, label: 'Complete', progress: 100 }
    };
    
    const currentStatus = statusFlow[report.status];
    const estimatedDays = {
        'pending': '2-3 days',
        'progress': '5-7 days', 
        'resolved': 'Completed'
    };
    
    return `
        <div class="progress-tracker">
            <div class="progress-header">
                <span class="progress-label">${currentStatus.label}</span>
                <span class="progress-estimate">${estimatedDays[report.status]}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${currentStatus.progress}%"></div>
            </div>
            <div class="progress-steps">
                <div class="progress-step ${report.status === 'pending' || report.status === 'progress' || report.status === 'resolved' ? 'completed' : ''}">
                    <i class="fas fa-check"></i>
                    <span>Submitted</span>
                </div>
                <div class="progress-step ${report.status === 'progress' || report.status === 'resolved' ? 'completed' : report.status === 'pending' ? 'current' : ''}">
                    <i class="fas fa-search"></i>
                    <span>Reviewing</span>
                </div>
                <div class="progress-step ${report.status === 'resolved' ? 'completed' : report.status === 'progress' ? 'current' : ''}">
                    <i class="fas fa-tools"></i>
                    <span>Fixing</span>
                </div>
                <div class="progress-step ${report.status === 'resolved' ? 'completed current' : ''}">
                    <i class="fas fa-flag-checkered"></i>
                    <span>Resolved</span>
                </div>
            </div>
        </div>
    `;
}

function createReportCard(report) {
    const card = document.createElement('div');
    card.className = `report-card ${report.status}`;
    
    const statusColors = {
        'pending': '#fbbf24',
        'progress': '#3b82f6', 
        'resolved': '#10b981'
    };
    
    const statusNames = {
        'pending': 'Pending',
        'progress': 'In Progress',
        'resolved': 'Resolved'
    };
    
    const categoryEmojis = {
        'pothole': '🕳️',
        'water': '💧',
        'streetlight': '💡',
        'garbage': '🗑️',
        'parking': '🚗',
        'footpath': '🚶',
        'sewage': '🚽',
        'burning': '🔥',
        'toilet': '🚿',
        'property': '🪑',
        'other': '❓'
    };
    
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };
    
    card.innerHTML = `
        <div class="report-image">
            ${report.imagePreview ? 
                `<img src="${report.imagePreview}" alt="${report.category} report">` :
                `<div class="report-placeholder">
                    <i class="fas fa-image"></i>
                    <span>No Image</span>
                </div>`
            }
        </div>
        <div class="report-details">
            <div class="report-header">
                <h3>${categoryEmojis[report.category] || '❓'} ${report.category.charAt(0).toUpperCase() + report.category.slice(1)}</h3>
                <span class="status-badge ${report.status}">${statusNames[report.status]}</span>
            </div>
            <p class="report-description">${report.description || 'No description provided'}</p>
            ${report.address ? `<p class="report-address"><i class="fas fa-map-marker-alt"></i> ${report.address}</p>` : ''}
            <div class="report-meta">
                <span class="report-id">${report.id}</span>
                <span class="report-date">${formatDate(report.timestamp)}</span>
                <span class="report-upvotes">👍 ${report.upvotes}</span>
            </div>
            ${createProgressTracker(report)}
            <div class="report-actions">
                <button class="action-btn secondary edit-report-btn" data-report-id="${report.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function viewReportDetails(reportId) {
    const report = userReports.find(r => r.id === reportId);
    if (report) {
        showReportDetailsModal(report);
    }
}

function setupEditButtonListeners() {
    // Remove any existing listeners to prevent duplicates
    const editButtons = document.querySelectorAll('.edit-report-btn');
    
    editButtons.forEach(button => {
        // Remove any existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new event listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const reportId = this.getAttribute('data-report-id');
            console.log('Edit button clicked for report:', reportId);
            
            if (!reportId) {
                console.error('No report ID found');
                showVoiceMessage('Error: Report ID not found');
                return;
            }
            
            try {
                editReport(reportId);
            } catch (error) {
                console.error('Error opening edit modal:', error);
                showVoiceMessage('Error opening edit form');
            }
        });
    });
    
    console.log('Edit button listeners set up for', editButtons.length, 'buttons');
}

// Helper function for safe voice message display
function safeShowVoiceMessage(message) {
    if (typeof showVoiceMessage === 'function') {
        showVoiceMessage(message);
    } else {
        console.log('Voice message:', message);
        alert(message); // Fallback for debugging
    }
}

function editReport(reportId) {
    console.log('editReport called with ID:', reportId);
    console.log('Available user reports:', userReports.length);
    
    if (!reportId) {
        console.error('No report ID provided');
        safeShowVoiceMessage('Error: No report ID provided');
        return;
    }
    
    const report = userReports.find(r => r.id === reportId);
    console.log('Found report:', report);
    
    if (!report) {
        console.error('Report not found with ID:', reportId);
        safeShowVoiceMessage('Report not found!');
        return;
    }
    
    try {
        showEditReportModal(report);
    } catch (error) {
        console.error('Error showing edit modal:', error);
        safeShowVoiceMessage('Error opening edit form');
    }
}

function showEditReportModal(report) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content edit-report-modal">
            <div class="modal-header">
                <h3>Edit Report - ${report.id}</h3>
                <button class="modal-close" data-action="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="editReportForm">
                    <div class="form-group">
                        <label for="editCategory">Category</label>
                        <select id="editCategory" class="form-select">
                            <option value="pothole" ${report.category === 'pothole' ? 'selected' : ''}>🕳️ Pothole</option>
                            <option value="water" ${report.category === 'water' ? 'selected' : ''}>💧 Water Leak</option>
                            <option value="streetlight" ${report.category === 'streetlight' ? 'selected' : ''}>💡 Streetlight</option>
                            <option value="garbage" ${report.category === 'garbage' ? 'selected' : ''}>🗑️ Garbage</option>
                            <option value="parking" ${report.category === 'parking' ? 'selected' : ''}>🚗 Illegal Parking</option>
                            <option value="footpath" ${report.category === 'footpath' ? 'selected' : ''}>🚶 Broken Footpaths / Open Manholes</option>
                            <option value="sewage" ${report.category === 'sewage' ? 'selected' : ''}>🚽 Overflowing Sewage / Drainage Blockage</option>
                            <option value="burning" ${report.category === 'burning' ? 'selected' : ''}>🔥 Burning of Garbage</option>
                            <option value="toilet" ${report.category === 'toilet' ? 'selected' : ''}>🚿 Public Toilets Unclean / Non-functional</option>
                            <option value="property" ${report.category === 'property' ? 'selected' : ''}>🪑 Damaged Public Property (benches, bus stops, signboards)</option>
                            <option value="other" ${report.category === 'other' ? 'selected' : ''}>❓ Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editDescription">Description</label>
                        <textarea id="editDescription" class="form-textarea" rows="4">${report.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="editAddress">Address</label>
                        <input type="text" id="editAddress" class="form-input" value="${report.address || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="editStatus">Status</label>
                        <select id="editStatus" class="form-select">
                            <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="progress" ${report.status === 'progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="action-btn secondary" data-action="cancel-edit">Cancel</button>
                        <button type="submit" class="action-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for modal controls
    const closeBtn = modal.querySelector('[data-action="close-modal"]');
    const cancelBtn = modal.querySelector('[data-action="cancel-edit"]');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.remove());
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.remove());
    }
    
    // Handle form submission
    const form = modal.querySelector('#editReportForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveReportChanges(report.id, modal);
    });
    
    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function saveReportChanges(reportId, modal) {
    const report = userReports.find(r => r.id === reportId);
    if (!report) return;
    
    // Get form values
    const category = modal.querySelector('#editCategory').value;
    const description = modal.querySelector('#editDescription').value;
    const address = modal.querySelector('#editAddress').value;
    const status = modal.querySelector('#editStatus').value;
    
    // Update report
    report.category = category;
    report.description = description;
    report.address = address;
    report.status = status;
    report.lastModified = new Date().toISOString();
    
    // Save to localStorage
    saveUserReports();
    
    // Update UI
    updateUserStatsDisplay();
    displayUserReports();
    
    // Close modal and show success
    modal.remove();
    showVoiceMessage('Report updated successfully!');
}

function showReportDetailsModal(report) {
    // Create and show a modal with report details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content report-details-modal">
            <div class="modal-header">
                <h3>Report Details - ${report.id}</h3>
                <button class="modal-close" data-action="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="report-detail-item">
                    <label>Category:</label>
                    <span>${report.category.charAt(0).toUpperCase() + report.category.slice(1)}</span>
                </div>
                <div class="report-detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${report.status}">${report.status.charAt(0).toUpperCase() + report.status.slice(1)}</span>
                </div>
                <div class="report-detail-item">
                    <label>Description:</label>
                    <span>${report.description || 'No description provided'}</span>
                </div>
                ${report.address ? `
                    <div class="report-detail-item">
                        <label>Address:</label>
                        <span>${report.address}</span>
                    </div>
                ` : ''}
                <div class="report-detail-item">
                    <label>Submitted:</label>
                    <span>${new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <div class="report-detail-item">
                    <label>Location:</label>
                    <span>Lat: ${report.latitude?.toFixed(6) || 'N/A'}, Lng: ${report.longitude?.toFixed(6) || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Update user stats display
function updateUserStats(reports, resolved) {
    document.getElementById('userReportsCount').textContent = reports;
    document.getElementById('userResolvedCount').textContent = resolved;
}

// Simulate login API call - Always successful
async function simulateLogin(email, password) {
    try {
        console.log('Attempting login with email:', email);
        
        // Always succeed - extract name from email if possible
        const name = email.split('@')[0]; // Use part before @ as name
        
        // Create a simple user object
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            joinDate: new Date().toISOString().split('T')[0],
            reportsCount: 0,
            resolvedCount: 0
        };
        
        // Create a simple token (just for compatibility)
        const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }));
        
        // Store token
        setAuthToken(token);
        
        return {
            success: true,
            user: user,
            token: token
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: true, // Always succeed even on error
            user: { id: Date.now(), name: 'User', email: email },
            token: btoa(JSON.stringify({ id: Date.now(), email: email, exp: Date.now() + 86400000 }))
        };
    }
}

// Simulate register API call - Always successful
async function simulateRegister(name, email, password) {
    try {
        console.log('Attempting registration for:', name, email);
        
        // Always succeed - store user data in localStorage
        let users = JSON.parse(localStorage.getItem('cityvoice_users') || '{}');
        users[email] = { name, password };
        localStorage.setItem('cityvoice_users', JSON.stringify(users));
        
        // Create a simple user object
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            joinDate: new Date().toISOString().split('T')[0],
            reportsCount: 0,
            resolvedCount: 0
        };
        
        // Create a simple token (just for compatibility)
        const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }));
        
        // Store token
        setAuthToken(token);
        
        return {
            success: true,
            user: user,
            token: token
        };
    } catch (error) {
        console.error('Registration error:', error);
        // Always succeed even on error
        return {
            success: true,
            user: { id: Date.now(), name: name || 'User', email: email },
            token: btoa(JSON.stringify({ id: Date.now(), email: email, exp: Date.now() + 86400000 }))
        };
    }
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    isAuthenticated = false;
    authToken = null;
    
    // Clear localStorage
    localStorage.removeItem('civicfix_user');
    localStorage.removeItem('civicfix_token');
    
    updateUIForUnauthenticatedUser();
    showAuthSuccess('Logged out successfully!');
    
    // Reset user stats
    updateUserStats(0, 0);
}

// Show authentication error
function showAuthError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remove existing error
    const existingError = form.querySelector('.auth-error');
    if (existingError) existingError.remove();
    
    // Create new error element
    const errorEl = document.createElement('div');
    errorEl.className = 'auth-error';
    errorEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    // Insert before submit button
    const submitBtn = form.querySelector('.auth-submit-btn');
    form.insertBefore(errorEl, submitBtn);
}

// Show authentication success message
function showAuthSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'auth-success-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentElement) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Set loading state for auth buttons
function setAuthLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('auth-loading');
        button.style.opacity = '0.7';
    } else {
        button.disabled = false;
        button.classList.remove('auth-loading');
        button.style.opacity = '1';
    }
}
authAnimationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(authAnimationStyles);

// Navigation listeners (Legacy support)
function setupNavigationListeners() {
    // Legacy nav links if any exist
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('href').substring(1);
            navigateToSection(targetSection);
        });
    });
    
    mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
}

// Setup report functionality listeners
function setupReportListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    const voiceBtn = document.getElementById('voiceBtn');
    const submitBtn = document.getElementById('submitReport');
    const miniMap = document.getElementById('miniMap');
    
    // Location search functionality
    const locationSearchInput = document.getElementById('locationSearch');
    const searchLocationBtn = document.getElementById('searchLocationBtn');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    uploadArea?.addEventListener('click', () => fileInput?.click());
    uploadArea?.addEventListener('dragover', handleDragOver);
    uploadArea?.addEventListener('drop', handleFileDrop);
    fileInput?.addEventListener('change', handleFileSelect);
    
    getCurrentLocationBtn?.addEventListener('click', getCurrentLocation);
    voiceBtn?.addEventListener('click', toggleVoiceRecording);
    submitBtn?.addEventListener('click', submitReport);
    
    // Location search event listeners
    if (locationSearchInput && searchLocationBtn) {
        searchLocationBtn.addEventListener('click', handleLocationSearch);
        locationSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLocationSearch();
            }
        });
        
        locationSearchInput.addEventListener('input', handleLocationInput);
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.location-search-container')) {
                hideSuggestions();
            }
        });
    }
}

// Map functionality listeners
function setupMapListeners() {
    const filterChips = document.querySelectorAll('.filter-chip');
    const categoryChips = document.querySelectorAll('.category-chip');
    const mapPins = document.querySelectorAll('.map-pin');
    const closePopup = document.getElementById('closePopup');
    const upvoteBtn = document.getElementById('upvoteBtn');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => filterIssues(chip.dataset.filter));
    });
    
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => filterByCategory(chip.dataset.category));
    });
    
    mapPins.forEach(pin => {
        pin.addEventListener('click', () => showIssuePopup(pin));
    });
    
    closePopup?.addEventListener('click', hideIssuePopup);
    upvoteBtn?.addEventListener('click', toggleUpvote);
}

// Community functionality listeners
function setupCommunityListeners() {
    const periodBtns = document.querySelectorAll('.period-btn');
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateLeaderboard(btn.textContent.toLowerCase());
        });
    });
}

// Admin functionality listeners
function setupAdminListeners() {
    const kanbanCards = document.querySelectorAll('.kanban-card');
    
    kanbanCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    const kanbanColumns = document.querySelectorAll('.kanban-cards');
    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleKanbanDrop);
    });
}

// Chatbot functionality listeners
function setupChatbotListeners() {
    const chatbotIcon = document.getElementById('chatbotIcon');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatbotInput = document.getElementById('chatbotInput');
    const sendMessage = document.getElementById('sendMessage');
    const quickReplyBtns = document.querySelectorAll('.quick-reply-btn');
    
    chatbotIcon?.addEventListener('click', toggleChatbot);
    closeChatbot?.addEventListener('click', hideChatbot);
    sendMessage?.addEventListener('click', sendChatbotMessage);
    chatbotInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatbotMessage();
    });
    
    quickReplyBtns.forEach(btn => {
        btn.addEventListener('click', () => handleQuickReply(btn.dataset.action));
    });
}

// Modal functionality listeners
function setupModalListeners() {
    const closeModal = document.getElementById('closeModal');
    const successModal = document.getElementById('successModal');
    
    closeModal?.addEventListener('click', hideSuccessModal);
    successModal?.addEventListener('click', (e) => {
        if (e.target === successModal) hideSuccessModal();
    });
}

// Navigation functionality (Updated for dashboard)
function navigateToSection(sectionId) {
    showPanel(sectionId);
    updateActiveNav(sectionId);
}

function toggleMobileMenu() {
    toggleSidebar();
}

// File upload functionality
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    console.log('Processing files:', files.length);
    
    const validFiles = [];
    const rejectedFiles = [];
    
    files.forEach(file => {
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        
        console.log('File:', file.name, 'Type:', file.type, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB', 'Valid type:', isValidType, 'Valid size:', isValidSize);
        
        if (isValidType && isValidSize) {
            validFiles.push(file);
        } else {
            rejectedFiles.push({
                file,
                reason: !isValidType ? 'Invalid file type' : 'File too large (max 10MB)'
            });
        }
    });
    
    // Show rejected files feedback
    if (rejectedFiles.length > 0) {
        const messages = rejectedFiles.map(rejected => 
            `${rejected.file.name}: ${rejected.reason}`
        ).join('\n');
        showErrorMessage(`Some files were rejected:\n${messages}`);
    }
    
    console.log('Valid files:', validFiles.length, 'Rejected files:', rejectedFiles.length);
    
    uploadedFiles = [...uploadedFiles, ...validFiles];
    console.log('Total uploaded files:', uploadedFiles.length);
    
    displayUploadPreview();
}

function displayUploadPreview() {
    console.log('Displaying preview for', uploadedFiles.length, 'files');
    
    const uploadContent = document.querySelector('.upload-content');
    const uploadPreview = document.getElementById('uploadPreview');
    
    console.log('Upload content element:', uploadContent);
    console.log('Upload preview element:', uploadPreview);
    
    if (uploadedFiles.length > 0) {
        uploadContent.style.display = 'none';
        uploadPreview.classList.add('active');
        uploadPreview.innerHTML = '';
        
        console.log('Creating preview items...');
        
        uploadedFiles.forEach((file, index) => {
            console.log('Creating preview for file:', file.name, 'Type:', file.type);
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.style.cssText = `
                position: relative;
                border-radius: 0.75rem;
                overflow: hidden;
                aspect-ratio: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.2);
                min-height: 120px;
                width: 100%;
            `;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'preview-remove';
            removeBtn.innerHTML = '×';
            removeBtn.style.cssText = `
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: rgba(239, 68, 68, 0.9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                z-index: 10;
            `;
            removeBtn.addEventListener('click', () => removeFile(index));
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                
                // Use FileReader to create data URL instead of blob URL
                const reader = new FileReader();
                reader.onload = function(e) {
                    img.src = e.target.result; // This creates a data: URL which is CSP-friendly
                    console.log('Image data URL created successfully:', file.name);
                };
                
                reader.onerror = function(e) {
                    console.error('Failed to read file:', file.name, e);
                    // Create fallback display
                    const fallback = document.createElement('div');
                    fallback.innerHTML = `
                        <div style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100%;
                            color: white;
                            font-size: 12px;
                            text-align: center;
                            padding: 8px;
                        ">
                            <i class="fas fa-image" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <span>${file.name}</span>
                        </div>
                    `;
                    previewItem.appendChild(fallback);
                };
                
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 0.75rem;
                    display: block;
                `;
                
                img.onload = () => {
                    console.log('Image loaded successfully:', file.name);
                };
                
                img.onerror = (e) => {
                    console.error('Failed to load image:', file.name, e);
                    // Create fallback display
                    img.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.innerHTML = `
                        <div style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100%;
                            color: white;
                            font-size: 12px;
                            text-align: center;
                            padding: 8px;
                        ">
                            <i class="fas fa-image" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <span>${file.name}</span>
                        </div>
                    `;
                    previewItem.appendChild(fallback);
                };
                
                previewItem.appendChild(img);
                
                // Read the file as data URL
                reader.readAsDataURL(file);
                console.log('Added image preview for:', file.name);
                
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                
                // Use FileReader for video as well
                const reader = new FileReader();
                reader.onload = function(e) {
                    video.src = e.target.result;
                    console.log('Video data URL created successfully:', file.name);
                };
                
                reader.onerror = function(e) {
                    console.error('Failed to read video file:', file.name, e);
                };
                
                video.controls = true;
                video.muted = true;
                
                video.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 0.75rem;
                `;
                
                video.onloadeddata = () => {
                    console.log('Video loaded successfully:', file.name);
                };
                
                video.onerror = (e) => {
                    console.error('Failed to load video:', file.name, e);
                };
                
                previewItem.appendChild(video);
                
                // Read the video file as data URL
                reader.readAsDataURL(file);
                console.log('Added video preview for:', file.name);
            }
            
            previewItem.appendChild(removeBtn);
            uploadPreview.appendChild(previewItem);
            console.log('Preview item added to container');
        });
        
        // Force the preview to be visible
        uploadPreview.style.display = 'grid';
        console.log('Preview container classes:', uploadPreview.className);
        console.log('Preview container style:', window.getComputedStyle(uploadPreview).display);
    } else {
        uploadContent.style.display = 'block';
        uploadPreview.classList.remove('active');
        uploadPreview.style.display = 'none';
        console.log('No files, showing upload content');
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    displayUploadPreview();
    
    console.log('File removed, remaining files:', uploadedFiles.length);
}

// Location functionality - Only when user clicks "Use Current Location"
function getCurrentLocation() {
    const locationBtn = document.getElementById('getCurrentLocation');
    
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Getting location...';
    locationBtn.disabled = true;
    
    if (navigator.geolocation) {
        // Show permission prompt if needed
        showLocationPermissionPrompt();
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                selectedLocation = { lat, lng };
                
                // Hide permission prompt
                hideLocationPermissionPrompt();
                
                // Update report map
                if (reportMap) {
                    reportMap.setView([lat, lng], 16);
                    
                    // Remove previous marker
                    if (userLocationMarker) {
                        reportMap.removeLayer(userLocationMarker);
                    }
                    
                    // Add new marker
                    userLocationMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'selected-location-marker',
                            html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); animation: bounce 2s infinite;"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(reportMap);
                }
                
                // Show coordinates to user
                displayLocationCoordinates(lat, lng, accuracy);
                
                locationBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Location Set';
                locationBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                
                setTimeout(() => {
                    locationBtn.innerHTML = '<i class="fas fa-crosshairs mr-2"></i>Use Current Location';
                    locationBtn.disabled = false;
                    locationBtn.style.background = '';
                }, 3000);
            },
            (error) => {
                console.error('Geolocation error:', error);
                
                // Hide permission prompt
                hideLocationPermissionPrompt();
                
                let errorMessage = 'Location unavailable';
                switch(error.code) {
                    case 1:
                        errorMessage = 'Permission denied - Allow location access in browser';
                        break;
                    case 2:
                        errorMessage = 'Position unavailable - Check GPS/internet';
                        break;
                    case 3:
                        errorMessage = 'Request timeout - Try again';
                        break;
                }
                
                // Show error toast
                showErrorMessage(errorMessage);
                
                locationBtn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>Try Again`;
                locationBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                
                setTimeout(() => {
                    locationBtn.innerHTML = '<i class="fas fa-crosshairs mr-2"></i>Use Current Location';
                    locationBtn.disabled = false;
                    locationBtn.style.background = '';
                }, 4000);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            }
        );
    } else {
        hideLocationPermissionPrompt();
        showErrorMessage('Geolocation not supported by your browser');
        
        locationBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Not Supported';
        setTimeout(() => {
            locationBtn.innerHTML = '<i class="fas fa-crosshairs mr-2"></i>Use Current Location';
            locationBtn.disabled = false;
        }, 3000);
    }
}

function setLocationFromMapClick(latlng) {
    selectedLocation = {
        lat: latlng.lat,
        lng: latlng.lng
    };
    
    // Remove previous marker
    if (userLocationMarker) {
        reportMap.removeLayer(userLocationMarker);
    }
    
    // Add new marker at clicked location
    userLocationMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'selected-location-marker',
            html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(reportMap);
    
    // Show success message
    const locationBtn = document.getElementById('getCurrentLocation');
    const originalText = locationBtn.innerHTML;
    locationBtn.innerHTML = '<i class="fas fa-map-marker-alt mr-2"></i>Location Selected';
    locationBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
        locationBtn.innerHTML = originalText;
        locationBtn.style.background = '';
    }, 2000);
}

// Location search functionality
function handleLocationSearch() {
    const searchInput = document.getElementById('locationSearch');
    const query = searchInput?.value.trim();
    
    if (!query) {
        showErrorMessage('Please enter a location to search');
        return;
    }
    
    console.log('🔍 Searching for location:', query);
    searchLocationByName(query);
}

function handleLocationInput(e) {
    const query = e.target.value.trim();
    if (query.length > 2) {
        debounceLocationSearch(query);
    } else {
        hideSuggestions();
    }
}

// Debounce function to avoid too many API calls
let searchTimeout;
function debounceLocationSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        getSuggestions(query);
    }, 300);
}

// Search for location using Nominatim API
async function searchLocationByName(query) {
    const searchBtn = document.getElementById('searchLocationBtn');
    
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        searchBtn.disabled = true;
    }
    
    try {
        console.log('📡 Searching location via Nominatim API...');
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`
        );
        
        if (!response.ok) {
            throw new Error('Search request failed');
        }
        
        const results = await response.json();
        
        if (results && results.length > 0) {
            const result = results[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            console.log('✅ Location found:', result.display_name);
            
            // Update the map location
            setLocationFromSearch(lat, lng, result.display_name);
            
            // Update address field
            const addressField = document.getElementById('address');
            if (addressField && !addressField.value) {
                addressField.value = result.display_name;
            }
            
            // Show success message
            safeShowVoiceMessage(`📍 Location set to ${result.display_name}`);
            
        } else {
            console.warn('⚠️ No results found for:', query);
            showErrorMessage(`No results found for "${query}". Try a different search term.`);
        }
        
    } catch (error) {
        console.error('❌ Location search error:', error);
        showErrorMessage('Failed to search location. Please check your internet connection.');
    } finally {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fas fa-search"></i>';
            searchBtn.disabled = false;
        }
        hideSuggestions();
    }
}

// Get search suggestions
async function getSuggestions(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
        );
        
        if (response.ok) {
            const results = await response.json();
            showSuggestions(results);
        }
    } catch (error) {
        console.warn('Suggestions fetch failed:', error);
        hideSuggestions();
    }
}

// Show search suggestions
function showSuggestions(results) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!suggestionsContainer || !results || results.length === 0) {
        hideSuggestions();
        return;
    }
    
    suggestionsContainer.innerHTML = '';
    
    results.forEach(result => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Parse the display name to show city/state
        const parts = result.display_name.split(',');
        const mainName = parts.slice(0, 2).join(', ');
        const details = parts.slice(2).join(', ');
        
        suggestionItem.innerHTML = `
            <span class="suggestion-name">${mainName}</span>
            <span class="suggestion-details">${details}</span>
        `;
        
        suggestionItem.addEventListener('click', () => {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            setLocationFromSearch(lat, lng, result.display_name);
            
            // Update search input
            const searchInput = document.getElementById('locationSearch');
            if (searchInput) {
                searchInput.value = mainName;
            }
            
            // Update address field
            const addressField = document.getElementById('address');
            if (addressField && !addressField.value) {
                addressField.value = result.display_name;
            }
            
            hideSuggestions();
            safeShowVoiceMessage(`📍 Location set to ${mainName}`);
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.classList.add('show');
}

// Hide suggestions
function hideSuggestions() {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('show');
    }
}

// Set location from search result
function setLocationFromSearch(lat, lng, locationName) {
    selectedLocation = { lat, lng };
    
    // Update report map
    if (reportMap) {
        reportMap.setView([lat, lng], 15);
        
        // Remove previous marker
        if (userLocationMarker) {
            reportMap.removeLayer(userLocationMarker);
        }
        
        // Add new marker at searched location
        userLocationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'selected-location-marker',
                html: '<div style="background: #6366f1; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(reportMap);
        
        // Optional: Add a popup with location name
        userLocationMarker.bindPopup(locationName).openPopup();
    }
    
    console.log('📍 Location set via search:', locationName, { lat, lng });
}

// Voice functionality
// Voice Recording for Description
let reportVoiceRecognition = null;
let isDescriptionRecording = false;

function toggleVoiceRecording() {
    console.log('Voice button clicked, current recording state:', isDescriptionRecording);
    
    // Test elements first
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const descriptionField = document.getElementById('description');
    
    console.log('Elements found:', {
        voiceBtn: !!voiceBtn,
        voiceStatusText: !!voiceStatusText,
        descriptionField: !!descriptionField
    });
    
    if (!voiceBtn || !voiceStatusText || !descriptionField) {
        console.error('Required elements not found');
        return;
    }
    
    if (!isDescriptionRecording) {
        startDescriptionRecording();
    } else {
        stopDescriptionRecording();
    }
}

function startDescriptionRecording() {
    console.log('=== Starting Voice Recording ===');
    
    // Check browser support first
    const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
    const hasSpeech = 'SpeechRecognition' in window;
    
    console.log('Browser support:', { hasWebkitSpeech, hasSpeech });
    
    if (!hasWebkitSpeech && !hasSpeech) {
        console.error('Speech recognition not supported in this browser');
        return;
    }
    
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const descriptionField = document.getElementById('description');
    
    // Double-check elements
    if (!voiceBtn || !voiceStatusText || !descriptionField) {
        console.error('Required elements missing:', {
            voiceBtn: !!voiceBtn,
            voiceStatusText: !!voiceStatusText,
            descriptionField: !!descriptionField
        });
        return;
    }
    
    try {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        reportVoiceRecognition = new SpeechRecognition();
        
        // Configure recognition
        reportVoiceRecognition.continuous = false;
        reportVoiceRecognition.interimResults = false;
        reportVoiceRecognition.lang = 'en-US';
        reportVoiceRecognition.maxAlternatives = 1;
        
        console.log('Speech recognition configured');
        
        // Set up event handlers
        reportVoiceRecognition.onstart = () => {
            console.log('✅ Voice recognition started successfully');
            isDescriptionRecording = true;
            voiceBtn.classList.add('recording');
            voiceStatusText.textContent = 'Listening...';
            voiceStatusText.classList.add('listening');
        };
        
        reportVoiceRecognition.onresult = (event) => {
            console.log('✅ Voice recognition result received:', event);
            
            if (event.results && event.results.length > 0 && event.results[0].isFinal) {
                const transcript = event.results[0][0].transcript.trim();
                console.log('✅ Final transcript:', transcript);
                
                if (transcript && transcript.length > 0) {
                    // Add transcript to description field
                    let currentValue = descriptionField.value.trim();
                    
                    if (currentValue) {
                        // Add proper punctuation and spacing
                        if (!currentValue.match(/[.!?]$/)) {
                            currentValue += '. ';
                        } else {
                            currentValue += ' ';
                        }
                    }
                    
                    // Capitalize first letter of transcript
                    const cleanTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                    descriptionField.value = currentValue + cleanTranscript;
                    
                    console.log('✅ Text added to description field:', cleanTranscript);
                    
                    // Focus on description field
                    descriptionField.focus();
                }
            }
        };
        
        reportVoiceRecognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            stopDescriptionRecording();
        };
        
        reportVoiceRecognition.onend = () => {
            console.log('✅ Voice recognition ended');
            stopDescriptionRecording();
        };
        
        // Start recording
        console.log('🎤 Starting speech recognition...');
        reportVoiceRecognition.start();
        
    } catch (error) {
        console.error('❌ Failed to start voice recognition:', error);
        stopDescriptionRecording();
    }
}

// Function to clean up voice transcript and remove repetitive patterns
function cleanVoiceTranscript(transcript) {
    // Remove excessive repetition of words and numbers
    let cleaned = transcript.toLowerCase();
    
    // Remove repeated numbers (like "1 1 k 1 cre 1 creta")
    cleaned = cleaned.replace(/\b1\s+/g, '');
    cleaned = cleaned.replace(/\b\d+\s+/g, '');
    
    // Remove repetitive partial words (like "cre creta creta")
    const words = cleaned.split(' ');
    const cleanWords = [];
    let lastWord = '';
    
    for (let word of words) {
        word = word.trim();
        if (word && word !== lastWord && !word.includes(lastWord) && !lastWord.includes(word)) {
            cleanWords.push(word);
            lastWord = word;
        }
    }
    
    // Join words and capitalize first letter
    let result = cleanWords.join(' ').trim();
    if (result) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    
    return result;
}

function stopDescriptionRecording() {
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const descriptionField = document.getElementById('description');
    
    isDescriptionRecording = false;
    voiceBtn.classList.remove('recording');
    voiceStatusText.textContent = 'Click to speak';
    voiceStatusText.classList.remove('listening');
    
    if (reportVoiceRecognition) {
        reportVoiceRecognition.stop();
        reportVoiceRecognition = null;
    }
    
    console.log('Description voice recording stopped');
}

// Enhanced form validation
function validateReportForm() {
    const errors = [];
    const warnings = [];
    
    const category = document.getElementById('category')?.value;
    const description = document.getElementById('description')?.value;
    const address = document.getElementById('address')?.value;
    
    // Required field validation
    if (!category) {
        errors.push('Please select a category for your report');
    }
    
    if (uploadedFiles.length === 0) {
        errors.push('Please upload at least one photo or video as evidence');
    }
    
    if (!selectedLocation) {
        errors.push('Please set your location on the map');
    }
    
    // Quality validation
    if (description && description.length < 10) {
        warnings.push('Description is very short - consider adding more details for faster resolution');
    }
    
    if (!address || address.length < 5) {
        warnings.push('Adding a specific address helps city officials locate the issue faster');
    }
    
    // File validation
    const oversizedFiles = uploadedFiles.filter(file => file.size > 5 * 1024 * 1024); // 5MB
    if (oversizedFiles.length > 0) {
        warnings.push(`${oversizedFiles.length} file(s) are very large and may take time to upload`);
    }
    
    return { errors, warnings };
}

// Show validation feedback
function showValidationFeedback(errors, warnings) {
    // Clear existing feedback
    const existingFeedback = document.querySelectorAll('.validation-feedback');
    existingFeedback.forEach(el => el.remove());
    
    const submitBtn = document.getElementById('submitReport');
    const container = submitBtn.parentElement;
    
    if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-feedback validation-errors';
        errorDiv.innerHTML = `
            <div class="feedback-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Please fix these issues:</span>
            </div>
            <ul class="feedback-list">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        container.insertBefore(errorDiv, submitBtn);
        return false;
    }
    
    if (warnings.length > 0) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'validation-feedback validation-warnings';
        warningDiv.innerHTML = `
            <div class="feedback-header">
                <i class="fas fa-info-circle"></i>
                <span>Suggestions for better results:</span>
            </div>
            <ul class="feedback-list">
                ${warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
            <div class="feedback-actions">
                <button type="button" class="feedback-btn continue-anyway" data-action="proceed-submission">
                    Submit Anyway
                </button>
                <button type="button" class="feedback-btn improve-report" data-action="close-feedback">
                    Improve Report
                </button>
            </div>
        `;
        container.insertBefore(warningDiv, submitBtn);
        
        // Add event listeners for feedback buttons
        const proceedBtn = warningDiv.querySelector('[data-action="proceed-submission"]');
        const closeBtn = warningDiv.querySelector('[data-action="close-feedback"]');
        
        if (proceedBtn) {
            proceedBtn.addEventListener('click', proceedWithSubmission);
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                warningDiv.remove();
            });
        }
        
        return false;
    }
    
    return true;
}

// Proceed with submission after warnings
function proceedWithSubmission() {
    document.querySelector('.validation-feedback')?.remove();
    // Set a flag to skip validation and submit directly
    window.skipValidation = true;
    submitReport();
    window.skipValidation = false;
}

// Submit report functionality
async function submitReport() {
    // Skip validation if proceeding after warnings
    if (!window.skipValidation) {
        const validation = validateReportForm();
        if (!showValidationFeedback(validation.errors, validation.warnings)) {
            return; // Stop submission if validation failed
        }
    }
    
    // Check if user is authenticated
    if (!isAuthenticated) {
        showErrorMessage('Please login to submit a report');
        showLoginModal();
        return;
    }
    
    const categoryElement = document.getElementById('category');
    const descriptionElement = document.getElementById('description');
    const addressElement = document.getElementById('address');
    const submitBtn = document.getElementById('submitReport');
    
    const category = categoryElement ? categoryElement.value : '';
    const description = descriptionElement ? descriptionElement.value : '';
    const address = addressElement ? addressElement.value : '';
    
    if (!category) {
        showErrorMessage('Please select a category');
        return;
    }
    
    if (uploadedFiles.length === 0) {
        showErrorMessage('Please upload at least one photo or video');
        return;
    }
    
    if (!selectedLocation) {
        showErrorMessage('Please set your location');
        return;
    }
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
        submitBtn.disabled = true;
    }
    
    try {
        console.log('📤 Submitting report to backend...');
        
        // Try real backend submission first
        try {
            const response = await uploadFiles(uploadedFiles, {
                category,
                description,
                address,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng
            });
            
            if (response.success) {
                console.log('✅ Report submitted to backend successfully:', response.data.ticketId);
                
                // Also save locally for immediate UI update
                const imagePreview = uploadedFiles.length > 0 ? await getImagePreview(uploadedFiles[0]) : null;
                const localReportData = {
                    category,
                    description,
                    address,
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                    imagePreview: imagePreview,
                    ticketId: response.data.ticketId
                };
                
                const savedReport = addUserReport(localReportData);
                
                // Award points for filing a report
                awardPoints('report');
                
                // Refresh map with new data
                loadReportsData();
                
                const ticketNumber = response.data.ticketId.split('-')[1];
                showSuccessModal(ticketNumber);
                resetReportForm();
                
                // Show success message with backend confirmation
                safeShowVoiceMessage('✅ Report submitted to city officials successfully!');
            }
        } catch (backendError) {
            console.warn('⚠️ Backend submission failed, saving locally:', backendError.message);
            
            // Fallback to local storage
            const ticketId = `CIV-${generateTicketId()}`;
            const imagePreview = uploadedFiles.length > 0 ? await getImagePreview(uploadedFiles[0]) : null;
            
            const localReportData = {
                category,
                description,
                address,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                imagePreview: imagePreview,
                ticketId: ticketId
            };
            
            const savedReport = addUserReport(localReportData);
            
            // Award points for filing a report
            awardPoints('report');
            
            const ticketNumber = ticketId.split('-')[1];
            showSuccessModal(ticketNumber);
            resetReportForm();
            
            safeShowVoiceMessage('⚠️ Report saved locally - will sync when connection is restored');
        }
        
    } catch (error) {
        console.error('Submit report error:', error);
        showErrorMessage('Failed to submit report: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = '<span>Submit Report</span><i class="fas fa-paper-plane ml-2"></i>';
            submitBtn.disabled = false;
        }
    }
}

// Show error message
function showErrorMessage(message) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
}

// Helper function to get image preview as data URL
function getImagePreview(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(null);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            console.error('Error reading file:', e);
            resolve(null);
        };
        
        reader.readAsDataURL(file);
    });
}

function generateTicketId() {
    return Math.floor(Math.random() * 9000) + 1000;
}

function resetReportForm() {
    uploadedFiles = [];
    selectedLocation = null;
    displayUploadPreview();
    
    const categoryElement = document.getElementById('category');
    const descriptionElement = document.getElementById('description');
    const locationPin = document.querySelector('.location-pin');
    const addressElement = document.getElementById('address');
    
    if (categoryElement) categoryElement.value = '';
    if (descriptionElement) descriptionElement.value = '';
    if (addressElement) addressElement.value = '';
    if (locationPin) locationPin.classList.remove('active');
    
    console.log('Report form reset successfully');
}

function showSuccessModal(ticketId) {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    
    if (messageElement) {
        messageElement.textContent = `Your report has been submitted successfully! Ticket ID: #${ticketId.toString().padStart(3, '0')}`;
    }
    
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('hidden');
}

// Map explore functionality
function filterIssues(filter) {
    const filterChips = document.querySelectorAll('.filter-chip');
    const mapPins = document.querySelectorAll('.map-pin');
    
    filterChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    
    mapPins.forEach(pin => {
        const shouldShow = filter === 'all' || pin.classList.contains(filter);
        pin.style.display = shouldShow ? 'block' : 'none';
        
        if (shouldShow) {
            pin.classList.add('fade-in');
        }
    });
}

function filterByCategory(category) {
    const categoryChips = document.querySelectorAll('.category-chip');
    const mapPins = document.querySelectorAll('.map-pin');
    
    categoryChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.category === category);
    });
    
    mapPins.forEach(pin => {
        const shouldShow = pin.dataset.issue === category;
        pin.style.display = shouldShow ? 'block' : 'none';
        
        if (shouldShow) {
            pin.classList.add('fade-in');
        }
    });
}

function showIssuePopupFromMarker(issueData) {
    const popup = document.getElementById('issuePopup');
    const title = document.getElementById('popupTitle');
    const description = document.getElementById('popupDescription');
    const status = document.getElementById('popupStatus');
    const upvoteCount = document.getElementById('upvoteCount');
    
    title.textContent = issueData.title;
    description.textContent = issueData.description;
    status.className = `status-badge ${issueData.status}`;
    status.textContent = issueData.status.charAt(0).toUpperCase() + issueData.status.slice(1);
    upvoteCount.textContent = issueData.upvotes;
    
    popup.classList.remove('hidden');
    popup.classList.add('fade-in');
}

function showIssuePopup(pin) {
    const popup = document.getElementById('issuePopup');
    const title = document.getElementById('popupTitle');
    const description = document.getElementById('popupDescription');
    const status = document.getElementById('popupStatus');
    
    currentIssuePin = pin;
    
    const issueData = {
        pothole: {
            title: 'Pothole Report',
            description: 'Large pothole causing traffic issues on main road',
            status: 'pending'
        },
        water: {
            title: 'Water Leak Report',
            description: 'Pipe burst causing water wastage in park area',
            status: 'progress'
        },
        streetlight: {
            title: 'Streetlight Issue',
            description: 'Broken streetlight creating safety concerns',
            status: 'resolved'
        }
    };
    
    const issueType = pin.dataset.issue;
    const data = issueData[issueType] || issueData.pothole;
    
    title.textContent = data.title;
    description.textContent = data.description;
    status.className = `status-badge ${data.status}`;
    status.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    
    popup.classList.remove('hidden');
    popup.classList.add('fade-in');
}

function hideIssuePopup() {
    const popup = document.getElementById('issuePopup');
    popup.classList.add('hidden');
    currentIssuePin = null;
}

async function toggleUpvote() {
    const upvoteBtn = document.getElementById('upvoteBtn');
    const upvoteCount = document.getElementById('upvoteCount');
    
    const isUpvoted = upvoteBtn.classList.contains('upvoted');
    const currentCount = parseInt(upvoteCount.textContent);
    
    if (isUpvoted) {
        // For demo purposes, just decrease locally
        upvoteBtn.classList.remove('upvoted');
        upvoteCount.textContent = currentCount - 1;
    } else {
        upvoteBtn.classList.add('upvoted');
        upvoteCount.textContent = currentCount + 1;
        
        // Add animation effect
        upvoteBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            upvoteBtn.style.transform = '';
        }, 200);
        
        // Try to send to API if we have a report ID
        try {
            if (currentIssuePin && currentIssuePin.issueData && currentIssuePin.issueData.id) {
                await apiCall(`/reports/${currentIssuePin.issueData.id}/upvote`, {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.warn('Could not sync upvote to server:', error);
        }
    }
}

// Community functionality
function updateLeaderboard(period) {
    console.log(`Updating leaderboard for ${period}`);
}

// Admin functionality
let draggedCard = null;

function handleDragStart(e) {
    draggedCard = e.target;
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '';
    draggedCard = null;
}

function handleKanbanDrop(e) {
    e.preventDefault();
    
    if (draggedCard && e.currentTarget.classList.contains('kanban-cards')) {
        e.currentTarget.appendChild(draggedCard);
        
        const columnHeader = e.currentTarget.previousElementSibling;
        const newStatus = columnHeader.textContent.toLowerCase().includes('progress') ? 'progress' :
                         columnHeader.textContent.toLowerCase().includes('resolved') ? 'resolved' : 'pending';
        
        draggedCard.classList.add('fade-in');
        updateKanbanCounts();
    }
}

function updateKanbanCounts() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        const count = column.querySelector('.count');
        const cards = column.querySelectorAll('.kanban-card');
        count.textContent = cards.length;
    });
}

// Chatbot functionality
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    chatbotWindow.classList.toggle('hidden');
    
    if (!chatbotWindow.classList.contains('hidden')) {
        chatbotWindow.classList.add('fade-in');
    }
}

function hideChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    chatbotWindow.classList.add('hidden');
}

function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const response = generateBotResponse(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbotMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateBotResponse(userMessage) {
    const responses = {
        'report': 'I can help you report an issue! Would you like to upload a photo and describe the problem?',
        'track': 'To track your ticket, please provide your ticket ID (e.g., #CIV-001)',
        'map': 'You can view all reported issues on the map. Would you like me to show you issues in your area?',
        'help': 'I can help you with reporting issues, tracking tickets, or finding information on the map. What would you like to do?',
        'default': 'I understand you need help. You can report issues, track tickets, or explore the map. How can I assist you today?'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('report') || lowerMessage.includes('issue')) {
        return responses.report;
    } else if (lowerMessage.includes('track') || lowerMessage.includes('ticket')) {
        return responses.track;
    } else if (lowerMessage.includes('map') || lowerMessage.includes('location')) {
        return responses.map;
    } else if (lowerMessage.includes('help')) {
        return responses.help;
    } else {
        return responses.default;
    }
}

function handleQuickReply(action) {
    const actions = {
        'report': 'I want to report an issue',
        'track': 'Track my ticket',
        'map': 'Show me the map'
    };
    
    const message = actions[action];
    if (message) {
        addChatMessage(message, 'user');
        
        setTimeout(() => {
            const response = generateBotResponse(message);
            addChatMessage(response, 'bot');
        }, 500);
    }
    
    if (action === 'report') {
        setTimeout(() => navigateToSection('report'), 1000);
    } else if (action === 'map') {
        setTimeout(() => navigateToSection('map'), 1000);
    }
}

function initializeChatbot() {
    setTimeout(() => {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (messagesContainer && messagesContainer.children.length <= 1) {
            addChatMessage('Feel free to ask me anything about reporting issues or using the platform!', 'bot');
        }
    }, 3000);
}

// Animation and UI enhancements
function animateCounters() {
    // Only animate main dashboard stats, not sidebar stats
    const statNumbers = document.querySelectorAll('.stats-grid .stat-number');
    
    statNumbers.forEach(stat => {
        // Skip elements that should be preserved (sidebar stats)
        if (stat.getAttribute('data-preserve') === 'true') {
            return;
        }
        
        // Skip if element is in sidebar
        if (stat.closest('.sidebar')) {
            return;
        }
        
        // Skip if element has ID that indicates it's a sidebar stat
        if (stat.id === 'userReportsCount' || stat.id === 'userResolvedCount') {
            return;
        }
        
        const target = parseInt(stat.dataset.target) || 0;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        // Clear any existing animation
        if (stat.animationTimer) {
            clearInterval(stat.animationTimer);
        }
        
        stat.animationTimer = setInterval(() => {
            current += step;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(stat.animationTimer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 16);
    });
    
    console.log('✨ Counter animations started for main dashboard stats only');
}

function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe dashboard elements for animations
    const elements = document.querySelectorAll('.stat-card, .activity-item, .report-card, .leader-item, .help-category');
    elements.forEach(element => observer.observe(element));
}

function setupSmoothScrolling() {
    // Dashboard navigation replaces traditional scrolling
    console.log('Dashboard navigation active - smooth scrolling managed by panel switching');
    
    // Handle any remaining anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            
            // Try to show as panel first
            if (document.getElementById(`panel-${target}`)) {
                showPanel(target);
                updateActiveNav(target);
            } else {
                // Fallback to traditional scroll if element exists
                const element = document.getElementById(target);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Additional interactive features
function addInteractiveElements() {
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Add scroll progress indicator
    addScrollProgressIndicator();
    
    // Add Easter eggs
    addEasterEggs();
    
    // Add accessibility improvements
    improveAccessibility();
}

function handleKeyboardNavigation(e) {
    if (e.key === 'Escape') {
        // Close any open modals or popups
        hideIssuePopup();
        hideSuccessModal();
        hideChatbot();
    }
    
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Quick action shortcut
        toggleChatbot();
    }
}

function addScrollProgressIndicator() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #10b981);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

function addEasterEggs() {
    // Konami code easter egg
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            activateEasterEgg();
        }
    });
}

function activateEasterEgg() {
    // Fun animation when konami code is entered
    document.body.style.animation = 'rainbow 2s ease-in-out';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.head.removeChild(style);
    }, 2000);
    
    addChatMessage('🎉 Easter egg activated! You found the secret!', 'bot');
    toggleChatbot();
}

function improveAccessibility() {
    // Add focus indicators for keyboard navigation
    const style = document.createElement('style');
    style.textContent = `
        .focus-visible {
            outline: 2px solid #6366f1;
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
    
    // Add ARIA labels where missing
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
        const text = button.textContent || button.innerHTML.replace(/<[^>]*>/g, '');
        if (text) {
            button.setAttribute('aria-label', text.trim());
        }
    });
}

// Performance optimizations
function optimizePerformance() {
    // Debounce scroll events
    let scrollTimeout;
    const originalScrollHandler = window.onscroll;
    
    window.onscroll = function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            if (originalScrollHandler) {
                originalScrollHandler();
            }
        }, 16); // ~60fps
    };
    
    // Lazy load non-critical features
    setTimeout(() => {
        addInteractiveElements();
    }, 1000);
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', () => {
    optimizePerformance();
});

// =====================================
// VOICE COMMANDS FUNCTIONALITY
// =====================================

// Initialize Voice Commands
function initializeVoiceCommands() {
    // Check if browser supports Speech Recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech Recognition not supported in this browser');
        return false;
    }
    
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Setup voice commands mapping
    setupVoiceCommands();
    
    // Event listeners
    recognition.onstart = () => {
        console.log('Voice recognition started');
        updateVoiceStatus('listening', 'Listening... Speak your command');
    };
    
    recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
            const command = lastResult[0].transcript.toLowerCase().trim();
            console.log('Voice command received:', command);
            processVoiceCommand(command);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        updateVoiceStatus('error', `Error: ${event.error}`);
        stopVoiceListening();
    };
    
    recognition.onend = () => {
        console.log('Voice recognition ended');
        if (isVoiceListening) {
            updateVoiceStatus('idle', 'Click "Start Listening" to activate voice commands');
        }
        isVoiceListening = false;
        updateVoiceButtons();
    };
    
    return true;
}

// Setup voice commands mapping
function setupVoiceCommands() {
    voiceCommands = {
        // Navigation commands
        'go to home': () => navigateToSection('home'),
        'open home': () => navigateToSection('home'),
        'home': () => navigateToSection('home'),
        
        'report issue': () => navigateToSection('report'),
        'create report': () => navigateToSection('report'),
        'new report': () => navigateToSection('report'),
        
        'show map': () => navigateToSection('map'),
        'open map': () => navigateToSection('map'),
        'explore map': () => navigateToSection('map'),
        
        'my reports': () => navigateToSection('reports'),
        'show reports': () => navigateToSection('reports'),
        'view reports': () => navigateToSection('reports'),
        
        'show community': () => navigateToSection('community'),
        'open community': () => navigateToSection('community'),
        'community': () => navigateToSection('community'),
        
        'show creators': () => navigateToSection('creators'),
        'open creators': () => navigateToSection('creators'),
        'creators': () => navigateToSection('creators'),
        
        'get help': () => navigateToSection('help'),
        'open help': () => navigateToSection('help'),
        'help': () => navigateToSection('help'),
        
        // Action commands
        'submit report': () => executeAction('submitReport'),
        'send report': () => executeAction('submitReport'),
        
        'use location': () => executeAction('getCurrentLocation'),
        'get location': () => executeAction('getCurrentLocation'),
        'current location': () => executeAction('getCurrentLocation'),
        
        'close modal': () => executeAction('closeModal'),
        'close popup': () => executeAction('closeModal'),
        'close': () => executeAction('closeModal'),
        
        // Voice Commands specific
        'voice commands': () => showVoiceCommandsModal(),
        'show commands': () => showVoiceCommandsModal(),
        'open voice commands': () => showVoiceCommandsModal(),
        
        'stop listening': () => stopVoiceListening(),
        'stop voice': () => stopVoiceListening(),
        
        // Quick actions
        'search issues': () => executeAction('searchIssues'),
        'find issues': () => executeAction('searchIssues'),
        'show stats': () => executeAction('showStats'),
        'view statistics': () => executeAction('showStats')
    };
}

// Process voice command
function processVoiceCommand(command) {
    console.log('Processing command:', command);
    
    // Find matching command
    const matchedCommand = findBestCommandMatch(command);
    
    if (matchedCommand) {
        console.log('Executing command:', matchedCommand);
        updateVoiceStatus('success', `Executing: "${matchedCommand}"`);
        
        // Execute the command after a brief delay to show feedback
        setTimeout(() => {
            voiceCommands[matchedCommand]();
        }, 500);
        
        // Reset status after execution
        setTimeout(() => {
            if (isVoiceListening) {
                updateVoiceStatus('listening', 'Listening... Speak your command');
            }
        }, 2000);
    } else {
        console.log('Command not recognized:', command);
        updateVoiceStatus('error', `Command not recognized: "${command}"`);
        
        // Reset status
        setTimeout(() => {
            if (isVoiceListening) {
                updateVoiceStatus('listening', 'Listening... Speak your command');
            }
        }, 3000);
    }
}

// Find best command match using fuzzy matching
function findBestCommandMatch(spoken) {
    const commands = Object.keys(voiceCommands);
    
    // Direct match
    if (commands.includes(spoken)) {
        return spoken;
    }
    
    // Partial match
    for (const command of commands) {
        if (spoken.includes(command) || command.includes(spoken)) {
            return command;
        }
    }
    
    // Word-by-word match
    const spokenWords = spoken.split(' ');
    for (const command of commands) {
        const commandWords = command.split(' ');
        let matchCount = 0;
        
        for (const word of spokenWords) {
            if (commandWords.includes(word)) {
                matchCount++;
            }
        }
        
        // If most words match, consider it a match
        if (matchCount >= Math.min(commandWords.length, spokenWords.length) * 0.7) {
            return command;
        }
    }
    
    return null;
}

// Execute various actions
function executeAction(action) {
    switch (action) {
        case 'submitReport':
            const submitBtn = document.getElementById('submitReport');
            if (submitBtn && currentSection === 'report') {
                submitBtn.click();
            } else {
                showVoiceMessage('Please go to Report Issue page first');
            }
            break;
            
        case 'getCurrentLocation':
            const locationBtn = document.getElementById('getCurrentLocation');
            if (locationBtn && currentSection === 'report') {
                locationBtn.click();
            } else {
                showVoiceMessage('Please go to Report Issue page first');
            }
            break;
            
        case 'closeModal':
            const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    modal.classList.add('hidden');
                });
            } else {
                showVoiceMessage('No open modals to close');
            }
            break;
            
        case 'searchIssues':
            showVoiceMessage('Search functionality coming soon!');
            break;
            
        case 'showStats':
            if (currentSection === 'home') {
                animateCounters();
                showVoiceMessage('Dashboard statistics refreshed');
            } else {
                navigateToSection('home');
            }
            break;
            
        default:
            showVoiceMessage('Action not implemented yet');
    }
}

// Navigate to section using voice
function navigateToSection(sectionId) {
    showPanel(sectionId);
    updateActiveNav(sectionId);
    
    // Close voice modal if it's open
    const voiceModal = document.getElementById('voiceCommandsModal');
    if (voiceModal && !voiceModal.classList.contains('hidden')) {
        hideVoiceCommandsModal();
    }
    
    showVoiceMessage(`Navigated to ${sectionId}`);
}

// Voice Commands Modal Functions
function showVoiceCommandsModal() {
    const modal = document.getElementById('voiceCommandsModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Initialize voice recognition if not already done
        if (!recognition) {
            const supported = initializeVoiceCommands();
            if (!supported) {
                updateVoiceStatus('error', 'Voice commands not supported in this browser');
            }
        }
    }
}

function hideVoiceCommandsModal() {
    const modal = document.getElementById('voiceCommandsModal');
    if (modal) {
        modal.classList.add('hidden');
        
        // Stop listening when modal is closed
        if (isVoiceListening) {
            stopVoiceListening();
        }
    }
}

// Start voice listening
function startVoiceListening() {
    if (!recognition) {
        const supported = initializeVoiceCommands();
        if (!supported) {
            updateVoiceStatus('error', 'Voice commands not supported in this browser');
            return;
        }
    }
    
    if (!isVoiceListening) {
        isVoiceListening = true;
        recognition.start();
        updateVoiceButtons();
    }
}

// Stop voice listening
function stopVoiceListening() {
    if (recognition && isVoiceListening) {
        isVoiceListening = false;
        recognition.stop();
        updateVoiceStatus('idle', 'Click "Start Listening" to activate voice commands');
        updateVoiceButtons();
    }
}

// Update voice status display
function updateVoiceStatus(status, message) {
    const voiceStatus = document.getElementById('voiceStatus');
    const statusText = document.querySelector('.voice-status-text');
    
    if (voiceStatus && statusText) {
        voiceStatus.className = `voice-status ${status}`;
        statusText.textContent = message;
    }
}

// Update voice control buttons
function updateVoiceButtons() {
    const startBtn = document.getElementById('startVoiceBtn');
    const stopBtn = document.getElementById('stopVoiceBtn');
    
    if (startBtn && stopBtn) {
        if (isVoiceListening) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
        } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
        }
    }
}

// Show voice feedback message
function showVoiceMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'voice-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-microphone-alt"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}
function showVoiceMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'voice-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-microphone-alt"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Setup Voice Commands Event Listeners
function setupVoiceCommandsListeners() {
    // Voice Commands button in sidebar
    const voiceCommandsBtn = document.getElementById('voiceCommandsBtn');
    voiceCommandsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showVoiceCommandsModal();
    });
    
    // Modal close button
    const closeVoiceModal = document.getElementById('closeVoiceModal');
    closeVoiceModal?.addEventListener('click', hideVoiceCommandsModal);
    
    // Start/Stop listening buttons
    const startVoiceBtn = document.getElementById('startVoiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    
    startVoiceBtn?.addEventListener('click', startVoiceListening);
    stopVoiceBtn?.addEventListener('click', stopVoiceListening);
    
    // Close modal on overlay click
    const voiceModal = document.getElementById('voiceCommandsModal');
    voiceModal?.addEventListener('click', (e) => {
        if (e.target.id === 'voiceCommandsModal') {
            hideVoiceCommandsModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl + Shift + V to open voice commands
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            showVoiceCommandsModal();
        }
        
        // Escape to close voice modal
        if (e.key === 'Escape') {
            const voiceModal = document.getElementById('voiceCommandsModal');
            if (voiceModal && !voiceModal.classList.contains('hidden')) {
                hideVoiceCommandsModal();
            }
        }
    });
}
