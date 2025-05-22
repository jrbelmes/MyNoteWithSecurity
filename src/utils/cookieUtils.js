// utils/sessionManager.js
export function initializeSessionManager(navigate, interval = 30000) {
  const checkSession = async () => {
    try {
      const response = await fetch('http://localhost/backend/user.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operation: 'check_auth' })
      });

      const result = await response.json();

      if (result.status === 'error' && result.message === 'Session expired') {
        localStorage.removeItem('loggedIn');
        alert('Session expired. Please log in again.');
        navigate('/signin');
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const intervalId = setInterval(checkSession, interval);

  // Cleanup function
  return () => clearInterval(intervalId);
}
