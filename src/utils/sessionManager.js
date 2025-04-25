import { 
    refreshSessionCookie, 
    removeSessionCookie, 
    getSessionTimeoutDuration
} from './cookieUtils';
import './sessionManager.css';

// Core session constants
const SESSION_COOKIE_NAME = 'userSession';
const COUNTDOWN_SECONDS = 10;
let sessionTimeoutId = null;
let countdownId = null;
let overlayElement = null;

/**
 * Updates the timestamp of the user's last activity
 */
export const updateLastActivity = () => {
    const now = Date.now();
    localStorage.setItem('lastActivity', now.toString());
};

/**
 * Creates and displays the session timeout overlay with countdown
 * @param {Function} extendCallback - Function to extend the session
 * @param {Function} logoutCallback - Function to logout immediately
 * @param {number} seconds - Initial countdown seconds
 */
const createSessionTimeoutOverlay = (extendCallback, logoutCallback, seconds) => {
    // Don't create overlay if user is not logged in
    if (localStorage.getItem('loggedIn') !== 'true') {
        return null;
    }
    
    // Don't create multiple overlays
    if (overlayElement) {
        return;
    }
    
    // Create overlay container
    overlayElement = document.createElement('div');
    overlayElement.id = 'session-timeout-overlay';
    overlayElement.className = 'session-timeout-overlay';
    
    // Create overlay content
    overlayElement.innerHTML = `
        <div class="session-overlay-content">
            <div class="session-overlay-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                <h2>Session Timeout</h2>
            </div>
            <div class="session-overlay-body">
                <p>Your session is about to expire due to inactivity.</p>
                <div class="session-overlay-countdown">
                    <span id="session-countdown-number">${seconds}</span>
                    <span>seconds remaining</span>
                </div>
            </div>
            <div class="session-overlay-actions">
                <button id="session-extend-btn" class="session-overlay-btn primary">Continue Session</button>
                <button id="session-logout-btn" class="session-overlay-btn secondary">Logout Now</button>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(overlayElement);
    
    // Force reflow to ensure proper animation
    void overlayElement.offsetHeight;
    
    // Fade in animation
    setTimeout(() => {
        overlayElement.classList.add('visible');
    }, 10);
    
    // Add event listeners to buttons
    document.getElementById('session-extend-btn').addEventListener('click', extendCallback);
    document.getElementById('session-logout-btn').addEventListener('click', logoutCallback);
    
    return overlayElement;
};

/**
 * Updates the countdown display
 * @param {number} seconds - Seconds remaining
 */
const updateCountdown = (seconds) => {
    const countdownElement = document.getElementById('session-countdown-number');
    if (countdownElement) {
        countdownElement.textContent = seconds;
    }
};

/**
 * Removes the session timeout overlay
 */
const removeSessionTimeoutOverlay = () => {
    if (overlayElement) {
        overlayElement.classList.remove('visible');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (document.body.contains(overlayElement)) {
                document.body.removeChild(overlayElement);
                overlayElement = null;
            }
        }, 300);
    }
};

/**
 * Starts the session timeout countdown
 * @param {Function} onExpired - Function to call when countdown expires
 */
const startSessionTimeoutCountdown = (onExpired) => {
    // Don't start countdown if user is not logged in
    if (localStorage.getItem('loggedIn') !== 'true') {
        return null;
    }

    // Clear any existing countdown
    clearTimeout(countdownId);
    
    let secondsLeft = COUNTDOWN_SECONDS;
    
    // Create the overlay
    createSessionTimeoutOverlay(
        // Extend session handler
        () => {
            // Clear the countdown
            clearTimeout(countdownId);
            
            // Remove the overlay
            removeSessionTimeoutOverlay();
            
            // Reset the session timeout
            updateLastActivity();
            refreshSessionCookie(SESSION_COOKIE_NAME);
            scheduleSessionTimeout(onExpired);
        },
        // Logout handler
        () => {
            clearTimeout(countdownId);
            clearTimeout(sessionTimeoutId);
            
            // Call the expired callback with 'user_logout' reason
            onExpired('user_logout');
        },
        secondsLeft
    );
    
    // Set up countdown interval
    let countdownInterval = setInterval(() => {
        secondsLeft--;
        updateCountdown(secondsLeft);
        
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            clearTimeout(sessionTimeoutId);
            
            // Call the expired callback with 'timeout' reason
            onExpired('timeout');
        }
    }, 1000);
    
    return countdownInterval;
};

/**
 * Schedules the session timeout
 * @param {Function} onTimeout - Function to call when session times out
 */
const scheduleSessionTimeout = (onTimeout) => {
    // Clear any existing timeout
    clearTimeout(sessionTimeoutId);
    
    // Don't schedule if user is not logged in
    if (localStorage.getItem('loggedIn') !== 'true') {
        return null;
    }
    
    const timeoutDuration = getSessionTimeoutDuration();
    const countdownThreshold = Math.max(timeoutDuration - (COUNTDOWN_SECONDS * 1000), 1000);
    
    // Set timeout to show countdown when session is about to expire
    sessionTimeoutId = setTimeout(() => {
        // Double-check login status before starting countdown
        if (localStorage.getItem('loggedIn') !== 'true') {
            return;
        }
        
        // Store the countdown interval for later cleanup
        let interval = startSessionTimeoutCountdown(onTimeout);
        countdownId = interval;
    }, countdownThreshold);
    
    return sessionTimeoutId;
};

/**
 * Performs a forced session logout
 * @param {Function} navigate - React Router navigation function
 * @param {string} reason - Reason for logout
 */
const performSessionLogout = (navigate, reason = 'timeout') => {
    // Check if already logged out
    if (localStorage.getItem('loggedIn') !== 'true') {
        // If we're not on login page, redirect there
        const isLoginPage = window.location.pathname === '/';
        if (!isLoginPage && navigate) {
            navigate('/');
        }
        return;
    }
    
    // Set logged in status to false FIRST to prevent new timeouts from starting
    localStorage.setItem('loggedIn', 'false');
    
    // Clear all timers
    clearTimeout(sessionTimeoutId);
    clearTimeout(countdownId);
    
    // Remove the overlay if it exists
    removeSessionTimeoutOverlay();
    
    // Clear session data
    removeSessionCookie(SESSION_COOKIE_NAME);
    
    try {
        // Save URL before clearing
        const apiUrl = localStorage.getItem("url");
        
        // Clear ALL browser storage for complete session cleanup
        // Including localStorage, sessionStorage, and cookies
        
        // Set logout flag first before clearing other data
        localStorage.setItem("forcedLogout", "true");
        localStorage.setItem("logoutReason", reason);
        
        // Clear all authentication-related localStorage items
        const keysToPreserve = ['url', 'forcedLogout', 'logoutReason'];
        for (const key in localStorage) {
            if (!keysToPreserve.includes(key)) {
                localStorage.removeItem(key);
            }
        }
        
        // Clear all sessionStorage
        sessionStorage.clear();
        
        // Clear all cookies except essential ones
        document.cookie.split(';').forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            if (cookieName !== 'theme' && cookieName !== 'language') {
                // Delete cookie from root path
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure`;
                
                // Also delete from localhost domain explicitly
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost; SameSite=Strict`;
                
                // Delete cookie without security attributes (for development)
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                
                // Force a more aggressive cookie deletion by setting multiple variants
                const domains = ['', 'localhost', window.location.hostname];
                const paths = ['/', '', '/app', window.location.pathname];
                
                domains.forEach(domain => {
                    paths.forEach(path => {
                        // Try with and without domain attribute
                        if (domain) {
                            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
                        } else {
                            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
                        }
                    });
                });
            }
        });
        
        // Restore URL if needed for API
        if (apiUrl) {
            localStorage.setItem("url", apiUrl);
        }
    } catch (e) {
        console.error("Error clearing storage:", e);
    }
    
    // Create logout notification
    const logoutMessage = document.createElement('div');
    logoutMessage.className = 'session-logout-notification';
    
    // Set message based on reason
    let message = '';
    let icon = '';
    
    switch (reason) {
        case 'timeout':
            message = 'You have been logged out due to inactivity';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
            </svg>`;
            break;
        case 'user_logout':
            message = 'You have been logged out';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>`;
            break;
        case 'cookie_missing':
            message = 'Session expired - authentication required';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>`;
            break;
        default:
            message = 'Session ended';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>`;
    }
    
    logoutMessage.innerHTML = `
        <div class="session-logout-icon">${icon}</div>
        <div class="session-logout-text">${message}</div>
    `;
    
    document.body.appendChild(logoutMessage);
    
    // Show message and redirect
    setTimeout(() => {
        logoutMessage.classList.add('show');
        
        // Redirect after showing message
        setTimeout(() => {
            if (document.body.contains(logoutMessage)) {
                logoutMessage.classList.remove('show');
                
                setTimeout(() => {
                    if (document.body.contains(logoutMessage)) {
                        document.body.removeChild(logoutMessage);
                    }
                    
                    // Navigate to login page
                    if (navigate) {
                        navigate('/');
                    } else {
                        window.location.href = '/';
                    }
                }, 300);
            }
        }, 2500);
    }, 100);
};

/**
 * Initializes the session manager
 * @param {Function} navigate - React Router navigate function
 * @returns {Function} Cleanup function
 */
export const initializeSessionManager = (navigate) => {
    // Check if we're on the login page
    const isLoginPage = window.location.pathname === '/' || 
                        window.location.pathname === '/login' ||
                        window.location.pathname === '/index.html';
    
    // If we're on login page, clear the forced logout flags
    if (isLoginPage) {
        localStorage.removeItem('forcedLogout');
        localStorage.removeItem('logoutReason');
        
        // Remove any existing session notification elements
        const notifications = document.querySelectorAll('.session-info-notification, .session-logout-notification');
        notifications.forEach(notification => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
    }
    // Only show previous session ended notification if not on login page
    else if (localStorage.getItem("forcedLogout") === "true") {
        const reason = localStorage.getItem("logoutReason") || "unknown";
        
        // Show notification
        const notificationEl = document.createElement('div');
        notificationEl.className = 'session-info-notification';
        notificationEl.innerHTML = `
            <div class="session-info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="session-info-text">Previous session ended: ${reason}</div>
        `;
        
        document.body.appendChild(notificationEl);
        
        // Fade out after delay
        setTimeout(() => {
            if (document.body.contains(notificationEl)) {
                notificationEl.classList.add('fade-out');
                setTimeout(() => {
                    if (document.body.contains(notificationEl)) {
                        document.body.removeChild(notificationEl);
                    }
                }, 500);
            }
        }, 4000);
        
        // Clear the flags
        localStorage.removeItem("forcedLogout");
        localStorage.removeItem("logoutReason");
    }
    
    // Set initial activity
    updateLastActivity();
    
    // Schedule session timeout
    scheduleSessionTimeout((reason) => {
        performSessionLogout(navigate, reason);
    });
    
    // User activity handler
    const handleUserActivity = (event) => {
        const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
        if (!isLoggedIn) return;
        
        // Don't extend session if the overlay is visible (except for clicks on extend button)
        if (overlayElement && 
            event.type === 'click' && 
            event.target.id !== 'session-extend-btn') {
            return;
        }
        
        // Update activity timestamp and reschedule timeout
        updateLastActivity();
        
        // Refresh the session cookie
        refreshSessionCookie(SESSION_COOKIE_NAME)
            .catch(error => console.error("Error refreshing session cookie:", error));
        
        // Reschedule the session timeout
        scheduleSessionTimeout((reason) => {
            performSessionLogout(navigate, reason);
        });
    };
    
    // Activity events to monitor
    const activityEvents = [
        'mousedown', 'mousemove', 'keydown', 
        'scroll', 'touchstart', 'click'
    ];
    
    // Attach activity listeners
    activityEvents.forEach(eventType => {
        document.addEventListener(eventType, handleUserActivity, { passive: true });
    });
    
    // Intercept navigation actions - history API
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleUserActivity({ type: 'navigation' });
    };
    
    window.history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handleUserActivity({ type: 'navigation' });
    };
    
    // Handle tab visibility
    const handleVisibilityChange = () => {
        // First check if the user is already logged out
        if (document.visibilityState === 'visible') {
            // Skip all checks if user is not logged in
            if (localStorage.getItem('loggedIn') !== 'true') {
                return;
            }
            
            // Also skip if we're on login page
            const isLoginPage = window.location.pathname === '/' || 
                               window.location.pathname === '/login' ||
                               window.location.pathname === '/index.html';
            if (isLoginPage) {
                return;
            }
            
            // Verify session on tab focus
            const lastActivity = localStorage.getItem('lastActivity');
            if (lastActivity) {
                const now = Date.now();
                const lastTime = parseInt(lastActivity, 10);
                const timeout = getSessionTimeoutDuration();
                
                if (now - lastTime >= timeout) {
                    // Session expired while tab was inactive
                    performSessionLogout(navigate, 'timeout');
                    return;
                }
            }
            
            // Session still valid, reset timer
            handleUserActivity({ type: 'visibility' });
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periodic validation of session cookie (every 5 seconds)
    const cookieCheckInterval = setInterval(() => {
        // Skip check if user is not logged in
        const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
        if (!isLoggedIn) return;
        
        // Skip check if on login page
        const isLoginPage = window.location.pathname === '/' || 
                           window.location.pathname === '/login' ||
                           window.location.pathname === '/index.html';
        if (isLoginPage) return;
        
        // Check if cookie exists
        const cookieExists = document.cookie
            .split(';')
            .some(c => c.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
            
        if (!cookieExists) {
            performSessionLogout(navigate, 'cookie_missing');
        }
    }, 5000);
    
    // Return cleanup function
    return () => {
        // Clear intervals and timeouts
        clearInterval(cookieCheckInterval);
        clearTimeout(sessionTimeoutId);
        clearTimeout(countdownId);
        
        // Remove event listeners
        activityEvents.forEach(eventType => {
            document.removeEventListener(eventType, handleUserActivity);
        });
        
        // Restore original history methods
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
        
        // Remove visibility listener
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        // Remove overlay if it exists
        removeSessionTimeoutOverlay();
    };
};
