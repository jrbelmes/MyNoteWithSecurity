import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FaClipboardList, FaCar, FaUsers, FaBuilding, FaTools, FaUserTie, FaEye, FaCheckCircle, FaBell, FaPlus, FaSearch, FaCog, FaUserCog, FaUserCircle, FaSun, FaMoon } from 'react-icons/fa';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend);

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    
    let dateString;
    
    if (dateInput instanceof Date) {
        return dateInput.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    if (typeof dateInput !== 'string') {
        dateString = String(dateInput);
    } else {
        dateString = dateInput;
    }
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        const date = new Date(year, month - 1, day);  
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
    
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    return 'Invalid Date';
};

const Dashboard = () => {
    const navigate = useNavigate();
    const user_level = localStorage.getItem('user_level');
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
    const [chartData, setChartData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [reservationChartData, setReservationChartData] = useState(null);
    const [totalReservationsData, setTotalReservationsData] = useState(null);
    const [userActivityData, setUserActivityData] = useState(null);
    const [venues, setVenues] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [recentReservations, setRecentReservations] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [releaseFacilities, setReleaseFacilities] = useState([]);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [personnel, setPersonnel] = useState([]);
    const [ongoingReservations, setOngoingReservations] = useState([]);

    // Read dark mode preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
    }, []);

    useEffect(() => {
        const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');

        if (user_level !== '100') {
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
    }, [user_level, navigate]);

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

    

    

    const fetchVenues = useCallback(async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVenue" }));
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while fetching venues.");
        }
    }, []);

    const fetchVehicles = useCallback(async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVehicles" }));
            if (response.data.status === 'success') {
                setVehicles(response.data.data);
            } else {
                toast.error("Error fetching vehicles: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while fetching vehicles.");
        }
    }, []);

    const fetchEquipment = useCallback(async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchEquipments" }));
            if (response.data.status === 'success') {
                setEquipment(response.data.data);
            } else {
                toast.error("Error fetching equipment: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while fetching equipment.");
        }
    }, []);

    const fetchReservations = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'fetchAllReservations',
            });

            if (response.data && response.data.status === 'success') {
                // Sort reservations by date_created in descending order and take the first 5
                const sortedReservations = response.data.data
                    .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
                    .slice(0, 5);
                setRecentReservations(sortedReservations);

                // Filter ongoing reservations
                const currentDate = new Date();
                const ongoing = response.data.data.filter(reservation => {
                    const startDate = new Date(reservation.reservation_start_date);
                    const endDate = new Date(reservation.reservation_end_date);
                    return startDate <= currentDate && currentDate <= endDate;
                });
                setOngoingReservations(ongoing);
            } else {
                toast.error('No reservations found.');
            }
        } catch (error) {
            toast.error('Error fetching reservations.');
        }
    }, []);

    const fetchReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'getReservationDetailsById',
                reservation_id: reservationId,
            });

            if (response.data && response.data.status === 'success') {
                setSelectedReservation(response.data.data);
                setModalOpen(true);
            } else {
                toast.error('Error fetching reservation details.');
            }
        } catch (error) {
            toast.error('Error fetching reservation details.');
        }
    };

    const fetchReleaseFacilities = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'fetchReleaseFacilities'
            });

            if (response.data && response.data.status === 'success') {
                console.log('Release Facilities Data:', response.data.data);
                setReleaseFacilities(response.data.data);
            } else {
                toast.error('Error fetching release facilities: ' + response.data.message);
            }
        } catch (error) {
            toast.error('An error occurred while fetching release facilities.');
            console.error('Fetch release facilities error:', error);
        }
    }, []);

    const fetchPersonnel = async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                new URLSearchParams({ operation: "fetchPersonnelActive" }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                setPersonnel(response.data.data);
            } else {
                toast.error("Error fetching personnel: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching personnel.");
        }
    };

    useEffect(() => {
        if (!loading) {
            fetchVenues();
            fetchVehicles();
            fetchEquipment();
            fetchReservations();
            fetchReleaseFacilities();
            fetchPersonnel(); // Add this line
        }
    }, [loading, fetchVenues, fetchVehicles, fetchEquipment, fetchReservations, fetchReleaseFacilities]);

    // Handle back navigation behavior
    useEffect(() => {
        const handlePopState = (event) => {
            if (user_level === '100') {
                event.preventDefault();
                navigate('/dashboard');
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate, user_level]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const chartVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'reserve':
                return 'bg-green-100 text-green-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Update the card colors to use green shades
    const cardColors = [
        "from-green-400 to-green-600",
        "from-emerald-400 to-emerald-600",
        "from-teal-400 to-teal-600",
        "from-green-500 to-green-700",
        "from-emerald-500 to-emerald-700",
        "from-teal-500 to-teal-700"
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                when: "beforeChildren",
                staggerChildren: 0.1,
                duration: 0.5
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    const svgVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: { 
            pathLength: 1, 
            opacity: 1,
            transition: { duration: 2, ease: "easeInOut" }
        }
    };

    const handleRelease = useCallback(async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/release_facility.php', {
                operation: 'releaseFacility',
                reservation_id: reservationId
            });

            if (response.data && response.data.status === 'success') {
                toast.success('Facility released successfully');
                // Refresh the release facilities list
                fetchReleaseFacilities();
            } else {
                toast.error('Error releasing facility: ' + response.data.message);
            }
        } catch (error) {
            toast.error('An error occurred while releasing the facility');
            console.error('Release facility error:', error);
        }
    }, [fetchReleaseFacilities]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <motion.svg 
                    width="100" 
                    height="100" 
                    viewBox="0 0 100 100"
                    initial="hidden"
                    animate="visible"
                >
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="#10B981"
                        strokeWidth="10"
                        fill="none"
                        variants={svgVariants}
                    />
                    <motion.path
                        d="M25 50 L40 65 L75 30"
                        stroke="#10B981"
                        strokeWidth="10"
                        fill="none"
                        variants={svgVariants}
                    />
                </motion.svg>
            </div>
        );
    }

    return (
        <motion.div 
            className={`dashboard-container flex h-screen ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Sidebar />
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <header className="bg-white shadow-md p-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-green-800">Admin Dashboard</h1>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setShowQuickActions(!showQuickActions)} className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors">
                                    Quick Actions
                                </button>
                                <button onClick={() => setDarkMode(!darkMode)} className="text-gray-600 hover:text-gray-800">
                                    {darkMode ? <FaSun /> : <FaMoon />}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Main content area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                        {/* Quick Actions Dropdown */}
                        <AnimatePresence>
                            {showQuickActions && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white rounded-lg shadow-lg p-4 mb-6 border border-green-200"
                                >
                                    <h3 className="text-xl font-semibold mb-4 text-green-800">Quick Actions</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <button className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-2 px-4 rounded flex items-center justify-center">
                                            <FaPlus className="mr-2" /> Add Reservation
                                        </button>
                                        <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded flex items-center justify-center">
                                            <FaSearch className="mr-2" /> Search Users
                                        </button>
                                        <button className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-2 px-4 rounded flex items-center justify-center">
                                            <FaCar className="mr-2" /> Manage Vehicles
                                        </button>
                                        <button className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-2 px-4 rounded flex items-center justify-center">
                                            <FaBuilding className="mr-2" /> Manage Venues
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Dashboard Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Summary Cards */}
                            <motion.div 
                                className="col-span-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                                variants={itemVariants}
                            >
                                {[
                                    { icon: <FaClipboardList />, title: "Reservations", value: totals.reservations },
                                    { icon: <FaCar />, title: "Vehicles", value: totals.vehicles },
                                    { icon: <FaUsers />, title: "Users", value: totals.users },
                                    { icon: <FaBuilding />, title: "Venues", value: totals.venues },
                                    { icon: <FaTools />, title: "Equipments", value: totals.equipments },
                                    { icon: <FaUserTie />, title: "Personnel", value: totals.personnel }
                                ].map((item, index) => (
                                    <motion.div 
                                        key={index} 
                                        className={`bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-200`}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div 
                                            className="text-3xl mb-2 text-green-500"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                        >
                                            {item.icon}
                                        </motion.div>
                                        <p className="text-sm font-medium mb-1 text-gray-600">{item.title}</p>
                                        <motion.p 
                                            className="text-xl font-bold text-gray-800"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            {item.value}
                                        </motion.p>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Main Content Column */}
                            <div className="col-span-full lg:col-span-3 space-y-6">
                                {/* Recent Reservations */}
                                <motion.div 
                                    className="bg-white rounded-lg shadow-md p-6"
                                    variants={itemVariants}
                                >
                                    <h3 className="text-xl font-semibold mb-4 text-green-800">Recent Reservations</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Name</th>
                                                    <th className="px-4 py-2 text-left">Event Title</th>
                                                    <th className="px-4 py-2 text-left">Created</th>
                                                    <th className="px-4 py-2 text-left">Status</th>
                                                    <th className="px-4 py-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentReservations.map((reservation) => (
                                                    <tr key={reservation.reservation_id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{reservation.reservation_name}</td>
                                                        <td className="px-4 py-2">{reservation.reservation_event_title}</td>
                                                        <td className="px-4 py-2">{formatDate(new Date(reservation.date_created))}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(reservation.reservation_status_name)}`}>
                                                                {reservation.reservation_status_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <button 
                                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                                                onClick={() => fetchReservationDetails(reservation.reservation_id)}
                                                            >
                                                                <FaEye />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>

                                {/* Today's Facility Releases */}
                                <motion.div 
                                    className="bg-white rounded-lg shadow-md p-6"
                                    variants={itemVariants}
                                >
                                    <h3 className="text-xl font-semibold mb-4 text-green-800">Today's Facility Releases</h3>
                                    <div className="overflow-y-auto max-h-[300px]">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Facility</th>
                                                    <th className="px-4 py-2 text-left">Event</th>
                                                    <th className="px-4 py-2 text-left">Time</th>
                                                    <th className="px-4 py-2 text-left">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {releaseFacilities.map((facility, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{facility.facility_name}</td>
                                                        <td className="px-4 py-2">{facility.event_title}</td>
                                                        <td className="px-4 py-2">{facility.release_time}</td>
                                                        <td className="px-4 py-2">
                                                            <button 
                                                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                                                                onClick={() => handleRelease(facility.reservation_id)}
                                                            >
                                                                Release
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>

                                {/* Ongoing Reservations */}
                                <motion.div 
                                    className="bg-white rounded-lg shadow-md p-6"
                                    variants={itemVariants}
                                >
                                    <h3 className="text-xl font-semibold mb-4 text-green-800">Ongoing Reservations</h3>
                                    <div className="overflow-y-auto max-h-[300px]">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Event</th>
                                                    <th className="px-4 py-2 text-left">Facility</th>
                                                    <th className="px-4 py-2 text-left">Start</th>
                                                    <th className="px-4 py-2 text-left">End</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ongoingReservations.map((reservation, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{reservation.reservation_event_title}</td>
                                                        <td className="px-4 py-2">{reservation.facility_name}</td>
                                                        <td className="px-4 py-2">{formatDate(reservation.reservation_start_date)}</td>
                                                        <td className="px-4 py-2">{formatDate(reservation.reservation_end_date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Active Personnel Panel */}
                            <motion.div 
                                className="col-span-full lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-full"
                                variants={itemVariants}
                            >
                                <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center">
                                    <FaUserCircle className="mr-2" /> Active Personnel
                                </h3>
                                <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                                    <ul className="space-y-2">
                                        {personnel.map((person, index) => (
                                            <li key={index} className="flex items-center bg-gray-50 p-2 rounded">
                                                <FaUserCircle className="text-green-500 mr-2" />
                                                <div>
                                                    <p className="font-medium">{`${person.jo_personel_fname} ${person.jo_personel_lname}`}</p>
                                                    <p className="text-sm text-gray-600">{person.position_name}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Reservation Details */}
            <AnimatePresence>
                {modalOpen && selectedReservation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg p-6 max-w-lg w-full"
                        >
                            <h3 className="text-2xl font-bold mb-4 text-gray-800">Reservation Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="font-medium text-gray-600">Reservation Name:</p>
                                    <p>{selectedReservation.reservation.reservation_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Status:</p>
                                    <p className={`px-2 py-1 rounded-full text-xs inline-block ${getStatusClass(selectedReservation.reservation.reservation_status_name)}`}>
                                        {selectedReservation.reservation.status_master_name}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Event Title:</p>
                                    <p>{selectedReservation.reservation.reservation_event_title}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Description:</p>
                                    <p>{selectedReservation.reservation.reservation_description}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Start:</p>
                                    <p>{formatDate(selectedReservation.reservation.reservation_start_date)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">End:</p>
                                    <p>{formatDate(selectedReservation.reservation.reservation_end_date)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Created:</p>
                                    <p>{formatDate(selectedReservation.reservation.date_created)}</p>
                                </div>
                            </div>

                            {/* Display vehicle, equipment, and venue information */}
                            {selectedReservation.equipment && selectedReservation.equipment.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-700">Equipment Used:</h4>
                                    <ul className="list-disc list-inside">
                                        {selectedReservation.equipment.map((equip) => (
                                            <li key={equip.equip_name} className="text-sm">{equip.equip_name} (Quantity: {equip.quantity})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {selectedReservation.vehicles && selectedReservation.vehicles.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-700">Vehicles Used:</h4>
                                    <ul className="list-disc list-inside">
                                        {selectedReservation.vehicles.map((vehicle) => (
                                            <li key={vehicle.vehicle_license} className="text-sm">{vehicle.vehicle_license} </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {selectedReservation.venues && selectedReservation.venues.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-700">Venues Used:</h4>
                                    <ul className="list-disc list-inside">
                                        {selectedReservation.venues.map((venue) => (
                                            <li key={venue.ven_name} className="text-sm">{venue.ven_name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <button className="mt-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors" onClick={() => setModalOpen(false)}>Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Dashboard;
