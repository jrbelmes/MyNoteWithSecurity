import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const userRole = localStorage.getItem('user_level');

    if (!isLoggedIn) {
        return <Navigate to="/gsd" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on user role
        if (userRole === 'Super Admin' || userRole === 'Admin') {
            return <Navigate to="/adminDashboard" replace />;
        } else if (userRole === 'Personnel') {
            return <Navigate to="/personeldashboard" replace />;
        } else if (userRole === 'Dean') {
            return <Navigate to="/deanDashboard" replace />;
        }else if (userRole === 'Secretary') {
            return <Navigate to="/deanDashboard" replace />;

        }else if (userRole === 'user') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
