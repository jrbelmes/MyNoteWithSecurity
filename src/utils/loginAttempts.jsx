export const getLoginAttempts = () => {
    return JSON.parse(localStorage.getItem('loginAttempts') || '{}');
};

export const setLoginAttempts = (attempts) => {
    localStorage.setItem('loginAttempts', JSON.stringify(attempts));
};

export const isAccountLocked = (username) => {
    const attempts = getLoginAttempts();
    const userAttempts = attempts[username];
    
    if (userAttempts?.count >= 3) {
        const lockoutEndTime = new Date(userAttempts.timestamp).getTime() + (10 * 60 * 1000);
        const currentTime = new Date().getTime();
        
        if (currentTime < lockoutEndTime) {
            return true;
        } else {
            // Reset attempts after lockout period
            attempts[username] = { count: 0, timestamp: null };
            setLoginAttempts(attempts);
            return false;
        }
    }
    return false;
};

export const incrementLoginAttempts = (username) => {
    const attempts = getLoginAttempts();
    const userAttempts = attempts[username] || { count: 0, timestamp: null };
    
    userAttempts.count = (userAttempts.count || 0) + 1;
    if (userAttempts.count >= 3) {
        userAttempts.timestamp = new Date().toISOString();
    }
    
    attempts[username] = userAttempts;
    setLoginAttempts(attempts);
    return userAttempts;
};

export const resetLoginAttempts = (username) => {
    const attempts = getLoginAttempts();
    if (attempts[username]) {
        attempts[username] = { count: 0, timestamp: null };
        setLoginAttempts(attempts);
    }
};

export const clearAllExceptLoginAttempts = () => {
    // Backup critical data
    const loginAttempts = localStorage.getItem('loginAttempts');
    const url = localStorage.getItem('url');

    // Get all current keys
    const keys = Object.keys(localStorage);
    
    // Remove everything except loginAttempts and url
    keys.forEach(key => {
        if (key !== 'loginAttempts' && key !== 'url') {
            localStorage.removeItem(key);
        }
    });

    // Ensure critical data is preserved
    if (loginAttempts) {
        localStorage.setItem('loginAttempts', loginAttempts);
    }
    if (url) {
        localStorage.setItem('url', url);
    }
};
