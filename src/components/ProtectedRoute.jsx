import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const userRole = localStorage.getItem('user_level');
    const location = useLocation();

    // Handle not logged in users
    if (!isLoggedIn) {
        return <Navigate to="/gsd" state={{ from: location }} replace />;
    }

    // Handle logged in users trying to access login page
    if (location.pathname === '/gsd' && isLoggedIn) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'Admin') return <Navigate to="/adminDashboard" replace />;
        if (userRole === 'Dean' || userRole === 'Secretary') return <Navigate to="/deanDashboard" replace />;
        if (userRole === 'user') return <Navigate to="/dashboard" replace />;
    }

    // Check if user has required role
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'Admin') return <Navigate to="/adminDashboard" replace />;
        if (userRole === 'Dean' || userRole === 'Secretary') return <Navigate to="/deanDashboard" replace />;
        if (userRole === 'user') return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
