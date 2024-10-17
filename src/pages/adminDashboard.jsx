import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FaClipboardList, FaCar, FaUsers, FaChartBar, FaBuilding, FaTools } from 'react-icons/fa';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');
    const [loading, setLoading] = useState(true);
    const [fadeIn, setFadeIn] = useState(false);
    
    useEffect(() => {
        const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');

        // Check if the user is an admin
        if (adminLevel !== '100') {
            localStorage.clear(); // Clear local storage if not admin level 1
            navigate('/'); // Redirect to home if not admin level 1
        } else {
            if (!hasLoadedBefore) {
                // Simulate loading delay
                const timeoutId = setTimeout(() => {
                    setLoading(false);
                    setFadeIn(true);
                    localStorage.setItem('hasLoadedDashboard', 'true'); // Set flag to indicate it has loaded
                }, 2000);

                return () => clearTimeout(timeoutId); // Cleanup timeout on unmount
            } else {
                setLoading(false); // Directly set loading to false if it has loaded before
                setFadeIn(true); // Trigger fade-in effect
            }
        }
    }, [adminLevel, navigate]);

    useEffect(() => {
        if (!loading) {
            import('../dashboard.css'); // Import CSS only after loading
        }
    }, [loading]);

    // Handle back navigation behavior
    useEffect(() => {
        const handlePopState = (event) => {
            if (adminLevel === '1') {
                event.preventDefault(); // Prevent default back behavior
                navigate('/adminDashboard'); // Navigate back to dashboard
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate, adminLevel]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="animate-pulse flex flex-col items-center gap-4 w-60">
                    <div>
                        <div className="w-48 h-6 bg-slate-400 rounded-md"></div>
                        <div className="w-28 h-4 bg-slate-400 mx-auto mt-3 rounded-md"></div>
                    </div>
                    <div className="h-7 bg-slate-400 w-full rounded-md"></div>
                    <div className="h-7 bg-slate-400 w-full rounded-md"></div>
                    <div className="h-7 bg-slate-400 w-full rounded-md"></div>
                    <div className="h-7 bg-slate-400 w-1/2 rounded-md"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`dashboard-container flex ${fadeIn ? 'fade-in' : ''}`}>
            <Sidebar />
            <div className="main-content flex-1 p-8 ml-4">
                <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
                
                <div className="flex flex-wrap gap-14">
                    {[
                        { icon: <FaClipboardList />, title: "Total Reservations", value: 120 },
                        { icon: <FaCar />, title: "Total Vehicles", value: 45 },
                        { icon: <FaUsers />, title: "Total Users", value: 300 },
                        { icon: <FaBuilding />, title: "Total Venues", value: 10 },
                        { icon: <FaTools />, title: "Total Equipments", value: 150 }
                    ].map((item, index) => (
                        <div key={index} className="card mx-2 my-4 w-48 h-64 bg-gray-300 bg-opacity-50 border border-white shadow-lg backdrop-blur-md rounded-lg flex flex-col items-center justify-center cursor-pointer transition-transform duration-500 hover:border-black hover:scale-105 active:scale-95 active:rotate-[1.7deg]">
                            {item.icon}
                            <h3>{item.title}</h3>
                            <p>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
