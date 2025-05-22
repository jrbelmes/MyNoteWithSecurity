import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorize from '../pages/NotAuthorize';
import { SecureStorage } from './encryption';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [showModal, setShowModal] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false);

    const isLoggedIn = SecureStorage.getLocalItem('isLoggedIn') === 'true' || SecureStorage.getSessionItem('isLoggedIn');
    const userRole = SecureStorage.getSessionItem('user_role');

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
        return <Navigate to="/landing-page" replace />;
    }

    const getRedirectPath = () => {
        if (userRole === 'Admin') return '/admin/dashboard';
        if (userRole === 'User') return '/user/dashboard';

        return '/landing-page';
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