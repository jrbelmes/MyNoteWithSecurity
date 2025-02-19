import React, { useState, createContext, useCallback } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
// import Sidebar from './pages/Sidebar';
// import Login from './pages/Login';
import Register from './pages/Register';
import VehicleEntry from './pages/VehicleEntry';
import Venue from './pages/Venue';
import  Dashboard from './page_user/dashboard';
import Equipment from './pages/Equipment';
import ViewRequest from './pages/viewRequest';
import Reports from './pages/Reports';
import AddReservation from './page_user/AddReservation'; // Import the AddReservation component
import { Toaster } from 'sonner';
import './App.css'; 
import Logins from './pages/logins';
import AdminDashboard from './pages/adminDashboard';
import Faculty from './pages/Faculty';  // Updated casing to match file name
import Master from './pages/Master';
import Vehiclem from './pages/vehiclemake';
import Departments from './pages/departments';
import Vehiclec from './pages/vehiclecategory';
import Position from './pages/position';
import Equipmentc from './pages/equipmentCategory';
import Userlevel from './pages/condition';
import VehicleModel from './pages/vehiclemodel';
import PersonnelDashboard from './pages/PersonelDashboard';
import ReleaseAndReturn from './pages/release&return';
import ViewReserve from './page_user/viewReserve';
import Calendar from './pages/calendar';
import Calendars from './pages/landCalendar';
import Pofiles from './pages/profile';
import Settings from './pages/Settings';
import Record from './pages/Record';
import Admin from './pages/Admin';
import ViewApproval from './page_dean/viewApproval';
import UsersProfile from './page_user/component/user_profile';
import UsersSidebar from './page_user/component/user_sidebar';
import UsersDashboard from './page_user/dashboard';
import DeanProfile from './page_dean/component/dean_profile';
import DeanSidebar from './page_dean/component/dean_sidebar';
import DeanViewReserve from './page_dean/viewReserve';
import DeanAddReservation from './page_dean/AddReservation';
import DeanDashboard from './page_dean/dashboard';
import Chat from './components/chat';
import ProtectedRoute from './components/ProtectedRoute';

// Create a new context for the theme
export const ThemeContext = createContext();

const App = () => {
    const defaultUrl = "http://localhost/coc/gsd/";
    if (localStorage.getItem("url") !== defaultUrl) {
        localStorage.setItem("url", defaultUrl);
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

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`app-container ${theme}`}>
                <Toaster richColors position='top-center' duration={1500} />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/gsd" replace />} />
                        <Route path="/gsd" element={<Logins />} />
                        
                        {/* Admin Routes */}
                        <Route path="/Admin" element={<ProtectedRoute allowedRoles={['Admin']}><Admin /></ProtectedRoute>} />
                        <Route path="/adminDashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/VehicleEntry" element={<ProtectedRoute allowedRoles={['Admin']}><VehicleEntry /></ProtectedRoute>} />
                        <Route path="/Equipment" element={<ProtectedRoute allowedRoles={['Admin']}><Equipment /></ProtectedRoute>} />
                        <Route path="/Faculty" element={<ProtectedRoute allowedRoles={['Admin']}><Faculty /></ProtectedRoute>} />
                        <Route path="/departments" element={<ProtectedRoute allowedRoles={['Admin']}><Departments /></ProtectedRoute>} />
                        <Route path="/master" element={<ProtectedRoute allowedRoles={['Admin']}><Master /></ProtectedRoute>} />
                        <Route path="/vehiclemake" element={<ProtectedRoute allowedRoles={['Admin']}><Vehiclem /></ProtectedRoute>} />
                        <Route path="/vehiclecategory" element={<ProtectedRoute allowedRoles={['Admin']}><Vehiclec /></ProtectedRoute>} />
                        <Route path="/position" element={<ProtectedRoute allowedRoles={['Admin']}><Position /></ProtectedRoute>} />
                        <Route path="/equipmentCategory" element={<ProtectedRoute allowedRoles={['Admin']}><Equipmentc /></ProtectedRoute>} />
                        <Route path="/condition" element={<ProtectedRoute allowedRoles={['Admin']}><Userlevel /></ProtectedRoute>} />
                        <Route path="/vehiclemodel" element={<ProtectedRoute allowedRoles={['Admin']}><VehicleModel /></ProtectedRoute>} />
                        <Route path="/personelDashboard" element={<ProtectedRoute allowedRoles={['Admin']}><PersonnelDashboard /></ProtectedRoute>} />
                        <Route path="/release&return" element={<ProtectedRoute allowedRoles={['Admin']}><ReleaseAndReturn /></ProtectedRoute>} />
                        <Route path="/record" element={<ProtectedRoute allowedRoles={['Admin']}><Record /></ProtectedRoute>} />
                        <Route path="/ViewRequest" element={<ProtectedRoute allowedRoles={['Admin']}><ViewRequest /></ProtectedRoute>} />
                        <Route path="/Reports" element={<ProtectedRoute allowedRoles={['Admin']}><Reports /></ProtectedRoute>} />
                        <Route path="/Venue" element={<ProtectedRoute allowedRoles={['Admin']}><Venue /></ProtectedRoute>} />
                        <Route path="/equipmentCat" element={<ProtectedRoute allowedRoles={['Admin']}><Equipmentc /></ProtectedRoute>} />
                        
                        {/* Dean/Secretary Routes */}
                        <Route path="/deanDashboard" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary']}><DeanDashboard /></ProtectedRoute>} />
                        <Route path="/deanViewReserve" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary']}><DeanViewReserve /></ProtectedRoute>} />
                        <Route path="/deanAddReservation" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary']}><DeanAddReservation /></ProtectedRoute>} />
                        <Route path="/viewApproval" element={<ProtectedRoute allowedRoles={['Dean', 'Secretary']}><ViewApproval /></ProtectedRoute>} />
                        
                        {/* User Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><Dashboard /></ProtectedRoute>} />
                        <Route path="/viewReserve" element={<ProtectedRoute allowedRoles={['user']}><ViewReserve /></ProtectedRoute>} />
                        <Route path="/addReservation" element={<ProtectedRoute allowedRoles={['user']}><AddReservation /></ProtectedRoute>} />
                        
                        {/* Shared Routes (accessible by all authenticated users) */}
                        <Route path="/profile1" element={<ProtectedRoute allowedRoles={['Admin', 'Dean', 'Secretary', 'user']}><Pofiles /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute allowedRoles={['Admin', 'Dean', 'Secretary', 'user']}><Settings /></ProtectedRoute>} />
                        <Route path="/calendar" element={<ProtectedRoute allowedRoles={['Admin', 'Dean', 'Secretary', 'user']}><Calendar /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute allowedRoles={['Admin', 'Dean', 'Secretary', 'user']}><Chat /></ProtectedRoute>} />
                        
                        <Route path="*" element={<div>404 Not Found</div>} />
                    </Routes>
                </main>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
