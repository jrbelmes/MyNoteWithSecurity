import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { initializeSessionManager } from '../utils/sessionManager';
import {
  FaClipboardList, FaCar, FaUsers, FaBuilding, FaTools, FaUserTie,
  FaEye, FaCheckCircle, FaSun, FaMoon, FaClock, FaTimesCircle,
  FaClipboardCheck, FaCalendar, FaChartLine, FaChartBar,
  FaCalendarDay, FaFileAlt, FaBell, FaEllipsisH, FaArrowUp,
  FaArrowDown, FaPercent
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Select, Badge, Progress, Dropdown, Menu, Avatar } from 'antd';
import { SecureStorage } from '../utils/encryption';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend
);

// Utility functions
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

// New component for Stats Card
const StatsCard = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div
    className={`p-6 rounded-xl shadow-lg ${color} dark:bg-gray-800`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {trend && (
          <p className={`flex items-center mt-2 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
            {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

// New component for Activity Card
const ActivityCard = ({ activity }) => (
  <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
    <div className={`p-2 rounded-full ${activity.color} bg-opacity-20`}>
      {activity.icon}
    </div>
    <div className="flex-1">
      <p className="font-medium dark:text-white">{activity.title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
    </div>
    <span className="text-sm text-gray-400">{activity.time}</span>
  </div>
);

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
    const [setReservationStats] = useState({
        daily: [],
        weekly: [],
        monthly: []
    });

    const [venues, setVenues] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [setRecentReservations] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [setReleaseFacilities] = useState([]);
    const [setPersonnel] = useState([]);
    const [ongoingReservations, setOngoingReservations] = useState([]);
    const [completedReservations, setCompletedReservations] = useState([]);

    const [selectedReturnReservation, setSelectedReturnReservation] = useState(null);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [conditions, setConditions] = useState([]);
    const [itemConditions, setItemConditions] = useState({});
    const [selectedRecentReservation, setSelectedRecentReservation] = useState(null);
    const [selectedReleaseReservation, setSelectedReleaseReservation] = useState(null);
    const [recentReservationModalOpen, setRecentReservationModalOpen] = useState(false);
    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [returnConfirmation, setReturnConfirmation] = useState({ show: false, success: false, message: '' });
    const [inUseFacilities, setInUseFacilities] = useState([]);

    const [requestsPage, setRequestsPage] = useState(1);
    const [tasksPage, setTasksPage] = useState(1);
    const itemsPerPage = 5;

    const [setReturnFacilities] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [reservationData, setReservationData] = useState([]);
    const [timeFilter, setTimeFilter] = useState('365');
    const encryptedUrl = SecureStorage.getLocalItem("url");

    // Function to check if current time is within reservation period
    const isTimeInRange = (startDate, endDate) => {
        const currentDate = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        return currentDate >= start && currentDate <= end;
    };

    const fetchInUseFacilities = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, {
                operation: 'getInUse'
            });

            if (response.data && response.data.status === 'success') {
                setInUseFacilities(response.data.data);
            } else {
                console.error('Failed to fetch in-use facilities');
            }
        } catch (error) {
            console.error('Error fetching in-use facilities:', error);
        }
    }, [encryptedUrl]);



    // Utility function for pagination
    const paginateItems = (items, page, perPage) => {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return items.slice(start, end);
    };

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    // Initialize session manager


    // Read dark mode preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
    }, []);

    useEffect(() => {
        const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
        const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
        const decryptedUserLevel = encryptedUserLevel; 
        console.log('Decrypted User Level:', decryptedUserLevel);

        if (decryptedUserLevel !== '1' && decryptedUserLevel !== '4') { // Check for Super Admin (1) or specific role (4)
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
                const response = await axios.post(`${encryptedUrl}/user.php`, {
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
    }, [setReservationStats]);

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
            const response = await axios.post(`${encryptedUrl}/fetch2.php`, 
                new URLSearchParams({ operation: "fetchVenue" })
            );
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
            const response = await axios.post(`${encryptedUrl}/fetch2.php`,
                new URLSearchParams({ operation: "fetchVehicles" })
            );
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
            const response = await axios.post(`${encryptedUrl}/fetch2.php`,
                new URLSearchParams({ operation: "fetchEquipments" })
            );
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
            const response = await axios.post(`${encryptedUrl}/user.php`, {
                operation: 'fetchAllReservations',
            });

            if (response.data && response.data.status === 'success') {
                // Filter and update ongoing reservations
                const currentDate = new Date();
                const ongoing = response.data.data.filter(reservation => {
                    const startDate = new Date(reservation.reservation_start_date);
                    const endDate = new Date(reservation.reservation_end_date);
                    return startDate <= currentDate && currentDate <= endDate && reservation.reservation_status === 'Reserved';
                });
                setOngoingReservations(ongoing);

                // Filter and update completed reservations
                const completed = response.data.data.filter(reservation => 
                    reservation.reservation_status === 'Completed'
                );
                setCompletedReservations(completed);
            } else {
            }
        } catch (error) {
            toast.error('Error fetching reservations.');
        }
    }, []);

    const fetchReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
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
            const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
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
    }, [setReleaseFacilities]);

    const fetchPersonnel = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, 
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
    }, [setPersonnel]);

    const fetchReturnFacilities = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
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
    }, [setReturnFacilities]);

    const fetchTotals = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/get_totals.php`, { 
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
            const response = await axios.post(`${encryptedUrl}/get_totals.php`, {
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
    }, [setRecentRequests]);

    const fetchCompletedTask = useCallback(async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/get_totals.php`, {
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
    }, [setCompletedTasks]);

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
    }, [loading, fetchVenues, fetchVehicles, fetchEquipment, fetchReservations, fetchReleaseFacilities, fetchReturnFacilities, fetchRequest, fetchCompletedTask, fetchPersonnel]);

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

    useEffect(() => {
        if (!loading) {
            fetchVenues();
            fetchVehicles();
            fetchEquipment();
            fetchReservations();
            fetchReleaseFacilities();
            fetchPersonnel();
            fetchReturnFacilities();
            fetchTotals();
            fetchRequest();
            fetchCompletedTask();
            fetchInUseFacilities(); // Add this line
        }
    }, [loading, fetchVenues, fetchVehicles, fetchEquipment, fetchReservations, 
        fetchReleaseFacilities, fetchReturnFacilities, fetchRequest, fetchCompletedTask, 
        fetchPersonnel, fetchInUseFacilities]);

    // Add sample data for reservation chart

    const transformReservationData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        // Calculate total counts for reserved and declined
        const totalReserved = data.reduce((sum, item) => 
            item.status === 'Reserved' ? sum + item.count : sum, 0);
        const totalDeclined = data.reduce((sum, item) => 
            item.status === 'Declined' ? sum + item.count : sum, 0);
        
        return {
            labels: ['Reserved', 'Declined'],
            datasets: [{
                data: [totalReserved, totalDeclined],
                backgroundColor: [
                    'rgba(142, 36, 170, 0.8)',
                    'rgba(245, 124, 0, 0.8)'
                ],
                borderColor: [
                    '#8E24AA',
                    '#F57C00'
                ],
                borderWidth: 1,
                hoverOffset: 4
            }]
        };
    };

    // Chart.js options for Doughnut chart
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    color: darkMode ? '#d1d5db' : '#4b5563',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: darkMode ? '#d1d5db' : '#1f2937',
                bodyColor: darkMode ? '#9ca3af' : '#4b5563',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
        rotation: -90,
        circumference: 360,
        animation: {
            animateRotate: true,
            animateScale: true
        }
    };

    const isReservationActive = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        return now >= start && now <= end;
    };

    const getReservationStatusBadge = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (now < start) {
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Upcoming
                </span>
            );
        } else if (now >= start && now <= end) {
            return (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Ongoing
                </span>
            );
        }
        return null;
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
            className={`dashboard-container flex h-screen bg-lightcream ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Sidebar />
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Enhanced Header with Welcome Banner */}
                    <header className="bg-gradient-to-r from-lightcream to-primary shadow-lg dark:from-gray-800 dark:to-primary-dark">
                        <div className="px-6 py-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                                <div>
                                    <h1 className="text-3xl font-bold text-primary-dark dark:text-white">Welcome Back, Admin!</h1>
                                    <p className="text-primary mt-1">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-primary-dark dark:text-white">
                                        <div className="text-sm font-medium">Active Reservations</div>
                                        <div className="text-2xl font-bold">{ongoingReservations.length}</div>
                                    </div>
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)} 
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-primary-dark dark:text-white transition-colors"
                                    >
                                        {darkMode ? 
                                            <FaSun className="text-yellow-400 text-xl" /> : 
                                            <FaMoon className="text-primary-dark text-xl" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content with scrollable area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Venues"
                                value={totals.venues}
                                icon={<FaBuilding />}
                                color="bg-primary"
                            />
                            <StatCard
                                title="Equipment"
                                value={totals.equipments}
                                icon={<FaTools />}
                                color="bg-accent"
                            />
                            <StatCard
                                title="Vehicles"
                                value={totals.vehicles}
                                icon={<FaCar />}
                                color="bg-primary-dark"
                            />
                            <StatCard
                                title="Users"
                                value={totals.users}
                                icon={<FaUsers />}
                                color="bg-accent-dark"
                            />
                        </div>
                        {/* Top Row with Active Reservations only */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* Active Reservations Section */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-primary/20 dark:border-primary-dark/20"
                            >
                                <div className="bg-gradient-to-r from-primary to-primary-dark p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaClock className="mr-2" /> Active Reservations
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {ongoingReservations.length} Active
                                    </div>
                                </div>
                                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 64px)' }}>
                                    {ongoingReservations.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requestor</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schedule</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                                    {ongoingReservations.slice(0, 5).map((reservation, index) => (
                                                        <motion.tr 
                                                            key={index}
                                                            variants={itemVariants}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{reservation.reservation_title}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.reservation_description}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.user_full_name}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.department_name}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm text-gray-500 dark:text-gray-300">
                                                                    {new Date(reservation.reservation_start_date).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                    <br />
                                                                    to
                                                                    <br />
                                                                    {new Date(reservation.reservation_end_date).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {getReservationStatusBadge(
                                                                    reservation.reservation_start_date,
                                                                    reservation.reservation_end_date
                                                                )}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FaCalendar className="mx-auto text-gray-300 dark:text-gray-600 text-5xl mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">No ongoing reservations at the moment</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* In Use Facility Lists */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible" 
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {/* Venues In Use */}
                            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-primary/20 dark:border-primary-dark/20">
                                <div className="bg-gradient-to-r from-primary to-primary-dark p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaBuilding className="mr-2" /> Venues In Use
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {inUseFacilities.filter(facility => facility.resource_type === 'venue').length} Active
                                    </div>
                                </div>
                                <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                                    {inUseFacilities.filter(facility => facility.resource_type === 'venue').map((facility, index) => (
                                        <div key={index} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{facility.resource_name}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Currently in use by {facility.user_full_name}</p>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    In Use
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Until {new Date(facility.reservation_end_date).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}</p>
                                        </div>
                                    ))}
                                    {inUseFacilities.filter(facility => facility.resource_type === 'venue').length === 0 && (
                                        <div className="text-center py-6">
                                            <FaBuilding className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                                            <p className="text-gray-500 dark:text-gray-400">No venues currently in use</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Vehicles In Use */}
                            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-primary/20 dark:border-primary-dark/20">
                                <div className="bg-gradient-to-r from-accent to-accent-dark p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaCar className="mr-2" /> Vehicles In Use
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length} Active
                                    </div>
                                </div>
                                <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                                    {inUseFacilities.filter(facility => facility.resource_type === 'vehicle').map((facility, index) => (
                                        <div key={index} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{facility.resource_name}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Driven by {facility.user_full_name}</p>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    On Trip
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Expected return: {new Date(facility.reservation_end_date).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}</p>
                                        </div>
                                    ))}
                                    {inUseFacilities.filter(facility => facility.resource_type === 'vehicle').length === 0 && (
                                        <div className="text-center py-6">
                                            <FaCar className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                                            <p className="text-gray-500 dark:text-gray-400">No vehicles currently in use</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Equipment In Use */}
                            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-primary/20 dark:border-primary-dark/20">
                                <div className="bg-gradient-to-r from-primary-dark to-primary p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaTools className="mr-2" /> Equipment In Use
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {inUseFacilities.filter(facility => facility.resource_type === 'equipment').length} Active
                                    </div>
                                </div>
                                <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                                    {inUseFacilities.filter(facility => facility.resource_type === 'equipment').map((facility, index) => (
                                        <div key={index} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{facility.resource_name}</h3>
                                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-200">
                                                            Qty: {facility.quantity || 1}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Used by {facility.user_full_name}</p>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                    In Use
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Expected return: {new Date(facility.reservation_end_date).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}</p>
                                        </div>
                                    ))}
                                    {inUseFacilities.filter(facility => facility.resource_type === 'equipment').length === 0 && (
                                        <div className="text-center py-6">
                                            <FaTools className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                                            <p className="text-gray-500 dark:text-gray-400">No equipment currently in use</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Reservation Details Modal - Keeping this from previous design */}
            <AnimatePresence>
                {modalOpen && selectedReservation && (
                    <motion.div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden border border-primary/20 dark:border-primary-dark/20"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <div className="bg-gradient-to-r from-primary to-primary-dark p-4">
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <FaCalendar className="mr-2" /> Reservation Details
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reservation Form</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.reservation_form_name}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Requestor</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.requestor_name}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedReservation.reservation_start_date)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedReservation.reservation_end_date)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(selectedReservation.status_name)}`}>
                                                {selectedReservation.status_name}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Created</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedReservation.date_created)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional Sections for Ongoing and Completed Reservations */}
                            <div className="mt-6 space-y-4">
                                {/* Ongoing Reservations Section */}
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                        <FaClock className="mr-2 text-green-500" /> Ongoing Reservations
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                                                {ongoingReservations.map((reservation, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {reservation.reservation_title}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {reservation.reservation_description}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {formatDate(reservation.reservation_start_date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {formatDate(reservation.reservation_end_date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                {reservation.reservation_status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {ongoingReservations.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                                            No ongoing reservations
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Completed Reservations Section */}
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                        <FaCheckCircle className="mr-2 text-blue-500" /> Completed Reservations
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                                                {completedReservations.map((reservation, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {reservation.reservation_title}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {reservation.reservation_description}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {formatDate(reservation.reservation_start_date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {formatDate(reservation.reservation_end_date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                {reservation.reservation_status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {completedReservations.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                                            No completed reservations
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-end">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Enhanced StatCard component
const StatCard = ({ title, value, icon, color }) => (
    <motion.div
        className={`${color} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-center justify-between">
            <div className="text-4xl">{icon}</div>
            <div className="text-3xl font-bold">{value}</div>
        </div>
        <div className="mt-3 text-sm font-medium opacity-90">{title}</div>
    </motion.div>
);

export default Dashboard;

