import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

import { FaClipboardList, FaCar, FaUsers, FaBuilding, FaTools, FaUserTie, FaEye, FaCheckCircle, FaBell, FaPlus, FaSearch, FaCog, FaUserCog, FaUserCircle, FaSun, FaMoon, FaClock, FaTimesCircle, FaSpinner, FaFlag, FaClipboardCheck, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

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
        pending_requests: 0,
        vehicles: 0,
        venues: 0,
        equipments: 0,
        users: 0
    });
    const [reservationStats, setReservationStats] = useState({
        daily: [],
        weekly: [],
        monthly: []
    });
    const [activeView, setActiveView] = useState('daily');
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [upcomingReservations, setUpcomingReservations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
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
    const [recentRequests, setRecentRequests] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);

    // Read dark mode preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
    }, []);

    useEffect(() => {
        const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
        const user_level_id = localStorage.getItem('user_level_id');

        if (user_level_id !== '1' && user_level_id !== '4') { // Assuming '1' is the Super Admin ID
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
        const fetchReservationStats = async () => {
            try {
                const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                    operation: 'getReservationStats'
                });
                if (response.data.status === 'success') {
                    setTotals(response.data.totals);
                    setReservationStats(response.data.stats);
                }
            } catch (error) {
                console.error('Error fetching reservation stats:', error);
            }
        };

        fetchReservationStats();
    }, []);

    // Fix dark mode implementation after useEffect
    useEffect(() => {
        // Save dark mode preference to localStorage
        localStorage.setItem('darkMode', darkMode);
        // Apply dark mode class to body
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [darkMode]);

    const fetchVenues = useCallback(async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVenue" }));
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch {
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
            }
        } catch (error) {
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
            }
        } catch (error) {
            toast.error('An error occurred while fetching return facilities.');
            console.error('Fetch return facilities error:', error);
        }
    }, []);

    const fetchTotals = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/get_totals.php', { 
                operation: 'getTotals' 
            });

            if (response.data.status === 'success') {
                setTotals(response.data.data);
            } else {
                toast.error('Error fetching dashboard statistics');
            }
        } catch (error) {
            console.error('Error fetching totals:', error);
            toast.error('Error fetching dashboard statistics');
        }
    };

    const fetchRequest = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
                operation: 'fetchRequest'
            });

            if (response.data && response.data.status === 'success') {
                setRecentRequests(response.data.data);
            } else {
                toast.error('Error fetching requests');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to fetch requests');
        }
    }, []);

    const fetchCompletedTask = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
                operation: 'fetchCompletedTask'
            });
            
            if (response.data.status === 'success') {
                setCompletedTasks(response.data.data);
            } else {
                console.error('Failed to fetch completed tasks');
            }
        } catch (error) {
            console.error('Error fetching completed tasks:', error);
            toast.error('Failed to load completed tasks');
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
            fetchTotals();
            fetchRequest(); // Add this line
            fetchCompletedTask();
        }
    }, [loading, fetchVenues, fetchVehicles, fetchEquipment, fetchReservations, fetchReleaseFacilities, fetchReturnFacilities, fetchRequest, fetchCompletedTask]);

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

    // Fix getStatusClass function
    const getStatusClass = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        
        const statusLower = status.toLowerCase().trim();
        switch (statusLower) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'reserve':
            case 'reserved':
                return 'bg-green-100 text-green-800';
            case 'declined':
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'released':
                return 'bg-blue-100 text-blue-800';
            case 'returned':
                return 'bg-purple-100 text-purple-800';
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
        <motion.div className={`dashboard-container flex h-screen ${fadeIn ? 'fade-in' : ''}`}>
            <Sidebar />
            <div className="flex-1 overflow-hidden bg-gray-50">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <header className="bg-white shadow-sm p-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setDarkMode(!darkMode)} 
                                    className="p-2 rounded-full hover:bg-gray-100">
                                    {darkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-600" />}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Statistics Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            
                            <StatCard
                                title="Venues"
                                value={totals.venues}
                                icon={<FaBuilding />}
                                color="bg-green-500"
                            />
                            <StatCard
                                title="Equipment"
                                value={totals.equipments}
                                icon={<FaTools />}
                                color="bg-purple-500"
                            />
                            <StatCard
                                title="Vehicles"
                                value={totals.vehicles}
                                icon={<FaCar />}
                                color="bg-indigo-500"
                            />
                            <StatCard
                                title="Users"
                                value={totals.users}
                                icon={<FaUsers />}
                                color="bg-red-500"
                            />
                        </div>

                        {/* Recent Requests and Completed Tasks Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Recent Requests Section */}
                            <motion.div
                                className="bg-white rounded-lg shadow-sm p-6"
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                        <FaClipboardList className="text-green-500 text-xl mr-2" />
                                        Recent Requests
                                    </h2>
                                    <span className="text-sm text-gray-500">{recentRequests.length} requests</span>
                                </div>
                                <div className="space-y-4">
                                    {recentRequests.map((request, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer border border-gray-100"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="bg-green-100 p-2 rounded-full">
                                                    <FaFileAlt className="text-green-600 text-lg" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-800 mb-1">
                                                        {request.reservation_form_name}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <span className="text-green-600">
                                                            {format(new Date(request.reservation_date), 'PPp')}
                                                        </span>
                                                        
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </motion.div>
                                    ))}
                                    {recentRequests.length === 0 && (
                                        <div className="text-center py-6 text-gray-500">
                                            No recent requests found
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Completed Tasks Section */}
                            <motion.div
                                className="bg-white rounded-lg shadow-sm p-6"
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                        <FaCheckCircle className="text-green-500 mr-2" />
                                        Personnel Task Completion
                                    </h2>
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {completedTasks.length} Completed
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {completedTasks.length > 0 ? (
                                        completedTasks.map((task, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-all duration-200"
                                                variants={itemVariants}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="bg-green-100 p-2 rounded-full">
                                                        <FaUserTie className="text-green-600 text-lg" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-800">
                                                            {task.personnel_full_name}
                                                        </h3>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="flex items-center text-sm text-green-600">
                                                                <FaCheckCircle className="mr-1" />
                                                                {task.status_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Completed
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6">
                                            <FaClipboardCheck className="mx-auto text-gray-400 text-3xl mb-2" />
                                            <p className="text-gray-500">No completed tasks found</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Add new components
const StatCard = ({ title, value, icon, color }) => (
    <motion.div
        className={`${color} text-white rounded-lg p-4 shadow-sm`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-center justify-between">
            <div className="text-3xl">{icon}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="mt-2 text-sm font-medium">{title}</div>
    </motion.div>
);



export default Dashboard;

