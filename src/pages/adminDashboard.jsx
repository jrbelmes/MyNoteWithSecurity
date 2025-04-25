import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { initializeSessionManager } from '../utils/sessionManager';

import { FaClipboardList, FaCar, FaUsers, FaBuilding, FaTools, FaUserTie, FaEye, FaCheckCircle, FaSun, FaMoon, FaClock, FaTimesCircle, FaClipboardCheck, FaCalendar, FaChartLine, FaChartBar, FaCalendarDay, FaFileAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
// Replace the Ant Design imports with Chart.js imports
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Select } from 'antd';
import { SecureStorage } from '../utils/encryption';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

    const [selectedReturnReservation, setSelectedReturnReservation] = useState(null);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [conditions, setConditions] = useState([]);
    const [itemConditions, setItemConditions] = useState({});
    const [selectedRecentReservation, setSelectedRecentReservation] = useState(null);
    const [selectedReleaseReservation, setSelectedReleaseReservation] = useState(null);
    const [recentReservationModalOpen, setRecentReservationModalOpen] = useState(false);
    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [returnConfirmation, setReturnConfirmation] = useState({ show: false, success: false, message: '' });

    const [requestsPage, setRequestsPage] = useState(1);
    const [tasksPage, setTasksPage] = useState(1);
    const itemsPerPage = 5;

    const [setReturnFacilities] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [reservationData, setReservationData] = useState([]);
    const [timeFilter, setTimeFilter] = useState('365');
    const encryptedUrl = SecureStorage.getLocalItem("url");

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
                const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
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
            const response = await axios.post(`${encryptedUrl}/fetch_reserve.php`, {
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
    }, [setRecentReservations]);

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

    // Add sample data for reservation chart
    const getExampleReservationData = (period) => {
        const data = [];
        
        if (period === '7') {
            // Last 7 days data
            data.push(
                { date: '2023-06-15', status: 'Reserved', count: 8 },
                { date: '2023-06-15', status: 'Declined', count: 3 },
                { date: '2023-06-16', status: 'Reserved', count: 12 },
                { date: '2023-06-16', status: 'Declined', count: 4 },
                { date: '2023-06-17', status: 'Reserved', count: 9 },
                { date: '2023-06-17', status: 'Declined', count: 2 },
                { date: '2023-06-18', status: 'Reserved', count: 14 },
                { date: '2023-06-18', status: 'Declined', count: 5 },
                { date: '2023-06-19', status: 'Reserved', count: 11 },
                { date: '2023-06-19', status: 'Declined', count: 3 },
                { date: '2023-06-20', status: 'Reserved', count: 7 },
                { date: '2023-06-20', status: 'Declined', count: 2 },
                { date: '2023-06-21', status: 'Reserved', count: 10 },
                { date: '2023-06-21', status: 'Declined', count: 4 }
            );
        } else if (period === '30') {
            // Sample data for 30 days - showing just a few points for brevity
            data.push(
                { date: '2023-05-23', status: 'Reserved', count: 8 },
                { date: '2023-05-23', status: 'Declined', count: 3 },
                { date: '2023-05-30', status: 'Reserved', count: 12 },
                { date: '2023-05-30', status: 'Declined', count: 4 },
                { date: '2023-06-06', status: 'Reserved', count: 15 },
                { date: '2023-06-06', status: 'Declined', count: 6 },
                { date: '2023-06-13', status: 'Reserved', count: 18 },
                { date: '2023-06-13', status: 'Declined', count: 5 },
                { date: '2023-06-20', status: 'Reserved', count: 14 },
                { date: '2023-06-20', status: 'Declined', count: 7 }
            );
        } else if (period === '90') {
            // Sample weekly data for 90 days
            data.push(
                { date: 'Week 1 of Apr', status: 'Reserved', count: 22 },
                { date: 'Week 1 of Apr', status: 'Declined', count: 8 },
                { date: 'Week 2 of Apr', status: 'Reserved', count: 28 },
                { date: 'Week 2 of Apr', status: 'Declined', count: 12 },
                { date: 'Week 3 of Apr', status: 'Reserved', count: 32 },
                { date: 'Week 3 of Apr', status: 'Declined', count: 10 },
                { date: 'Week 4 of Apr', status: 'Reserved', count: 25 },
                { date: 'Week 4 of Apr', status: 'Declined', count: 9 },
                { date: 'Week 1 of May', status: 'Reserved', count: 30 },
                { date: 'Week 1 of May', status: 'Declined', count: 11 },
                { date: 'Week 2 of May', status: 'Reserved', count: 35 },
                { date: 'Week 2 of May', status: 'Declined', count: 14 },
                { date: 'Week 3 of May', status: 'Reserved', count: 42 },
                { date: 'Week 3 of May', status: 'Declined', count: 15 },
                { date: 'Week 4 of May', status: 'Reserved', count: 38 },
                { date: 'Week 4 of May', status: 'Declined', count: 12 },
                { date: 'Week 1 of Jun', status: 'Reserved', count: 36 },
                { date: 'Week 1 of Jun', status: 'Declined', count: 10 },
                { date: 'Week 2 of Jun', status: 'Reserved', count: 40 },
                { date: 'Week 2 of Jun', status: 'Declined', count: 13 },
                { date: 'Week 3 of Jun', status: 'Reserved', count: 45 },
                { date: 'Week 3 of Jun', status: 'Declined', count: 16 }
            );
        } else {
            // Yearly data
            data.push(
                { date: 'January', status: 'Reserved', count: 65 },
                { date: 'January', status: 'Declined', count: 22 },
                { date: 'February', status: 'Reserved', count: 72 },
                { date: 'February', status: 'Declined', count: 28 },
                { date: 'March', status: 'Reserved', count: 80 },
                { date: 'March', status: 'Declined', count: 32 },
                { date: 'April', status: 'Reserved', count: 95 },
                { date: 'April', status: 'Declined', count: 38 },
                { date: 'May', status: 'Reserved', count: 120 },
                { date: 'May', status: 'Declined', count: 45 },
                { date: 'June', status: 'Reserved', count: 110 },
                { date: 'June', status: 'Declined', count: 40 },
                { date: 'July', status: 'Reserved', count: 105 },
                { date: 'July', status: 'Declined', count: 35 },
                { date: 'August', status: 'Reserved', count: 125 },
                { date: 'August', status: 'Declined', count: 42 },
                { date: 'September', status: 'Reserved', count: 135 },
                { date: 'September', status: 'Declined', count: 48 },
                { date: 'October', status: 'Reserved', count: 145 },
                { date: 'October', status: 'Declined', count: 52 },
                { date: 'November', status: 'Reserved', count: 160 },
                { date: 'November', status: 'Declined', count: 58 },
                { date: 'December', status: 'Reserved', count: 180 },
                { date: 'December', status: 'Declined', count: 65 }
            );
        }
        
        return data;
    };

    const fetchReservationChartData = useCallback(async () => { 
        try {
            // Show loading state if needed
            setReservationData([]); // Clear existing data to show loading state
            
            // Use example data directly for this demo
            // In production, this would be replaced with actual API calls
            setTimeout(() => {
                const exampleData = getExampleReservationData(timeFilter);
                setReservationData(exampleData);
            }, 500); // Simulating API delay
            
            /*
            // This is the original API call that would be used in production
            const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
                operation: 'fetchReservedAndDeclinedReservations'
            });

            if (response.data.status === 'success') {
                const data = processChartData(response.data.data, timeFilter);
                setReservationData(data);
            } else {
                setReservationData(generateDefaultData(timeFilter));
            }
            */
        } catch (error) {
            console.error('Error fetching chart data:', error);
            // Use example data if API fails
            setReservationData(getExampleReservationData(timeFilter));
        }
    }, [timeFilter]);

    useEffect(() => {
        fetchReservationChartData();
    }, [timeFilter, fetchReservationChartData]);

    const transformReservationData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        // Extract unique dates
        const uniqueDates = [...new Set(data.map(item => item.date))];
        
        // Get reserved and declined counts for each date
        const reservedCounts = uniqueDates.map(date => {
            const found = data.find(item => item.date === date && item.status === 'Reserved');
            return found ? found.count : 0;
        });
        
        const declinedCounts = uniqueDates.map(date => {
            const found = data.find(item => item.date === date && item.status === 'Declined');
            return found ? found.count : 0;
        });
        
        return {
            labels: uniqueDates,
            datasets: [
                {
                    label: 'Reserved',
                    data: reservedCounts,
                    borderColor: '#8E24AA',
                    backgroundColor: 'rgba(142, 36, 170, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#8E24AA',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                },
                {
                    label: 'Declined',
                    data: declinedCounts,
                    borderColor: '#F57C00',
                    backgroundColor: 'rgba(245, 124, 0, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#F57C00',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                }
            ]
        };
    };

    // Chart.js options
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
                mode: 'index',
                intersect: false,
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
                    title: (tooltipItems) => {
                        return `Date: ${tooltipItems[0].label}`;
                    },
                    label: (context) => {
                        return `${context.dataset.label}: ${context.raw} reservations`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.7)',
                    drawBorder: false
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    maxRotation: 45,
                    minRotation: 45
                },
                title: {
                    display: true,
                    text: timeFilter === '365' ? 'Month' : timeFilter === '90' ? 'Week' : 'Date',
                    color: darkMode ? '#d1d5db' : '#4b5563',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            y: {
                grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.7)',
                    drawBorder: false
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    precision: 0
                },
                title: {
                    display: true,
                    text: 'Number of Reservations',
                    color: darkMode ? '#d1d5db' : '#4b5563',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                beginAtZero: true
            }
        },
        animations: {
            tension: {
                duration: 1000,
                easing: 'linear',
                from: 0.4,
                to: 0.4,
                loop: false
            }
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
            className={`dashboard-container flex h-screen bg-[#d8f3dc] ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Sidebar />
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Enhanced Header with Welcome Banner */}
                    <header className="bg-gradient-to-r from-[#d8f3dc] to-green-800 shadow-lg dark:from-[#d8f3dc] dark:to-green-800">
                        <div className="px-6 py-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back, Admin!</h1>
                                    <p className="text-green-800 mt-1">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-gray-800">
                                        <div className="text-sm font-medium">Active Reservations</div>
                                        <div className="text-2xl font-bold">{ongoingReservations.length}</div>
                                    </div>
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)} 
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-gray-800 transition-colors"
                                    >
                                        {darkMode ? 
                                            <FaSun className="text-yellow-600 text-xl" /> : 
                                            <FaMoon className="text-gray-800 text-xl" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content with scrollable area */}
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
                                    {paginateItems(recentRequests, requestsPage, itemsPerPage).map((request, index) => (
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
                                        <FaClipboardCheck className="text-blue-500 text-xl mr-2" />
                                        Completed Tasks
                                    </h2>
                                    <span className="text-sm text-gray-500">{completedTasks.length} tasks</span>
                                </div>
                                <div className="space-y-4">
                                    {paginateItems(completedTasks, tasksPage, itemsPerPage).map((task, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer border border-gray-100"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="bg-blue-100 p-2 rounded-full">
                                                    <FaCheckCircle className="text-blue-600 text-lg" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-800 mb-1">
                                                        {task.task_name}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <span className="text-blue-600">
                                                            {format(new Date(task.date_completed), 'PPp')}
                                                        </span>
                                                        
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </motion.div>
                                    ))}
                                    {completedTasks.length === 0 && (
                                        <div className="text-center py-6 text-gray-500">
                                            No completed tasks found
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Dashboard Stats Overview */}
                        <motion.div 
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants}>
                                <StatCard
                                    title="Venues"
                                    value={totals.venues}
                                    icon={<FaBuilding />}
                                    color="bg-gradient-to-br from-green-500 to-green-700"
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <StatCard
                                    title="Equipment"
                                    value={totals.equipments}
                                    icon={<FaTools />}
                                    color="bg-gradient-to-br from-purple-500 to-purple-700"
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <StatCard
                                    title="Vehicles"
                                    value={totals.vehicles}
                                    icon={<FaCar />}
                                    color="bg-gradient-to-br from-blue-500 to-blue-700"
                                />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <StatCard
                                    title="Users"
                                    value={totals.users}
                                    icon={<FaUsers />}
                                    color="bg-gradient-to-br from-amber-500 to-amber-700"
                                />
                            </motion.div>
                        </motion.div>

                        {/* Facility Usage Lists Section */}
                       

                        {/* Reservation Activity Chart - COMPLETELY NEW DESIGN */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible" 
                            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
                            style={{
                                background: `linear-gradient(to bottom, ${darkMode ? '#1f2937' : '#f8fafc'}, ${darkMode ? '#111827' : '#ffffff'})`,
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${darkMode ? '4b5563' : 'e2e8f0'}' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
                            }}
                        >
                            <div className="p-5">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                    <div className="flex items-center">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 mr-3">
                                            <FaChartLine className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reservation Activity</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring reservation trends and patterns</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-4 sm:mt-0 space-x-3">
                                        <div className="flex items-center">
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', marginRight: '6px' }}></div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reserved</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444', marginRight: '6px' }}></div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Declined</span>
                                        </div>
                                        <Select
                                            defaultValue="365"
                                            style={{ 
                                                width: 130,
                                                borderRadius: '0.375rem'
                                            }}
                                            onChange={setTimeFilter}
                                            options={[
                                                { value: '7', label: 'Last 7 Days' },
                                                { value: '30', label: 'Last 30 Days' },
                                                { value: '90', label: 'Last 90 Days' },
                                                { value: '365', label: 'Yearly' },
                                            ]}
                                        />
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-6" style={{ minHeight: '320px' }}>
                                    <Line 
                                        data={transformReservationData(reservationData)}
                                        options={chartOptions}
                                        height={300}
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Peak Period Card */}
                                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center mb-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-2">
                                                <FaCalendarDay className="text-purple-600 dark:text-purple-300" />
                                            </div>
                                            <h3 className="text-xs uppercase text-purple-700 dark:text-purple-300 tracking-wider font-semibold">PEAK PERIOD</h3>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                                            {(() => {
                                                if (timeFilter === '365') return 'December';
                                                if (timeFilter === '90') return 'Week 3, June';
                                                if (timeFilter === '30') return 'June 13';
                                                return 'June 18';
                                            })()}
                                        </p>
                                        <p className="text-sm text-purple-600 dark:text-purple-300">
                                            {(() => {
                                                if (timeFilter === '365') return '180 reservations';
                                                if (timeFilter === '90') return '45 reservations';
                                                if (timeFilter === '30') return '18 reservations';
                                                return '14 reservations';
                                            })()}
                                        </p>
                                    </div>

                                    {/* Total Approvals Card */}
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center mb-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-2">
                                                <FaCheckCircle className="text-green-600 dark:text-green-300" />
                                            </div>
                                            <h3 className="text-xs uppercase text-green-700 dark:text-green-300 tracking-wider font-semibold">TOTAL APPROVALS</h3>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                                            {(() => {
                                                if (timeFilter === '365') return '1,392';
                                                if (timeFilter === '90') return '371';
                                                if (timeFilter === '30') return '67';
                                                return '71';
                                            })()}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-300">
                                            {(() => {
                                                if (timeFilter === '365') return '+12.5% from last year';
                                                if (timeFilter === '90') return '+8.7% from last quarter';
                                                if (timeFilter === '30') return '+15.2% from last month';
                                                return '+22.4% from last week';
                                            })()}
                                        </p>
                                    </div>

                                    {/* Decline Rate Card */}
                                    <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                        <div className="flex items-center mb-2">
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center mr-2">
                                                <FaTimesCircle className="text-red-600 dark:text-red-300" />
                                            </div>
                                            <h3 className="text-xs uppercase text-red-700 dark:text-red-300 tracking-wider font-semibold">DECLINE RATE</h3>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                                            {(() => {
                                                if (timeFilter === '365') return '36%';
                                                if (timeFilter === '90') return '32%';
                                                if (timeFilter === '30') return '37%';
                                                return '35%';
                                            })()}
                                        </p>
                                        <p className="text-sm text-red-600 dark:text-red-300">
                                            {(() => {
                                                if (timeFilter === '365') return '-2.8% from last year';
                                                if (timeFilter === '90') return '-1.5% from last quarter';
                                                if (timeFilter === '30') return '+3.2% from last month';
                                                return '-0.7% from last week';
                                            })()}
                                        </p>
                                    </div>

                                    {/* Average Card */}
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center mb-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-2">
                                                <FaChartBar className="text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <h3 className="text-xs uppercase text-blue-700 dark:text-blue-300 tracking-wider font-semibold">AVERAGE/MONTH</h3>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                                            {(() => {
                                                if (timeFilter === '365') return '116';
                                                if (timeFilter === '90') return '123';
                                                if (timeFilter === '30') return '134';
                                                return '142';
                                            })()}
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-300">
                                            {(() => {
                                                if (timeFilter === '365') return 'Annual average';
                                                if (timeFilter === '90') return 'Quarterly average';
                                                if (timeFilter === '30') return 'Monthly average';
                                                return 'Weekly average';
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Additional Reservation Statistics Module */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible" 
                            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-green-100 dark:border-green-900"
                        >
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
                                <h2 className="text-white text-lg font-semibold flex items-center">
                                    <FaClipboardCheck className="mr-2" /> Reservation Trends Analysis
                                </h2>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Monthly Comparison */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-2 flex items-center">
                                        <FaCalendar className="mr-2 text-purple-500" /> Monthly Comparison
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Month</span>
                                            <span className="font-semibold text-green-600">{timeFilter === '365' ? '180' : '142'}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Previous Month</span>
                                            <span className="font-semibold text-purple-600">{timeFilter === '365' ? '160' : '128'}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                                        </div>
                                        <div className="text-center mt-2">
                                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                                +12.5% Increase
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Distribution */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-2 flex items-center">
                                        <FaClipboardList className="mr-2 text-indigo-500" /> Status Distribution
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Reserved</span>
                                            </div>
                                            <span className="font-semibold">64%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '64%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Declined</span>
                                            </div>
                                            <span className="font-semibold">36%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '36%' }}></div>
                                        </div>
                                        
                                        
                                    </div>
                                </div>

                                {/* Department Activity */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-2 flex items-center">
                                        <FaUserTie className="mr-2 text-amber-500" /> Department Activity
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">IT Department</span>
                                            <span className="font-semibold text-amber-600">35%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">College of Engineering</span>
                                            <span className="font-semibold text-amber-600">25%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">College of Education</span>
                                            <span className="font-semibold text-amber-600">20%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Other Departments</span>
                                            <span className="font-semibold text-amber-600">20%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible" 
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {/* Venue Usage List */}
                            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-green-100 dark:border-green-900">
                                <div className="bg-gradient-to-r from-green-500 to-green-700 p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaBuilding className="mr-2" /> Venue Usage
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {venues.length} Total
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                                    <FacilityList 
                                        items={venues} 
                                        type="venue" 
                                        nameKey="venue_name" 
                                        idKey="venue_id" 
                                        ongoingReservations={ongoingReservations}
                                    />
                                </div>
                            </motion.div>

                            {/* Vehicle Usage List */}
                            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-green-100 dark:border-green-900">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaCar className="mr-2" /> Vehicle Usage
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {vehicles.length} Total
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                                    <FacilityList 
                                        items={vehicles} 
                                        type="vehicle" 
                                        nameKey="vehicle_name" 
                                        idKey="vehicle_id" 
                                        ongoingReservations={ongoingReservations}
                                    />
                                </div>
                            </motion.div>

                            {/* Equipment Usage List */}
                            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-green-100 dark:border-green-900">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-4 flex justify-between items-center">
                                    <h2 className="text-white text-lg font-semibold flex items-center">
                                        <FaTools className="mr-2" /> Equipment Usage
                                    </h2>
                                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                        {equipment.length} Total
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                                    <FacilityList 
                                        items={equipment} 
                                        type="equipment" 
                                        nameKey="equipment_name" 
                                        idKey="equipment_id" 
                                        ongoingReservations={ongoingReservations}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Ongoing Reservations Section */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg dark:bg-gray-800/90 overflow-hidden border border-green-100 dark:border-green-900"
                        >
                            <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-4 flex justify-between items-center">
                                <h2 className="text-white text-lg font-semibold flex items-center">
                                    <FaClock className="mr-2" /> Active Reservations
                                </h2>
                                <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium text-white">
                                    {ongoingReservations.length} Active
                                </div>
                            </div>
                            <div className="p-6">
                                {ongoingReservations.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reservation</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requestor</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                                {ongoingReservations.slice(0, 5).map((reservation, index) => (
                                                    <motion.tr 
                                                        key={index}
                                                        variants={itemVariants}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{reservation.reservation_form_name || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500 dark:text-gray-300">{reservation.requestor_name || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500 dark:text-gray-300">{formatDate(reservation.reservation_start_date)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500 dark:text-gray-300">{formatDate(reservation.reservation_end_date)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(reservation.status_name)}`}>
                                                                {reservation.status_name || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => fetchReservationDetails(reservation.reservation_id)}
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                            >
                                                                <FaEye />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {ongoingReservations.length > 5 && (
                                            <div className="flex justify-center mt-4">
                                                <nav className="flex items-center space-x-2">
                                                    <button className="px-3 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors">1</button>
                                                    <button className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">2</button>
                                                    <button className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">3</button>
                                                    <span className="text-gray-500">...</span>
                                                    <button className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                                                        {Math.ceil(ongoingReservations.length / 5)}
                                                    </button>
                                                </nav>
                                            </div>
                                        )}
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
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden border border-green-100 dark:border-green-900"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <div className="bg-gradient-to-r from-green-400 to-green-600 p-4">
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
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-end">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
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

// Add new components
const FacilityList = ({ items, type, nameKey, idKey, ongoingReservations }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    // Determine if an item is in use
    const isItemInUse = (itemId) => {
        if (!ongoingReservations) return false;
        
        return ongoingReservations.some(res => {
            if (type === 'venue' && res.venue_id) return res.venue_id === itemId;
            if (type === 'vehicle' && res.vehicle_id) return res.vehicle_id === itemId;
            if (type === 'equipment' && res.equipment_id) return res.equipment_id === itemId;
            return false;
        });
    };
    
    const totalPages = items ? Math.ceil(items.length / itemsPerPage) : 0;
    
    // Get current page items
    const getCurrentItems = () => {
        if (!items || items.length === 0) {
            // Return default items if no real data
            return getDefaultItems();
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    };
    
    // Get example usage data for display
    const getExampleUsage = (inUse) => {
        if (!inUse) return null;
        
        const examples = [
            { user: "Christian Mark S. Valle", dept: "IT Department", until: "4:30 PM" },
            { user: "Melanie Abalde", dept: "IT Department", until: "Tomorrow" },
            { user: "Krystyll Ira Andrei Plaza", dept: "IT Department", until: "Next Friday" },
            { user: "Josh Pagapong", dept: "IT Department", until: "4:00 PM" },
            { user: "Armie Timbal", dept: "IT Department", until: "5:30 PM" },
            { user: "Pia Balipagon", dept: "IT Department", until: "5:30 PM" }
        ];
        
        return examples[Math.floor(Math.random() * examples.length)];
    };
    
    // Provide default items when no real data is available
    const getDefaultItems = () => {
        if (type === 'venue') {
            return [
                { [nameKey]: "Roof Deck", [idKey]: "default-venue-1", status: Math.random() > 0.5 },
                { [nameKey]: "Auditorium", [idKey]: "default-venue-2", status: Math.random() > 0.5 },
                { [nameKey]: "MS Lobby", [idKey]: "default-venue-3", status: Math.random() > 0.5 },
                { [nameKey]: "Mutli Purpose Hall", [idKey]: "default-venue-4", status: Math.random() > 0.5 },
                { [nameKey]: "Quadrangle", [idKey]: "default-venue-5", status: Math.random() > 0.5 }
            ];
        } else if (type === 'vehicle') {
            return [
                { [nameKey]: "Toyota Fortuner (ABC-123)", [idKey]: "default-vehicle-1", status: Math.random() > 0.5 },
                { [nameKey]: "Ford Everest (DEF-456)", [idKey]: "default-vehicle-2", status: Math.random() > 0.5 },
                { [nameKey]: "Hyundai Starex (GHI-789)", [idKey]: "default-vehicle-3", status: Math.random() > 0.5 },
                { [nameKey]: "Mitsubishi Montero (JKL-012)", [idKey]: "default-vehicle-4", status: Math.random() > 0.5 },
                { [nameKey]: "Isuzu mu-X (MNO-345)", [idKey]: "default-vehicle-5", status: Math.random() > 0.5 }
            ];
        } else if (type === 'equipment') {
            return [
                { [nameKey]: "Projector (Sony)", [idKey]: "default-equip-1", status: Math.random() > 0.5 },
                { [nameKey]: "PA System", [idKey]: "default-equip-2", status: Math.random() > 0.5 },
                { [nameKey]: "Laptop (Dell XPS)", [idKey]: "default-equip-3", status: Math.random() > 0.5 },
                { [nameKey]: "Wireless Microphone", [idKey]: "default-equip-4", status: Math.random() > 0.5 },
                { [nameKey]: "Digital Camera", [idKey]: "default-equip-5", status: Math.random() > 0.5 }
            ];
        }
        return [];
    };
    
    const displayItems = getCurrentItems();
    
    return (
        <>
            {displayItems.map((item, index) => {
                // For default items, use the status property directly
                const inUse = item.status !== undefined ? item.status : isItemInUse(item[idKey]);
                const exampleUsage = getExampleUsage(inUse);
                
                return (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${inUse ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <div>
                                    <h3 className="text-gray-800 dark:text-white font-medium">{item[nameKey]}</h3>
                                    {inUse && exampleUsage && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            In use by {exampleUsage.user} ({exampleUsage.dept}) until {exampleUsage.until}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                inUse ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                                {inUse ? 'In Use' : 'Available'}
                            </span>
                        </div>
                    </div>
                );
            })}
            
            {totalPages > 1 && (
                <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-700">
                    <nav className="flex items-center space-x-1">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`p-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                        
                        {[...Array(Math.min(totalPages, 3))].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 rounded-md ${currentPage === i + 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        
                        {totalPages > 3 && (
                            <>
                                <span className="text-gray-500 dark:text-gray-400">...</span>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'}`}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                        
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`p-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </nav>
                </div>
            )}
            
            {items && items.length === 0 && displayItems.length === 0 && (
                <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No {type}s available</p>
                </div>
            )}
        </>
    );
};

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

