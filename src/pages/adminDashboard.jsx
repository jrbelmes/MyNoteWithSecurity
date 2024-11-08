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
    const [returnFacilities, setReturnFacilities] = useState([]);
    const [selectedReturnReservation, setSelectedReturnReservation] = useState(null);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [conditions, setConditions] = useState([]);
    const [itemConditions, setItemConditions] = useState({});
    const [selectedRecentReservation, setSelectedRecentReservation] = useState(null);
    const [selectedReleaseReservation, setSelectedReleaseReservation] = useState(null);
    const [recentReservationModalOpen, setRecentReservationModalOpen] = useState(false);
    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [returnConfirmation, setReturnConfirmation] = useState({ show: false, success: false, message: '' });
    const [releaseConfirmation, setReleaseConfirmation] = useState({ show: false, success: false, message: '' });

    // Read dark mode preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
    }, []);

    useEffect(() => {
        const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
        const user_id = localStorage.getItem('user_id');

        if (user_id !== '1' && user_id !== '4') { // Assuming '1' is the Super Admin ID
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
    }, [navigate]);

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

    const fetchReturnFacilities = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'fetchReturnFacilities'
            });

            if (response.data && response.data.status === 'success') {
                console.log('Return Facilities Data:', response.data.data);
                setReturnFacilities(response.data.data);
            } else {
                toast.error('Error fetching return facilities: ' + response.data.message);
            }
        } catch (error) {
            toast.error('An error occurred while fetching return facilities.');
            console.error('Fetch return facilities error:', error);
        }
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchVenues();
            fetchVehicles();
            fetchEquipment();
            fetchReservations();
            fetchReleaseFacilities();
            fetchPersonnel(); // Add this line
            fetchReturnFacilities();
        }
    }, [loading, fetchVenues, fetchVehicles, fetchEquipment, fetchReservations, fetchReleaseFacilities, fetchReturnFacilities]);

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

    useEffect(() => {
        fetchConditions();
    }, []);

    const fetchConditions = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'fetchConditions'
            });
            if (response.data.status === 'success') {
                setConditions(response.data.data);
            } else {
                toast.error('Error fetching conditions');
            }
        } catch (error) {
            console.error('Error fetching conditions:', error);
            toast.error('Error fetching conditions');
        }
    };

    const handleConditionChange = (itemType, itemId, conditionId) => {
        setItemConditions(prev => ({
            ...prev,
            [`${itemType}_${itemId}`]: conditionId
        }));
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const chartVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
    };

    const getStatusClass = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800'; // Default style if status is undefined
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'reserve':
                return 'bg-green-100 text-green-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            case 'released':
                return 'bg-blue-100 text-blue-800';
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
            const adminId = localStorage.getItem('user_id');
            if (!adminId) {
                setReleaseConfirmation({
                    show: true,
                    success: false,
                    message: 'Admin ID not found. Please log in again.'
                });
                return;
            }

            setLoading(true);

            const payload = {
                operation: "insertRelease",
                reservationId: reservationId,
                adminId: adminId
            };

            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', payload);

            if (response.data && response.data.status === 'success') {
                setReleaseConfirmation({
                    show: true,
                    success: true,
                    message: response.data.message || 'Facility released successfully'
                });
                
                // Update local state
                setReleaseFacilities(prevFacilities => 
                    prevFacilities.filter(facility => facility.reservation_id !== reservationId)
                );

                // Close modal after successful release
                setReleaseModalOpen(false);
                setSelectedReleaseReservation(null);
            } else {
                setReleaseConfirmation({
                    show: true,
                    success: false,
                    message: response.data.message || 'Error releasing facility. Please try again.'
                });
            }
        } catch (error) {
            console.error('Release facility error:', error);
            setReleaseConfirmation({
                show: true,
                success: false,
                message: 'An error occurred while processing your request.'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleReturn = async (reservationId) => {
        try {
            const adminId = localStorage.getItem('user_id');
            if (!adminId) {
                setReturnConfirmation({
                    show: true,
                    success: false,
                    message: 'Admin ID not found. Please log in again.'
                });
                return;
            }

            setLoading(true);

            // Prepare the conditions object
            const conditions = {
                equipment: {},
                vehicle: {},
                ven: {}
            };

            // Populate the conditions object based on itemConditions state
            Object.entries(itemConditions).forEach(([key, value]) => {
                const [type, id] = key.split('_');
                if (type === 'venue') {
                    conditions.ven[id] = parseInt(value);
                } else if (type === 'vehicle') {
                    conditions.vehicle[id] = parseInt(value);
                } else if (type === 'equipment') {
                    conditions.equipment[id] = parseInt(value);
                }
            });

            // Check if all items have a condition selected
            const allItemsHaveCondition = selectedReturnReservation.venues.every(venue => conditions.ven[venue.ven_id]) &&
                selectedReturnReservation.vehicles.every(vehicle => conditions.vehicle[vehicle.vehicle_id]) &&
                selectedReturnReservation.equipment.every(equip => conditions.equipment[equip.equip_id]);

            if (!allItemsHaveCondition) {
                setReturnConfirmation({
                    show: true,
                    success: false,
                    message: 'Please select a condition for all items before returning.'
                });
                setLoading(false);
                return;
            }

            const payload = {
                operation: "insertReturn",
                reservationId: parseInt(reservationId),
                adminId: parseInt(adminId),
                conditions: conditions
            };

            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', payload);

            if (response.data && response.data.status === 'success') {
                setReturnConfirmation({
                    show: true,
                    success: true,
                    message: response.data.message || 'Facility returned successfully'
                });
                
                // Update local state
                setReturnFacilities(prevFacilities => 
                    prevFacilities.filter(facility => facility.reservation_id !== reservationId)
                );

                setReturnModalOpen(false);
                setSelectedReturnReservation(null);
                setItemConditions({});
            } else {
                setReturnConfirmation({
                    show: true,
                    success: false,
                    message: response.data.message || 'Error returning facility. Please try again.'
                });
            }
        } catch (error) {
            console.error('Return facility error:', error);
            let errorMessage = 'An error occurred while processing your request.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            setReturnConfirmation({
                show: true,
                success: false,
                message: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'getReservationDetailsById',
                reservation_id: reservationId,
            });

            if (response.data && response.data.status === 'success') {
                setSelectedRecentReservation(response.data.data);
                setRecentReservationModalOpen(true);
            } else {
                toast.error('Error fetching recent reservation details.');
            }
        } catch (error) {
            toast.error('Error fetching recent reservation details.');
        }
    };

    const fetchReleaseReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'getReservationDetailsById',
                reservation_id: reservationId,
            });

            if (response.data && response.data.status === 'success') {
                setSelectedReleaseReservation(response.data.data);
                setReleaseModalOpen(true);
            } else {
                toast.error('Error fetching release reservation details.');
            }
        } catch (error) {
            toast.error('Error fetching release reservation details.');
        }
    };

    const fetchReturnReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'getReservationDetailsById',
                reservation_id: reservationId,
            });

            if (response.data && response.data.status === 'success') {
                setSelectedReturnReservation(response.data.data);
                setReturnModalOpen(true);
            } else {
                toast.error('Error fetching return reservation details.');
            }
        } catch (error) {
            toast.error('Error fetching return reservation details.');
        }
    };

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
            <div className="flex-1 overflow-hidden bg-gradient-to-br from-white to-green-100">
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
                    <div className="flex-1 overflow-y-auto p-6">
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
                                                                onClick={() => fetchRecentReservationDetails(reservation.reservation_id)}
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
                                    {releaseFacilities.length > 0 ? (
                                        <div className="overflow-y-auto max-h-[300px]">
                                            <table className="min-w-full">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Reservation Name</th>
                                                        <th className="px-4 py-2 text-left">Event Title</th>
                                                        <th className="px-4 py-2 text-left">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {releaseFacilities.map((facility) => (
                                                        <tr key={facility.reservation_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2">{facility.reservation_name}</td>
                                                            <td className="px-4 py-2">{facility.reservation_event_title}</td>
                                                            <td className="px-4 py-2">
                                                                <button 
                                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                                                    onClick={() => fetchReleaseReservationDetails(facility.reservation_id)}
                                                                >
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 italic">No records for today</p>
                                    )}
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
                                                    <th className="px-4 py-2 text-left">Start Date</th>
                                                    <th className="px-4 py-2 text-left">End Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ongoingReservations.map((reservation, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{reservation.reservation_event_title}</td>
                                                        <td className="px-4 py-2">{formatDate(reservation.reservation_start_date)}</td>
                                                        <td className="px-4 py-2">{formatDate(reservation.reservation_end_date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>

                                {/* Facilities to Return */}
                                <motion.div 
                                    className="bg-white rounded-lg shadow-md p-6"
                                    variants={itemVariants}
                                >
                                    <h3 className="text-xl font-semibold mb-4 text-green-800">Facilities to Return</h3>
                                    {returnFacilities.length > 0 ? (
                                        <div className="overflow-y-auto max-h-[300px]">
                                            <table className="min-w-full">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Reservation Name</th>
                                                        <th className="px-4 py-2 text-left">Event Title</th>
                                                        <th className="px-4 py-2 text-left">End Date</th>
                                                        <th className="px-4 py-2 text-left">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {returnFacilities.map((facility) => (
                                                        <tr key={facility.reservation_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2">{facility.reservation_name}</td>
                                                            <td className="px-4 py-2">{facility.reservation_event_title}</td>
                                                            <td className="px-4 py-2">{formatDate(facility.reservation_end_date)}</td>
                                                            <td className="px-4 py-2">
                                                                <button 
                                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                                                    onClick={() => fetchReturnReservationDetails(facility.reservation_id)}
                                                                >
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 italic">No records for today</p>
                                    )}
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
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-3xl font-bold mb-6 text-green-800 border-b-2 border-green-500 pb-2">Reservation Details</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="font-medium text-gray-600">Name:</p>
                                    <p className="text-lg">{selectedReservation.reservation?.reservation_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Status:</p>
                                    <p className={`px-3 py-1 rounded-full text-sm inline-block ${getStatusClass(selectedReservation.reservation?.status_master_name)}`}>
                                        {selectedReservation.reservation?.status_master_name}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Event Title:</p>
                                    <p className="text-lg">{selectedReservation.reservation?.reservation_event_title}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Description:</p>
                                    <p className="text-sm">{selectedReservation.reservation?.reservation_description}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Start:</p>
                                    <p>{formatDate(selectedReservation.reservation?.reservation_start_date)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">End:</p>
                                    <p>{formatDate(selectedReservation.reservation?.reservation_end_date)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Created:</p>
                                    <p>{formatDate(selectedReservation.reservation?.date_created)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Requested By:</p>
                                    <p className="text-lg">{selectedReservation.reservation?.requested_by}</p>
                                </div>
                            </div>

                            {/* Vehicles */}
                            {selectedReservation.vehicles && selectedReservation.vehicles.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Vehicles Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedReservation.vehicles.map((vehicle) => (
                                            <li key={vehicle.vehicle_license} className="text-sm mb-2">
                                                {vehicle.vehicle_license} (ID: {vehicle.vehicle_reservation_vehicle_id})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Equipment */}
                            {selectedReservation.equipment && selectedReservation.equipment.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Equipment Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedReservation.equipment.map((equip) => (
                                            <li key={equip.equip_name} className="text-sm mb-2">
                                                {equip.equip_name} (Quantity: {equip.quantity})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Venues */}
                            {selectedReservation.venues && selectedReservation.venues.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Venues Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedReservation.venues.map((venue) => (
                                            <li key={venue.ven_name} className="text-sm mb-2">
                                                {venue.ven_name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end space-x-4">
                                {selectedReservation.reservation?.reservation_status_name === 'reserve' && (
                                    <button 
                                        className={`bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => handleRelease(selectedReservation.reservation.reservation_id)}
                                        disabled={loading}
                                    >
                                        {loading ? 'Releasing...' : 'Release'}
                                    </button>
                                )}
                                <button 
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                                    onClick={() => {
                                        setModalOpen(false);
                                        setSelectedReservation(null);
                                    }}
                                    disabled={loading}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal for Recent Reservation Details */}
            <AnimatePresence>
                {recentReservationModalOpen && selectedRecentReservation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-3xl font-bold mb-6 text-green-800 border-b-2 border-green-500 pb-2">Recent Reservation Details</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="font-medium text-gray-600">Name:</p>
                                    <p className="text-lg">{selectedRecentReservation.reservation?.reservation_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Status:</p>
                                    <p className={`px-3 py-1 rounded-full text-sm inline-block ${getStatusClass(selectedRecentReservation.reservation?.status_master_name)}`}>
                                        {selectedRecentReservation.reservation?.status_master_name}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Event Title:</p>
                                    <p className="text-lg">{selectedRecentReservation.reservation?.reservation_event_title}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Description:</p>
                                    <p className="text-sm">{selectedRecentReservation.reservation?.reservation_description}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Start:</p>
                                    <p>{formatDate(selectedRecentReservation.reservation?.reservation_start_date)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">End:</p>
                                    <p>{formatDate(selectedRecentReservation.reservation?.reservation_end_date)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Created:</p>
                                    <p>{formatDate(selectedRecentReservation.reservation?.date_created)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Requested By:</p>
                                    <p className="text-lg">{selectedRecentReservation.reservation?.users_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Contact Number:</p>
                                    <p className="text-lg">{selectedRecentReservation.reservation?.users_contact_number}</p>
                                </div>
                            </div>

                            {/* Vehicles */}
                            {selectedRecentReservation.vehicles && selectedRecentReservation.vehicles.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Vehicles Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedRecentReservation.vehicles.map((vehicle) => (
                                            <li key={vehicle.vehicle_license} className="text-sm mb-2">
                                                {vehicle.vehicle_license} (ID: {vehicle.vehicle_reservation_vehicle_id})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Equipment */}
                            {selectedRecentReservation.equipment && selectedRecentReservation.equipment.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Equipment Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedRecentReservation.equipment.map((equip) => (
                                            <li key={equip.equip_name} className="text-sm mb-2">
                                                {equip.equip_name} (Quantity: {equip.quantity})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Venues */}
                            {selectedRecentReservation.venues && selectedRecentReservation.venues.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Venues Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedRecentReservation.venues.map((venue) => (
                                            <li key={venue.ven_name} className="text-sm mb-2">
                                                {venue.ven_name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end space-x-4">
                                <button 
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                                    onClick={() => {
                                        setRecentReservationModalOpen(false);
                                        setSelectedRecentReservation(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal for Release Reservation Details */}
            <AnimatePresence>
                {releaseModalOpen && selectedReleaseReservation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-3xl font-bold mb-6 text-green-800 border-b-2 border-green-500 pb-2">Release Reservation Details</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="font-medium text-gray-600">Name:</p>
                                    <p className="text-lg">{selectedReleaseReservation.reservation?.reservation_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Status:</p>
                                    <p className={`px-3 py-1 rounded-full text-sm inline-block ${getStatusClass(selectedReleaseReservation.reservation?.status_master_name)}`}>
                                        {selectedReleaseReservation.reservation?.status_master_name}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Event Title:</p>
                                    <p className="text-lg">{selectedReleaseReservation.reservation?.reservation_event_title}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Description:</p>
                                    <p className="text-sm">{selectedReleaseReservation.reservation?.reservation_description}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Start:</p>
                                    <p>{formatDate(selectedReleaseReservation.reservation?.reservation_start_date)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">End:</p>
                                    <p>{formatDate(selectedReleaseReservation.reservation?.reservation_end_date)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-600">Created:</p>
                                    <p>{formatDate(selectedReleaseReservation.reservation?.date_created)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Requested By:</p>
                                    <p className="text-lg">{selectedReleaseReservation.reservation?.users_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Contact Number:</p>
                                    <p className="text-lg">{selectedReleaseReservation.reservation?.users_contact_number}</p>
                                </div>
                            </div>

                            {/* Vehicles */}
                            {selectedReleaseReservation.vehicles && selectedReleaseReservation.vehicles.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Vehicles Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedReleaseReservation.vehicles.map((vehicle) => (
                                            <li key={vehicle.vehicle_license} className="text-sm mb-2">
                                                {vehicle.vehicle_license} (ID: {vehicle.vehicle_reservation_vehicle_id})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Equipment */}
                            {selectedReleaseReservation.equipment && selectedReleaseReservation.equipment.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Equipment Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedReleaseReservation.equipment.map((equip) => (
                                            <li key={equip.equip_name} className="text-sm mb-2">
                                                {equip.equip_name} (Quantity: {equip.quantity})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Venues */}
                            {selectedReleaseReservation.venues && selectedReleaseReservation.venues.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Venues Used:</h4>
                                    <ul className="list-disc list-inside bg-green-50 p-4 rounded-lg">
                                        {selectedReleaseReservation.venues.map((venue) => (
                                            <li key={venue.ven_name} className="text-sm mb-2">
                                                {venue.ven_name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end space-x-4">
                                <button 
                                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                                    onClick={() => handleRelease(selectedReleaseReservation.reservation.reservation_id)}
                                    disabled={loading}
                                >
                                    {loading ? 'Releasing...' : 'Release'}
                                </button>
                                <button 
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                                    onClick={() => {
                                        setReleaseModalOpen(false);
                                        setSelectedReleaseReservation(null);
                                    }}
                                    disabled={loading}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal for Return Reservation Details */}
            <AnimatePresence>
                {returnModalOpen && selectedReturnReservation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-3xl font-bold mb-6 text-green-800 border-b-2 border-green-500 pb-2">Return Reservation Details</h3>
                            
                            {/* Reservation Details */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="font-medium text-gray-600">Name:</p>
                                    <p className="text-lg">{selectedReturnReservation.reservation?.reservation_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Event Title:</p>
                                    <p className="text-lg">{selectedReturnReservation.reservation?.reservation_event_title}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Start Date:</p>
                                    <p>{formatDate(selectedReturnReservation.reservation?.reservation_start_date)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">End Date:</p>
                                    <p>{formatDate(selectedReturnReservation.reservation?.reservation_end_date)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Requested By:</p>
                                    <p className="text-lg">{selectedReturnReservation.reservation?.requested_by}</p>
                                </div>
                            </div>

                            {/* Venues */}
                            {selectedReturnReservation.venues && selectedReturnReservation.venues.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Venues:</h4>
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left">Name</th>
                                                <th className="text-left">Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedReturnReservation.venues.map((venue) => (
                                                <tr key={venue.ven_id}>
                                                    <td className="py-2">{venue.ven_name}</td>
                                                    <td className="py-2">
                                                        <select
                                                            className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                                                            onChange={(e) => handleConditionChange('venue', venue.ven_id, e.target.value)}
                                                            value={itemConditions[`venue_${venue.ven_id}`] || ''}
                                                        >
                                                            <option value="">Select condition</option>
                                                            {conditions.map((condition) => (
                                                                <option key={condition.condition_id} value={condition.condition_id}>
                                                                    {condition.condition_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Vehicles */}
                            {selectedReturnReservation.vehicles && selectedReturnReservation.vehicles.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Vehicles:</h4>
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left">License</th>
                                                <th className="text-left">Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedReturnReservation.vehicles.map((vehicle) => (
                                                <tr key={vehicle.vehicle_id}>
                                                    <td className="py-2">{vehicle.vehicle_license}</td>
                                                    <td className="py-2">
                                                        <select
                                                            className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                                                            onChange={(e) => handleConditionChange('vehicle', vehicle.vehicle_id, e.target.value)}
                                                            value={itemConditions[`vehicle_${vehicle.vehicle_id}`] || ''}
                                                        >
                                                            <option value="">Select condition</option>
                                                            {conditions.map((condition) => (
                                                                <option key={condition.condition_id} value={condition.condition_id}>
                                                                    {condition.condition_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Equipment */}
                            {selectedReturnReservation.equipment && selectedReturnReservation.equipment.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-green-700 mb-2">Equipment:</h4>
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left">Name</th>
                                                <th className="text-left">Quantity</th>
                                                <th className="text-left">Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedReturnReservation.equipment.map((equip) => (
                                                <tr key={equip.equip_id}>
                                                    <td className="py-2">{equip.equip_name}</td>
                                                    <td className="py-2">{equip.quantity}</td>
                                                    <td className="py-2">
                                                        <select
                                                            className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                                                            onChange={(e) => handleConditionChange('equipment', equip.equip_id, e.target.value)}
                                                            value={itemConditions[`equipment_${equip.equip_id}`] || ''}
                                                        >
                                                            <option value="">Select condition</option>
                                                            {conditions.map((condition) => (
                                                                <option key={condition.condition_id} value={condition.condition_id}>
                                                                    {condition.condition_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end space-x-4">
                                <button 
                                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                                    onClick={() => handleReturn(selectedReturnReservation.reservation.reservation_id)}
                                    
                                >
                                    {loading ? 'Returning...' : 'Return'}
                                </button>
                                <button 
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                                    onClick={() => {
                                        setReturnModalOpen(false);
                                        setSelectedReturnReservation(null);
                                        setItemConditions({});
                                    }}
                                    disabled={loading}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Return Confirmation Modal */}
            <AnimatePresence>
                {returnConfirmation.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`bg-white rounded-lg p-8 max-w-md w-full ${
                                returnConfirmation.success ? 'border-green-500' : 'border-red-500'
                            } border-4`}
                        >
                            <h3 className={`text-2xl font-bold mb-4 ${
                                returnConfirmation.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {returnConfirmation.success ? 'Success' : 'Error'}
                            </h3>
                            <p className="text-gray-700 mb-6">{returnConfirmation.message}</p>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                onClick={() => setReturnConfirmation({ show: false, success: false, message: '' })}
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Release Confirmation Modal */}
            <AnimatePresence>
                {releaseConfirmation.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`bg-white rounded-lg p-8 max-w-md w-full ${
                                releaseConfirmation.success ? 'border-green-500' : 'border-red-500'
                            } border-4`}
                        >
                            <h3 className={`text-2xl font-bold mb-4 ${
                                releaseConfirmation.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {releaseConfirmation.success ? 'Success' : 'Error'}
                            </h3>
                            <p className="text-gray-700 mb-6">{releaseConfirmation.message}</p>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                onClick={() => setReleaseConfirmation({ show: false, success: false, message: '' })}
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Dashboard;
