import React, { useState, createContext, useCallback, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css'; 
import Logins from './pages/landing_page';
import NotFound from './pages/NotFound';
import { SecureStorage } from './utils/encryption';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import AdminDashboard from './pages/admin/admin_dashboard'; 
import UserDashboard from './pages/user/user_dashboard';
import ProtectedRoute from './utils/ProtectedRoute';
import ViewNotes from './pages/user/view_note';
import Record from './pages/admin/record';

export const ThemeContext = createContext();

const App = () => {
    const defaultUrl = "http://localhost/coc/gsd/";
    const storedUrl = SecureStorage.getLocalItem("url");
    
    if (!storedUrl || storedUrl !== defaultUrl) {
        SecureStorage.setLocalItem("url", defaultUrl);
    }

    // Add state for the current theme
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
    });

    // Function to toggle the theme
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }, []);

    

    const [isNotFoundVisible, setIsNotFoundVisible] = useState(false);

    const location = useLocation();

    // Add URL validation
    useEffect(() => {
        const validPaths = [
            '/',
            '/landing-page',
            '/signin',
            '/signup',
            '/admin/dashboard',
            '/user/dashboard',
            '/user/view-notes',
            '/admin/record',
        ];
        
        // Check if any valid path matches the current pathname
        const isValidPath = validPaths.some(path => {
            // Exact match or matches the base path for nested routes
            return location.pathname === path || 
                   (path !== '/meow' && location.pathname.startsWith(path));
        });

        setIsNotFoundVisible(!isValidPath);
    }, [location]);



    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`app-container ${theme}`}>
                <Toaster richColors position='top-center' duration={1500} />
                {isNotFoundVisible && (
                    <NotFound 
                        isVisible={true}
                        onClose={() => setIsNotFoundVisible(false)} 
                    />
                )}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/landing-page" replace />} />
                        <Route path="/landing-page" element={<Logins />} />
                        <Route path="/signin" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/record" element={<ProtectedRoute allowedRoles={['Admin']}><Record /></ProtectedRoute>} />
                        
                        {/* Add more admin routes here */}
                        <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['User']}><UserDashboard /></ProtectedRoute>} />
                        <Route path="/user/view-notes" element={<ProtectedRoute allowedRoles={['User']}><ViewNotes /></ProtectedRoute>} />

                        {/* Catch-all route for 404 */}
                    
                    </Routes>
                </main>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
