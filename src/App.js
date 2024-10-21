import React from 'react';
import { Route, Routes } from 'react-router-dom';
// import Sidebar from './pages/Sidebar';
// import Login from './pages/Login';
import Register from './pages/Register';
import VehicleEntry from './pages/VehicleEntry';
import Venue from './pages/Venue';
//  Dashboard from './pages/dashboard';import
import Equipment from './pages/Equipment';
import ViewRequest from './pages/viewRequest';
import ViewReservation from './pages/viewReservation';
import AddReservation from './pages/AddReservation'; // Import the AddReservation component
import { Toaster } from 'sonner';
import './App.css'; 
import Logins from './pages/logins';
import AdminDashboard from './pages/adminDashboard';
import Faculty from './pages/Faculty';
import Personnel from './pages/Personnel';
import Master from './pages/Master';
import Vehiclem from './pages/vehiclemake';
import Departments from './pages/departments';
import Vehiclec from './pages/vehiclecategory';
import Position from './pages/position';
import Equipmentc from './pages/equipmentCategory';
import Userlevel from './pages/userLevel';
import VehicleModel from './pages/vehiclemodel';
<<<<<<< HEAD
import PersonnelDashboard from './pages/PersonelDashboard';
=======
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271





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
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/vehiclemodel" element={<VehicleModel />} />
<<<<<<< HEAD
                    <Route path="/personeldashboard" element={<PersonnelDashboard />} />
=======
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
                    <Route path="/userlevel" element={<Userlevel /> } /> 
                    <Route path="/position" element={<Position />} />
                    <Route path="/equipmentCat" element={<Equipmentc />} />
                    <Route path="/vehiclemake" element={<Vehiclem />} /> 
                    <Route path="/vehicleCategory" element={<Vehiclec />} /> 
                    <Route path="/VehicleEntry" element={<VehicleEntry />} /> 
                    <Route path="/viewReservation" element={<ViewReservation />} /> 
                    <Route path="/addReservation" element={<AddReservation />} /> {/* Add new route for AddReservation */}
                    <Route path="/Venue" element={<Venue />} /> 
                    <Route path="/adminDashboard" element={<AdminDashboard />} />
                    <Route path="/Equipment" element={<Equipment />} />
                    <Route path="/Faculty" element={<Faculty />} />
                    <Route path="/Register" element={<Register />} />
                    <Route path="/viewRequest" element={<ViewRequest />} />
                    <Route path="/personel" element={<Personnel />} />
                    <Route path="/Master" element={<Master />} />
                    
                    <Route path="*" element={<div>404 Not Found</div>} /> 
                </Routes>
            </main>
        </div>
    );
};

export default App;