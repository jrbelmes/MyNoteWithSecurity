import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FaClipboardList, FaCar, FaUsers, FaBuilding, FaTools, FaUserTie, FaEye } from 'react-icons/fa';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend);

const formatDate = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

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

    const fetchChartData = useCallback(async () => {
        try {
            const response = await fetch('http://localhost/coc/gsd/get_chart_data.php');
            const result = await response.json();

            if (result.status === 'success') {
                setReservationChartData({
                    labels: result.data.labels,
                    datasets: [{
                        label: 'Reservations',
                        data: result.data.values,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                });

                setTotalReservationsData({
                    labels: ['Vehicles', 'Venues', 'Equipment'],
                    datasets: [{
                        data: [result.data.vehicleReservations, result.data.venueReservations, result.data.equipmentReservations],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                    }]
                });

                setUserActivityData({
                    labels: result.data.userActivityLabels,
                    datasets: [{
                        label: 'User Activity',
                        data: result.data.userActivityValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    }]
                });
            } else {
                console.error('Error fetching chart data:', result.message);
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('http://localhost/coc/gsd/get_notifications.php');
            const result = await response.json();

            if (result.status === 'success') {
                setNotifications(result.data);
            } else {
                console.error('Error fetching notifications:', result.message);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
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

    useEffect(() => {
        if (!loading) {
            fetchChartData();
            fetchNotifications();
            fetchVenues();
            fetchVehicles();
            fetchEquipment();
            fetchReservations();
        }
    }, [loading, fetchChartData, fetchNotifications, fetchVenues, fetchVehicles, fetchEquipment, fetchReservations]);

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
            <div className="main-content flex-1 p-6 ml-4 bg-gradient-to-br from-green-50 to-white overflow-y-auto">
                <motion.h2 
                    className="text-3xl font-bold mb-6 text-green-800 right-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Dashboard
                </motion.h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
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
                            className={`bg-gradient-to-br ${cardColors[index]} rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-4xl mb-2">{item.icon}</div>
                                <p className="text-sm font-medium mb-1">{item.title}</p>
                                <p className="text-2xl font-bold">{item.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {reservationChartData && (
                        <motion.div 
                            className="bg-white rounded-lg shadow-lg p-6 border border-green-200"
                            variants={chartVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <h3 className="text-xl font-semibold mb-4 text-green-800">Reservations Over Time</h3>
                            <Line data={reservationChartData} options={{ maintainAspectRatio: false, height: 300 }} />
                        </motion.div>
                    )}
                    {totalReservationsData && (
                        <motion.div 
                            className="bg-white rounded-lg shadow-lg p-6 border border-green-200"
                            variants={chartVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="text-xl font-semibold mb-4 text-green-800">Total Reservations by Type</h3>
                            <Doughnut data={totalReservationsData} options={{ maintainAspectRatio: false, height: 300 }} />
                        </motion.div>
                    )}
                </div>

                {userActivityData && (
                    <motion.div 
                        className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-green-200"
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <h3 className="text-xl font-semibold mb-4 text-green-800">User Activity</h3>
                        <Bar data={userActivityData} options={{ maintainAspectRatio: false, height: 300 }} />
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <motion.div 
                        className="bg-white rounded-lg shadow-lg p-6 border border-green-200"
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-xl font-semibold mb-4 text-green-800">Available Vehicles</h3>
                        <div className="overflow-y-auto max-h-80">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Make</th>
                                        <th className="px-4 py-2">Model</th>
                                        <th className="px-4 py-2">License</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicles.map((vehicle, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="px-4 py-2">{vehicle.vehicle_make_name}</td>
                                            <td className="px-4 py-2">{vehicle.vehicle_model_name}</td>
                                            <td className="px-4 py-2">{vehicle.vehicle_license}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="bg-white rounded-lg shadow-lg p-6 border border-green-200"
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h3 className="text-xl font-semibold mb-4 text-green-800">Available Equipment</h3>
                        <div className="overflow-y-auto max-h-80">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipment.map((item, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="px-4 py-2">{item.equip_name}</td>
                                            <td className="px-4 py-2">{item.equip_quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="bg-white rounded-lg shadow-lg p-6 border border-green-200"
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <h3 className="text-xl font-semibold mb-4 text-green-800">Available Venues</h3>
                        <div className="overflow-y-auto max-h-80">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Occupancy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {venues.map((venue, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="px-4 py-2">{venue.ven_name}</td>
                                            <td className="px-4 py-2">{venue.ven_occupancy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                <motion.div 
                    className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-green-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h3 className="text-xl font-semibold mb-4 text-green-800">Recent Reservations</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-200">
                                <tr>
                                   
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Event Title</th>
                                    <th className="px-4 py-2">Created</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReservations.map((reservation) => (
                                    <tr key={reservation.reservation_id} className="hover:bg-gray-100">
                                        
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
            </div>
        </div>
    );
};

export default Dashboard;
