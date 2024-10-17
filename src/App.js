import React from 'react';
import { Route, Routes } from 'react-router-dom';
// import Sidebar from './pages/Sidebar';
// import Login from './pages/Login';
import Register from './pages/Register';
import VehicleEntry from './pages/VehicleEntry';
import Venue from './pages/Venue';
// import Dashboard from './pages/dashboard';
import Equipment from './pages/Equipment';
import ViewRequest from './pages/viewRequest';
import ViewReservation from './pages/viewReservation';
import AddReservation from './pages/AddReservation'; // Import the AddReservation component
import { Toaster } from 'sonner';
import './App.css'; 
import Logins from './pages/logins';
import AdminDashboard from './pages/adminDashboard';
import Faculty from './pages/Faculty';

const App = () => {
    const defaultUrl = "http://localhost/coc/gsd/";
    if (localStorage.getItem("url") !== defaultUrl) {
        localStorage.setItem("url", defaultUrl);
    }

    return (
        <div className="app-container">
            <Toaster richColors position='top-center' duration={1500} />
            <main className="main-content">
                <Routes>
                    <Route path="/gsd" element={<Logins />} /> 
                    <Route path="/VehicleEntry" element={<VehicleEntry />} /> 
                    <Route path="/viewReservation" element={<ViewReservation />} /> 
                    <Route path="/addReservation" element={<AddReservation />} /> {/* Add new route for AddReservation */}
                    <Route path="/Venue" element={<Venue />} /> 
                    <Route path="/adminDashboard" element={<AdminDashboard />} />
                    <Route path="/Equipment" element={<Equipment />} />
                    <Route path="/Faculty" element={<Faculty />} />
                    <Route path="/Register" element={<Register />} />
                    <Route path="/viewRequest" element={<ViewRequest />} />
                    <Route path="*" element={<div>404 Not Found</div>} /> 
                </Routes>
            </main>
        </div>
    );
};

export default App;
