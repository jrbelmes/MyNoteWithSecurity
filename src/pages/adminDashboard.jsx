import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FaClipboardList, FaCar, FaUsers, FaBuilding, FaTools, FaUserTie } from 'react-icons/fa'; // Added FaUserTie for personnel icon

const Dashboard = () => {
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');
    const [loading, setLoading] = useState(true);
    const [fadeIn, setFadeIn] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // Dark mode state
    const [totals, setTotals] = useState({
        reservations: 0,
        vehicles: 0,
        users: 0,
        venues: 0,
        equipments: 0,
        personnel: 0 // Added personnel in state
    });

    // Read dark mode preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
    }, []);

    useEffect(() => {
        const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');

        if (adminLevel !== '100') {
            localStorage.clear(); 
            navigate('/');
        } else {
            if (!hasLoadedBefore) {
                const timeoutId = setTimeout(() => {
                    setLoading(false);
                    setFadeIn(true);
                    localStorage.setItem('hasLoadedDashboard', 'true');
                }, 2000);

                return () => clearTimeout(timeoutId);
            } else {
                setLoading(false);
                setFadeIn(true);
            }
        }
    }, [adminLevel, navigate]);

    useEffect(() => {
        if (!loading) {
            import('../dashboard.css'); 
        }
    }, [loading]);

    useEffect(() => {
        const fetchTotals = async () => {
            try {
                const response = await fetch('http://localhost/coc/gsd/get_totals.php');
                const result = await response.json();

                if (result.status === 'success') {
                    setTotals(result.data);
                } else {
                    console.error('Error fetching totals:', result.message);
                }
            } catch (error) {
                console.error('Error fetching totals:', error);
            }
        };

        fetchTotals();
    }, []);

    // Handle back navigation behavior
    useEffect(() => {
        const handlePopState = (event) => {
            if (adminLevel === '1') {
                event.preventDefault();
                navigate('/dashboard');
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
        <div className={`dashboard-container flex ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}>
            <Sidebar />
            <div className="main-content flex-1 p-8 ml-4">
                <h2 className="text-3xl font-bold mb-8">Admin Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
                    {[
                        { icon: <FaClipboardList />, title: "Total Reservations", value: totals.reservations },
                        { icon: <FaCar />, title: "Total Vehicles", value: totals.vehicles },
                        { icon: <FaUsers />, title: "Total Users", value: totals.users },
                        { icon: <FaBuilding />, title: "Total Venues", value: totals.venues },
                        { icon: <FaTools />, title: "Total Equipments", value: totals.equipments },
                        { icon: <FaUserTie />, title: "Total Personnel", value: totals.personnel }
                    ].map((item, index) => (
                        <div key={index} className={`card p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105 transform-gpu bg-gradient-to-r from-purple-500 to-blue-500 text-white`}>
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-6xl mb-4">{item.icon}</div>
                                <h3 className="text-lg font-semibold mb-2 uppercase tracking-wide">{item.title}</h3>
                                <p className="text-3xl font-bold">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
