import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaPlus, FaClock, FaCalendar, FaUser, FaEye, FaEdit, FaBuilding, FaTools, FaUsers, FaCheckCircle, FaUserShield, FaCar, FaMapMarkedAlt, FaFileAlt, FaIdCard, FaTags } from 'react-icons/fa';
import { FiCalendar, FiList, FiHelpCircle, FiBell, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReservationCalendar from '../components/ReservationCalendar';


// Add this animation variants object before the component
const navButtonVariants = {
    hover: {
        scale: 1.05,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    tap: {
        scale: 0.95
    }
};

const ViewReserve = () => {
    
    const navigate = useNavigate();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [reservations, setReservations] = useState([]);
    const [currentReservation, setCurrentReservation] = useState({
        name: '',
        date: '',
        time: '',
        guests: 1,
        notes: '',
        type: 'dinner',
        status: 'pending'
    });
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    // Add these new state variables with the other useState declarations
    const [notifications, setNotifications] = useState(0);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [detailedReservation, setDetailedReservation] = useState(null);

    const statusColors = {
        confirmed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const handleCancelReservation = (reservation) => {
        setReservationToCancel(reservation);
        setShowCancelModal(true);
    };

    const confirmCancelReservation = async () => {
        try {
            const formData = new URLSearchParams();
            formData.append('reservation_id', reservationToCancel.id);
            formData.append('operation', 'cancelReservation');

            const response = await fetch('http://localhost/coc/gsd/fetch_reserve.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Update the local state
                setReservations(prevReservations =>
                    prevReservations.map(res =>
                        res.id === reservationToCancel.id
                            ? { ...res, status: 'cancelled' }
                            : res
                    )
                );
                toast.success('Reservation cancelled successfully!');
            } else {
                toast.error(result.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            toast.error('Failed to cancel reservation');
        } finally {
            setShowCancelModal(false);
            setReservationToCancel(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentReservation({ ...currentReservation, [name]: value });
    };

    const handleEdit = async (reservation) => {
        try {
            const formData = new URLSearchParams();
            formData.append('reservation_id', reservation.id);
            formData.append('operation', 'getReservationDetailsById'); // Add operation parameter
            
            const response = await fetch(`http://localhost/coc/gsd/fetch_reserve.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            // Check if response is valid JSON
            const textResponse = await response.text();
            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (error) {
                console.error('Invalid JSON response:', textResponse);
                throw new Error('Invalid server response');
            }
            
            if (result.status === 'success') {
                const { reservation: details, equipment, vehicles, venues } = result.data;
                setCurrentReservation({
                    id: details.reservation_id,
                    name: details.reservation_name,
                    eventTitle: details.reservation_event_title,
                    description: details.reservation_description,
                    startDate: details.reservation_start_date.split(' ')[0],
                    startTime: details.reservation_start_date.split(' ')[1],
                    endDate: details.reservation_end_date.split(' ')[0],
                    endTime: details.reservation_end_date.split(' ')[1],
                    status: details.status_master_name,
                    userName: details.users_name,
                    userContact: details.users_contact_number,
                    equipment: equipment,
                    vehicles: vehicles,
                    venues: venues
                });
                setEditModalOpen(true);
            } else {
                throw new Error(result.message || 'Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('Error fetching reservation details:', error);
            // Optionally add user notification here
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentReservation.id) {
            // Update existing reservation
            const updatedReservations = reservations.map(r => 
                r.id === currentReservation.id ? { ...r, ...currentReservation } : r
            );
            setReservations(updatedReservations);
        } else {
            // Create new reservation
            const newReservation = {
                ...currentReservation,
                id: Date.now(), // Temporary ID, should be replaced with server-generated ID
                status: 'pending'
            };
            setReservations([...reservations, newReservation]);
        }
        setEditModalOpen(false);
    };

    const formatTimeRange = (dateTimeString) => {
        if (!dateTimeString) return '';
        
        const [info, timeRange] = dateTimeString.split(' - ');
        const [startDateTime, endDateTime] = timeRange.split(' to ');
        
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        
        // Format the date
        const dateStr = startDate.getDate() === endDate.getDate() && 
                       startDate.getMonth() === endDate.getMonth() &&
                       startDate.getFullYear() === endDate.getFullYear()
            ? format(startDate, 'MMM d')
            : `${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d')}`;

        // Format the time
        const startTimeStr = format(startDate, 'ha').toLowerCase();
        const endTimeStr = format(endDate, 'ha').toLowerCase();
        
        return {
            date: dateStr,
            time: `${startTimeStr} to ${endTimeStr}`
        };
    };

    const fetchReservations = async () => {
        try {
            const userId = localStorage.getItem('user_id');
            console.log('Fetching reservations for user:', userId); // Debug log
            
            if (!userId) {
                toast.error('User session expired');
                navigate('/gsd');
                return;
            }

            const response = await fetch('http://localhost/coc/gsd/user1.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'getUserReservations',
                    userId: userId
                })
            });

            const result = await response.json();
            console.log('API response:', result); // Debug log
            
            if (result.status === 'success' && result.data) {
                const transformedReservations = result.data.map(reservation => {
                    const details = reservation.venue_details || reservation.vehicle_details || '';
                    const formattedTime = formatTimeRange(details);
                    
                    return {
                        id: reservation.approval_id,
                        name: reservation.venue_form_name || reservation.vehicle_form_name,
                        date: formattedTime.date,
                        time: formattedTime.time,
                        status: reservation.reservation_status.toLowerCase(),
                        createdAt: reservation.approval_created_at,
                        type: reservation.approval_form_venue_id ? 'venue' : 'vehicle'
                    };
                });
                setReservations(transformedReservations);
            } else {
                throw new Error(result.message || 'Failed to fetch reservations');
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
            toast.error('Failed to fetch reservations');
        }
    };

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        const isLoggedIn = localStorage.getItem('loggedIn');
        
        if (!userId || !isLoggedIn) {
            toast.error('Please login first');
            navigate('/gsd'); // or wherever your login page is
            return;
        }
        
        console.log('User ID:', userId); // Debug log
        fetchReservations();
    }, [navigate]);

    const filteredReservations = reservations.filter(reservation => 
        activeFilter === 'all' ? true : reservation.status === activeFilter
    );

    const handleViewReservation = async (reservation) => {
        try {
            const response = await fetch('http://localhost/coc/gsd/user1.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'getUserReservationDetailsById',
                    approvalId: reservation.id
                })
            });

            const result = await response.json();
            
            if (result.status === 'success' && result.data) {
                setDetailedReservation(result.data[0]);
                setSelectedReservation(reservation);
                setShowViewModal(true);
            } else {
                toast.error('Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('Error fetching reservation details:', error);
            toast.error('Failed to fetch reservation details');
        }
    };

    const handleNavigation = () => {
        navigate('/dashboard'); // Navigate to /dashboard on click
      };

    return (
        <>
            {/* Add ToastContainer at the root level */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            
            {/* Header Component */}
            <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white backdrop-blur-sm bg-opacity-80 shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Logo and GSD Reservation title */}
            <div className="flex items-center space-x-4" onClick={handleNavigation}>
              <motion.img 
                src="/images/assets/phinma.png"
                alt="PHINMA CDO Logo"
                className="w-12 h-12 object-cover rounded-full shadow-md"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
              />
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                GSD Reservation
              </motion.h1>
            </div>

            {/* Right side navigation */}
            <nav className="flex items-center space-x-6">
              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                onClick={() => navigate('/addReservation')}
              >
                <FiCalendar className="w-5 h-5" />
                <span>Make Reserve</span>
              </motion.button>

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                onClick={() => setIsCalendarOpen(true)}
              >
                <FiCalendar className="w-5 h-5" />
                <span>Calendar</span>
              </motion.button>

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => navigate('/viewReserve')}
              >
                <FiList className="w-5 h-5" />
                <span>View Reserve</span>
              </motion.button>

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => navigate('/support')}
              >
                <FiHelpCircle className="w-5 h-5" />
                <span>Support</span>
              </motion.button>

              {/* Notification Bell */}
              <motion.div className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="p-2 text-gray-700 hover:text-green-600 transition-colors">
                  <FiBell className="w-6 h-6" />
                  {notifications > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Settings */}
              

              {/* Profile */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <FiUser className="w-6 h-6" />
              </motion.button>

              {/* Logout */}
              <motion.button
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate('/gsd')}
                className="flex items-center space-x-2 text-red-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </motion.button>
            </nav>
          </div>
        </div>
      </motion.header>

            {/* Main Content */}
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Enhance the main content styles */}
                    

                    <div className="flex gap-4 mb-6">
                        {['all', 'confirmed', 'pending', 'cancelled'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-full capitalize ${
                                    activeFilter === filter
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                } transition duration-300 ease-in-out shadow-sm`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-6">
                        {filteredReservations.map((reservation) => (
                            <motion.div 
                                key={reservation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        {/* Add type indicator */}
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                reservation.type === 'venue' 
                                                    ? 'bg-purple-100 text-purple-700' 
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {reservation.type === 'venue' ? 'Venue' : 'Vehicle'}
                                            </span>
                                            <h3 className="text-xl font-semibold text-gray-800">{reservation.name}</h3>
                                        </div>
                                        
                                        <div className="flex gap-4 text-gray-600">
                                            <span className="flex items-center gap-2">
                                                <FaCalendar className="text-blue-500" />
                                                {reservation.date}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <FaClock className="text-blue-500" />
                                                {reservation.time}
                                            </span>
                                        </div>

                                        
                                    </div>

                                    {/* Status and action buttons */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status]}`}>
                                            {reservation.status}
                                        </span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => handleViewReservation(reservation)}
                                                className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
                                            >
                                                <FaEye size={16} />
                                                <span className="text-sm">View</span>
                                            </button>
                                            {reservation.status !== 'cancelled' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(reservation)}
                                                        className="flex items-center gap-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-full transition-all duration-300"
                                                    >
                                                        <FaEdit size={16} />
                                                        <span className="text-sm">Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelReservation(reservation)}
                                                        className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                                                    >
                                                        <FaTrash size={16} />
                                                        <span className="text-sm">Cancel Reservation</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* View Reservation Modal - VENUE */}
                    {showViewModal && selectedReservation && detailedReservation && selectedReservation.type === 'venue' && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-green-600 to-green-400 px-8 py-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <FaCalendar />
                                            Venue Reservation Details
                                        </h2>
                                        <button 
                                            onClick={() => setShowViewModal(false)} 
                                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Information</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaCalendar className="text-green-500"/>}
                                                        label="Event Title" 
                                                        value={detailedReservation.venue_form_event_title || 'N/A'} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaUser className="text-green-500"/>}
                                                        label="Department" 
                                                        value={detailedReservation.departments_name} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaUsers className="text-green-500"/>}
                                                        label="Participants" 
                                                        value={detailedReservation.venue_participants || 'N/A'} 
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Venue & Equipment</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaBuilding className="text-green-500"/>}
                                                        label="Venue" 
                                                        value={detailedReservation.venue_name || 'N/A'} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaTools className="text-green-500"/>}
                                                        label="Equipment" 
                                                        value={
                                                            detailedReservation.equipment_name 
                                                                ? `${detailedReservation.equipment_name} (${detailedReservation.reservation_equipment_quantity})`
                                                                : 'No equipment requested'
                                                        } 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaClock className="text-green-500"/>}
                                                        label="Start Date & Time" 
                                                        value={format(new Date(detailedReservation.venue_form_start_date), 'MMM dd, yyyy HH:mm')} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaClock className="text-green-500"/>}
                                                        label="End Date & Time" 
                                                        value={format(new Date(detailedReservation.venue_form_end_date), 'MMM dd, yyyy HH:mm')} 
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Information</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaCheckCircle className="text-green-500"/>}
                                                        label="GSD Status" 
                                                        value={detailedReservation.current_reservation_status || 'Pending'} 
                                                        className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                                                            statusColors[detailedReservation.current_reservation_status?.toLowerCase() || 'pending']
                                                        }`}
                                                    />
                                                    <InfoField 
                                                        icon={<FaUserShield className="text-green-500"/>}
                                                        label="Dean Status" 
                                                        value={detailedReservation.status_approval_name || 'Pending'} 
                                                        className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                                                            detailedReservation.status_approval_name?.toLowerCase() === 'approve' 
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                   
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 px-8 py-4">
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setShowViewModal(false)} 
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* View Reservation Modal - VEHICLE */}
                    {showViewModal && selectedReservation && detailedReservation && selectedReservation.type === 'vehicle' && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-8 py-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <FaCar />
                                            Vehicle Reservation Details
                                        </h2>
                                        <button 
                                            onClick={() => setShowViewModal(false)} 
                                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reservation Details</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaUser className="text-blue-500"/>}
                                                        label="Reserved By" 
                                                        value={detailedReservation.vehicle_form_user_full_name} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaBuilding className="text-blue-500"/>}
                                                        label="Department" 
                                                        value={detailedReservation.departments_name} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaMapMarkedAlt className="text-blue-500"/>}
                                                        label="Destination" 
                                                        value={detailedReservation.vehicle_form_destination} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaFileAlt className="text-blue-500"/>}
                                                        label="Purpose" 
                                                        value={detailedReservation.vehicle_form_purpose} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaCar className="text-blue-500"/>}
                                                        label="Vehicle" 
                                                        value={`${detailedReservation.vehicle_make} ${detailedReservation.vehicle_model}`} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaIdCard className="text-blue-500"/>}
                                                        label="License Plate" 
                                                        value={detailedReservation.vehicle_license} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaTags className="text-blue-500"/>}
                                                        label="Category" 
                                                        value={detailedReservation.vehicle_category} 
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule</h3>
                                                <div className="space-y-4">
                                                    <InfoField 
                                                        icon={<FaClock className="text-blue-500"/>}
                                                        label="Start Date & Time" 
                                                        value={format(new Date(detailedReservation.vehicle_form_start_date), 'MMM dd, yyyy HH:mm')} 
                                                    />
                                                    <InfoField 
                                                        icon={<FaClock className="text-blue-500"/>}
                                                        label="End Date & Time" 
                                                        value={format(new Date(detailedReservation.vehicle_form_end_date), 'MMM dd, yyyy HH:mm')} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {detailedReservation.passenger_names && (
                                        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Passengers</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {detailedReservation.passenger_names.split(',').map((passenger, index) => (
                                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                        {passenger.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 px-8 py-4">
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setShowViewModal(false)} 
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Cancel Reservation Modal */}
                    {showCancelModal && reservationToCancel && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all duration-300 ease-in-out"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Confirm Cancellation</h2>
                                    <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                        &times;
                                    </button>
                                </div>
                                <p>Are you sure you want to cancel the reservation "{reservationToCancel.name}"?</p>
                                <div className="flex justify-end mt-6 gap-4">
                                    <button 
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                        onClick={() => setShowCancelModal(false)}
                                    >
                                        No, Keep Reservation
                                    </button>
                                    <button 
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                        onClick={confirmCancelReservation}
                                    >
                                        Yes, Cancel Reservation
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Edit Reservation Modal */}
                    {editModalOpen && currentReservation && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl p-8 w-full max-w-4xl transform transition-all duration-300 ease-in-out"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Edit Reservation
                                    </h2>
                                    <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        &times;
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Event Title</label>
                                                <input
                                                    type="text"
                                                    name="eventTitle"
                                                    value={currentReservation.eventTitle}
                                                    onChange={handleChange}
                                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={currentReservation.description}
                                                    onChange={handleChange}
                                                    rows={3}
                                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Date and Time */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        value={currentReservation.startDate}
                                                        onChange={handleChange}
                                                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                                    <input
                                                        type="time"
                                                        name="startTime"
                                                        value={currentReservation.startTime}
                                                        onChange={handleChange}
                                                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                                    <input
                                                        type="date"
                                                        name="endDate"
                                                        value={currentReservation.endDate}
                                                        onChange={handleChange}
                                                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                                                    <input
                                                        type="time"
                                                        name="endTime"
                                                        value={currentReservation.endTime}
                                                        onChange={handleChange}
                                                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Display read-only information */}
                                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-4">Additional Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Venues</p>
                                                <p className="text-gray-700">{currentReservation.venues?.map(v => v.ven_name).join(', ') || 'None'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Equipment</p>
                                                <p className="text-gray-700">{currentReservation.equipment?.map(e => `${e.equip_name} (${e.quantity})`).join(', ') || 'None'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Vehicles</p>
                                                <p className="text-gray-700">{currentReservation.vehicles?.map(v => v.vehicle_license).join(', ') || 'None'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditModalOpen(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </div>
                
            </div>
        </>
    );
};

const InfoField = ({ label, value, className, icon }) => (
    <div>
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        </div>
        <p className={`mt-1 ${className || 'text-gray-900'}`}>{value}</p>
    </div>
);

export default ViewReserve;
