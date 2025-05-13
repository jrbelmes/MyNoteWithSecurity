import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorize from '../components/NotAuthorize';
import { SecureStorage } from './encryption';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [showModal, setShowModal] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false);
    // Check both regular localStorage and SecureStorage for backward compatibility
    const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn');
    const userRole = SecureStorage.getSessionItem('user_level');

    useEffect(() => {
        if (allowedRoles && !allowedRoles.includes(userRole)) {
            setShowModal(true);
        }
    }, [allowedRoles, userRole]);

    const handleModalClose = () => {
        setShowModal(false);
        // Delay navigation until after modal closes
        setTimeout(() => {
            setShouldNavigate(true);
        }, 300); // 300ms delay to match modal animation
    };

    if (!isLoggedIn) {
        return <Navigate to="/gsd" replace />;
    }

    const getRedirectPath = () => {
        if (userRole === 'Super Admin' || userRole === 'Admin') return '/adminDashboard';
        if (userRole === 'Personnel') return '/personnelDashboard';
        if (userRole === 'Dean' || userRole === 'Secretary' || userRole === 'Department Head') return '7Department/Dashboard';
        if (userRole === 'Faculty/Staff' || userRole === 'School Head' || userRole === 'SBO PRESIDENT' || userRole === 'CSG PRESIDENT') return '/Faculty/Dashboard';
        return '/gsd';
    };

    if (!allowedRoles.includes(userRole)) {
        return (
            <>
                <NotAuthorize open={showModal} onClose={handleModalClose} />
                {shouldNavigate && <Navigate to={getRedirectPath()} replace />}
            </>
        );
    }

    return children;
};

export default ProtectedRoute;