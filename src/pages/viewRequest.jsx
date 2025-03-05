import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import {Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaCar, FaBuilding, FaTools, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogContainer,
} from '../components/core/dialog';
import { Loader2 } from 'lucide-react';
import { Modal, Tabs, Badge, Descriptions, Space, Tag, Timeline, Button, Alert } from 'antd';
import { 
    CarOutlined, 
    BuildOutlined, 
    ToolOutlined,
    UserOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined
} from '@ant-design/icons';

const ReservationRequests = () => {
    const [reservations, setReservations] = useState([]);
    const [userLevel, setUserLevel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [reservationDetails, setReservationDetails] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [availabilityData, setAvailabilityData] = useState(null);
    const navigate = useNavigate();
    const user_level_id = localStorage.getItem('user_level_id');

    const user_id = localStorage.getItem('user_id');

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'fetchRequestReservation'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                setReservations(response.data.data);
            } else {
                toast.error('No pending reservations found.');
            }
        } catch (error) {
            toast.error('Error fetching reservations. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'fetchRequestById',
                approval_id: reservationId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data?.status === 'success') {
                const details = response.data.data[0];
                // Handle case where equipment is undefined or null
                if (!details.equipment) {
                    details.equipment = {
                        equipment_name: "No Equipment added",
                        reservation_equipment_quantity: 0,
                        equip_id: null
                    };
                }
                setReservationDetails(details);
                setCurrentRequest({
                    approval_id: details.approval_id,
                    reservation_id: details.reservation_id
                });
                
                // Immediately check availability after setting details
                const startDate = details.venue?.venue_form_start_date || details.vehicle?.vehicle_form_start_date;
                const endDate = details.venue?.venue_form_end_date || details.vehicle?.vehicle_form_end_date;
                
                if (startDate && endDate) {
                    const availabilityResponse = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                        operation: 'doubleCheckAvailability',
                        start_datetime: startDate,
                        end_datetime: endDate
                    });

                    if (availabilityResponse.data?.status === 'success') {
                        setAvailabilityData(availabilityResponse.data.data);
                    }
                }
                
                setIsDetailModalOpen(true);
            } else {
                toast.error('Failed to fetch reservation details.');
            }
        } catch (error) {
            toast.error('Error fetching reservation details. Please try again later.');
        }
    };

    const checkAvailability = async (details) => {
        try {
            // Determine the correct start and end dates based on the reservation type
            let startDate, endDate;
            
            if (details.venue) {
                startDate = details.venue.venue_form_start_date;
                endDate = details.venue.venue_form_end_date;
            } else if (details.vehicle) {
                startDate = details.vehicle.vehicle_form_start_date;
                endDate = details.vehicle.vehicle_form_end_date;
            }

            console.log('Checking availability with dates:', { startDate, endDate });

            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'doubleCheckAvailability',
                start_datetime: startDate,
                end_datetime: endDate
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                console.log('Availability response:', response.data.data);
                setAvailabilityData(response.data.data);
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            toast.error('Error checking resource availability.');
        }
    };

    const isAnyResourceUnavailable = (availabilityData, details) => {
        if (!availabilityData) return false;

        let isUnavailable = false;

        // Check venue availability
        if (details.venue) {
            const isVenueUnavailable = availabilityData.unavailable_venues?.some(
                v => v.ven_id === details.venue.venue_id
            );
            console.log('Venue unavailable:', isVenueUnavailable);
            if (isVenueUnavailable) isUnavailable = true;
        }

        // Check vehicle availability
        if (details.vehicle) {
            const isVehicleUnavailable = availabilityData.unavailable_vehicles?.some(
                v => v.vehicle_id === details.vehicle.vehicle_id
            );
            console.log('Vehicle unavailable:', isVehicleUnavailable);
            if (isVehicleUnavailable) isUnavailable = true;
        }

        // Check equipment availability
        if (details.equipment) {
            const isEquipmentUnavailable = availabilityData.unavailable_equipment?.some(
                e => e.equip_id === details.equipment.equip_id
            );
            console.log('Equipment unavailable:', isEquipmentUnavailable);
            if (isEquipmentUnavailable) isUnavailable = true;
        }

        return isUnavailable;
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: true
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation accepted successfully!', {
                    icon: '✅',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDetailModalOpen(false); // Close the detail modal
            } else {
                toast.error('Failed to accept reservation.');
            }
        } catch (error) {
            toast.error(`Error accepting reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: false
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation declined successfully!', {
                    icon: '❌',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDeclineModalOpen(false); // Close the decline modal
                setIsDetailModalOpen(false);  // Also close the detail modal
            } else {
                toast.error('Failed to decline reservation.');
            }
        } catch (error) {
            console.error('Decline error:', error);
            toast.error('Error declining reservation. Please try again.');
        } finally {
            setIsDeclining(false);
        }
    };

    const getIconForType = (type) => {
        const icons = {
            Equipment: <FaTools className="mr-2 text-orange-500" />,
            Venue: <FaBuilding className="mr-2 text-green-500" />,
            Vehicle: <FaCar className="mr-2 text-blue-500" />,
        };
        return icons[type] || null;
    };

    useEffect(() => {
        const level = localStorage.getItem('user_level');
        setUserLevel(level);
        fetchReservations();
    }, []);

    const filteredReservations = reservations.filter(reservation => 
        (filter === 'All' || (reservation.type && reservation.type === filter)) &&
        (searchTerm === '' || reservation.reservation_id.toString().includes(searchTerm) || 
         reservation.reservations_users_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!startDate || new Date(reservation.reservation_start_date) >= startDate) &&
        (!endDate || new Date(reservation.reservation_end_date) <= endDate)
    );

    // Add this helper function for status styling
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'approve':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'decline':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Replace the existing card rendering code in the return statement
    return (
        <div className="flex flex-col lg:flex-row bg-gradient-to-br from-white to-green-100">
            <Sidebar />
            <div className="flex-grow p-8 lg:p-12">
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-bold mb-8 text-gray-800"
                >
                    Reservation Requests
                </motion.h2>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8 flex flex-wrap items-center gap-4"
                >
                    <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                        <FaFilter className="text-gray-400 mr-2" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-gray-700"
                        >
                            <option value="All">All Types</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="Venue">Venue</option>
                            <option value="Equipment">Equipment</option>
                        </select>
                    </div>
                    <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                        <FaSearch className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search by ID or User"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-gray-700"
                        />
                    </div>
                    <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => {
                                setDateRange(update);
                            }}
                            placeholderText="Filter by date range"
                            className="bg-transparent border-none focus:outline-none text-gray-700"
                        />
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner animation="border" role="status" className="text-blue-500">
                            <span className="sr-only">Loading...</span>
                        </Spinner>
                    </div>
                ) : (
                    <AnimatePresence>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredReservations.length > 0 ? (
                                filteredReservations.map((reservation, index) => (
                                    <motion.div 
                                        key={reservation.approval_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col gap-4">
                                                {/* Status Badge */}
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(reservation.approval_status)}`}>
                                                    {reservation.approval_status || 'Unknown Status'}
                                                </div>
                                                
                                                {/* Request ID, Form Name, and Type */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="text-2xl font-semibold text-gray-800">{reservation.venue_form_name || reservation.vehicle_form_name || 'Unnamed Form'}</h3>
                                                        {getIconForType(reservation.type)}
                                                    </div>
                                                    
                                                </div>

                                                {/* Request Details */}
                                                <div className="space-y-2 text-sm">
                                                    <p className="text-gray-600">
                                                        <span className="font-medium text-gray-700">Created:</span> {' '}
                                                        {new Date(reservation.approval_created_at).toLocaleString()}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-medium text-gray-700">Request Type:</span> {' '}
                                                        {reservation.venue_form_name ? 'Venue' : 'Vehicle'}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-medium text-gray-700">Reservation Status:</span> {' '}
                                                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                                            {reservation.reservation_status}
                                                        </span>
                                                    </p>
                                                </div>

                                                {/* View Details Button */}
                                                <button
                                                    className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                    onClick={() => {
                                                        setCurrentRequest(reservation.approval_id);
                                                        fetchReservationDetails(reservation.approval_id);
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-gray-600 col-span-full text-center py-12"
                                >
                                    No requests found.
                                </motion.p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Detail Modal for Accepting */}
                <DetailModal 
                    visible={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setAvailabilityData(null);
                        setCurrentRequest(null);
                        setReservationDetails(null);
                    }}
                    reservationDetails={reservationDetails}
                    availabilityData={availabilityData}
                    onAccept={handleAccept}
                    onDecline={() => setIsDeclineModalOpen(true)}
                    isAccepting={isAccepting}
                    isDeclining={isDeclining}
                />

                {/* Confirmation Modal for Declining */}
                <Modal
                    title="Confirm Decline"
                    visible={isDeclineModalOpen}
                    onCancel={() => setIsDeclineModalOpen(false)}
                    footer={[
                        <Button key="back" onClick={() => setIsDeclineModalOpen(false)}>
                            Cancel
                        </Button>,
                        <Button 
                            key="submit" 
                            type="primary" 
                            danger
                            loading={isDeclining}
                            onClick={handleDecline}
                        >
                            Decline
                        </Button>,
                    ]}
                >
                    <p>Are you sure you want to decline this reservation? This action cannot be undone.</p>
                </Modal>
            </div>
        </div>
    );
};

// Add this utility function before the DetailModal component
const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isSameDay = start.toDateString() === end.toDateString();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (isSameDay) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(start)} to ${formatTime(end)}`;
    } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
    }
};

const DetailModal = ({ visible, onClose, reservationDetails, availabilityData, onAccept, onDecline, isAccepting, isDeclining }) => {
    const { TabPane } = Tabs;
    const [isResourceAvailable, setIsResourceAvailable] = useState(true);

    useEffect(() => {
        const checkResourceAvailability = () => {
            if (!availabilityData || !reservationDetails) return true;

            let isAvailable = true;

            // If it's a vehicle request, check both vehicle and driver availability
            if (reservationDetails.vehicle) {
                // Check vehicle availability
                const isVehicleUnavailable = availabilityData.unavailable_vehicles?.some(
                    v => v.vehicle_id === reservationDetails.vehicle.vehicle_id
                );

                // Check driver availability if driver is assigned
                const isDriverUnavailable = reservationDetails.vehicle.driver_id && 
                    availabilityData.unavailable_drivers?.some(
                        driver => driver.driver_id === reservationDetails.vehicle.driver_id
                    );

                // If either vehicle or driver is unavailable, the resource is not available
                if (isVehicleUnavailable || isDriverUnavailable) {
                    isAvailable = false;
                }
            }

            // Check venue availability
            if (reservationDetails.venue) {
                const isVenueUnavailable = availabilityData.unavailable_venues?.some(
                    v => v.ven_id === reservationDetails.venue.ven_id
                );
                if (isVenueUnavailable) {
                    isAvailable = false;
                }
            }

            // Check equipment availability
            if (reservationDetails.equipment?.equip_id) {
                const isEquipmentUnavailable = availabilityData.unavailable_equipment?.some(
                    e => e.equip_id === reservationDetails.equipment.equip_id
                );
                if (isEquipmentUnavailable) {
                    isAvailable = false;
                }
            }

            setIsResourceAvailable(isAvailable);
        };

        checkResourceAvailability();
    }, [availabilityData, reservationDetails]);

    if (!reservationDetails) return null;

    // Enhanced debug logging
    console.log('DetailModal Reservation Details:', {
        vehicle: reservationDetails.vehicle,
        venue: reservationDetails.venue,
        dates: {
            vehicleStartDate: reservationDetails.vehicle?.vehicle_form_start_date,
            vehicleEndDate: reservationDetails.vehicle?.vehicle_form_end_date,
            venueStartDate: reservationDetails.venue?.venue_form_start_date,
            venueEndDate: reservationDetails.venue?.venue_form_end_date,
            rootStartDate: reservationDetails.start,
            rootEndDate: reservationDetails.end
        }
    });

    // Revised availability check functions
    const isVenueAvailable = (venueId) => {
        return !availabilityData?.unavailable_venues?.some(
            venue => venue.ven_id === venueId
        );
    };

    const isVehicleAvailable = (vehicleId) => {
        return !availabilityData?.unavailable_vehicles?.some(
            vehicle => vehicle.vehicle_id === vehicleId
        );
    };

    const isEquipmentAvailable = (equipId) => {
        return !availabilityData?.unavailable_equipment?.some(
            equip => equip.equip_id === equipId
        );
    };

    const isDriverAvailable = (driverId, driverName) => {
        const isUnavailable = availabilityData?.unavailable_drivers?.some(
            driver => driver.driver_id === driverId
        );
        console.log('Driver availability check:', {
            driverId,
            driverName,
            unavailableDrivers: availabilityData?.unavailable_drivers,
            isAvailable: !isUnavailable
        });
        return !isUnavailable;
    };

    const getDriverDetails = (driverId) => {
        return availabilityData?.unavailable_drivers?.find(
            driver => driver.driver_id === driverId
        );
    };

    // Updated badge renderer
    const getAvailabilityBadge = (isAvailable) => (
        <Tag color={isAvailable ? 'success' : 'error'}>
            {isAvailable ? 'Available' : 'Not Available On Schedule'}
        </Tag>
    );

    const isResourceUnavailable = () => {
        if (!availabilityData || !reservationDetails) return false;

        // Check venue availability
        if (reservationDetails.venue) {
            const isUnavailable = availabilityData.unavailable_venues?.some(
                venue => venue.ven_id === reservationDetails.venue.ven_id
            );
            console.log('Venue availability check:', {
                requestedVenueId: reservationDetails.venue.ven_id,
                unavailableVenues: availabilityData.unavailable_venues,
                isUnavailable
            });
            if (isUnavailable) return true;
        }

        // Check vehicle availability
        if (reservationDetails.vehicle) {
            const isVehicleUnavailable = availabilityData.unavailable_vehicles?.some(
                v => v.vehicle_id === reservationDetails.vehicle.vehicle_id
            );
            if (isVehicleUnavailable) return true;
        }

        // Check equipment availability
        if (reservationDetails.equipment) {
            const isEquipmentUnavailable = availabilityData.unavailable_equipment?.some(
                e => e.equip_id === reservationDetails.equipment.equip_id
            );
            if (isEquipmentUnavailable) return true;
        }

        return false;
    };

    const getUnavailabilityMessage = () => {
        const messages = [];
        
        if (!availabilityData) return null;

        // Check driver availability first
        if (reservationDetails.vehicle?.driver_id) {
            const driverUnavailable = availabilityData.unavailable_drivers?.find(
                driver => driver.driver_id === reservationDetails.vehicle.driver_id
            );
            if (driverUnavailable) {
                messages.push(`Driver ${driverUnavailable.driver_full_name} is not available for the requested schedule`);
            }
        }

        // Then check other resources
        if (reservationDetails.venue) {
            const venueUnavailable = availabilityData.unavailable_venues?.find(
                v => v.ven_id === reservationDetails.venue.ven_id
            );
            if (venueUnavailable) {
                messages.push(`Venue ${venueUnavailable.ven_name} is not available`);
            }
        }

        if (reservationDetails.equipment) {
            const equipmentUnavailable = availabilityData.unavailable_equipment?.find(
                e => e.equip_id === reservationDetails.equipment.equip_id
            );
            if (equipmentUnavailable) {
                messages.push(`Equipment ${equipmentUnavailable.equip_name} is not available`);
            }
        }

       
    };

    return (
        <Modal
            visible={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                <Button 
                    key="decline" 
                    danger 
                    loading={isDeclining}
                    onClick={onDecline}
                >
                    Decline
                </Button>,
                <Button 
                    key="accept" 
                    type="primary" 
                    loading={isAccepting}
                    onClick={onAccept}
                    disabled={!isResourceAvailable}
                    style={{ 
                        backgroundColor: isResourceAvailable ? '#52c41a' : '#d9d9d9',
                        cursor: !isResourceAvailable ? 'not-allowed' : 'pointer'
                    }}
                >
                    {!isResourceAvailable ? 'Resources Unavailable' : 'Reserve'}
                </Button>,
            ]}
            title={
                <Space>
                    <span>
                        {reservationDetails.vehicle ? 
                            `Vehicle Form: ${reservationDetails.vehicle.vehicle_form_name}` : 
                            reservationDetails.venue ? 
                            `Venue Form: ${reservationDetails.venue.venue_form_name}` : 
                            'Request Details'}
                    </span>
                    <Badge 
                        status={reservationDetails.status_request === 'pending' ? 'processing' : 'success'} 
                        text={reservationDetails.status_request}
                    />
                </Space>
            }
        >
            {getUnavailabilityMessage()}
            <Tabs defaultActiveKey="1">
                {reservationDetails.vehicle?.vehicle_form_name && (
                    <TabPane
                        tab={
                            <span>
                                <CarOutlined />
                                Vehicle Details
                            </span>
                        }
                        key="1"
                    >
                        <Descriptions bordered column={2}>
                            <Descriptions.Item 
                                label={
                                    <Space>
                                        Vehicle Status
                                        {getAvailabilityBadge(isVehicleAvailable(reservationDetails.vehicle.vehicle_id))}
                                    </Space>
                                } 
                                span={2}
                            >
                                {reservationDetails.vehicle.license} - {reservationDetails.vehicle.model} {reservationDetails.vehicle.make}
                            </Descriptions.Item>
                            <Descriptions.Item label="Model">
                                {reservationDetails.vehicle.model}
                            </Descriptions.Item>
                            <Descriptions.Item label="Make">
                                {reservationDetails.vehicle.make}
                            </Descriptions.Item>
                            <Descriptions.Item label="Category" span={2}>
                                <Tag color="blue">{reservationDetails.vehicle.category}</Tag>
                            </Descriptions.Item>
                            
                            <Descriptions.Item label="Purpose" span={2}>
                                {reservationDetails.vehicle.vehicle_form_purpose}
                            </Descriptions.Item>
                            <Descriptions.Item label="Destination" span={2}>
                                <Space>
                                    <EnvironmentOutlined />
                                    {reservationDetails.vehicle.vehicle_form_destination}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Schedule" span={2}>
                                <Space direction="vertical">
                                    <CalendarOutlined />
                                    {formatDateRange(
                                        reservationDetails.vehicle?.vehicle_form_start_date,
                                        reservationDetails.vehicle?.vehicle_form_end_date
                                    )}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Driver Status" span={2}>
                                <Space>
                                    <UserOutlined />
                                    {(() => {
                                        const driverId = reservationDetails.vehicle.driver_id;
                                        const driverName = reservationDetails.vehicle.drivers?.[0] || 'No driver assigned';
                                        return (
                                            <>
                                                Driver: {driverName}
                                                {getAvailabilityBadge(isDriverAvailable(driverId, driverName))}
                                            </>
                                        );
                                    })()}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Remove the Timeline component since we're handling a single driver */}
                    </TabPane>
                )}

                {reservationDetails.venue?.venue_form_name && (
                    <TabPane
                        tab={
                            <span>
                                <BuildOutlined />
                                Venue Details
                            </span>
                        }
                        key="2"
                    >
                        <Descriptions bordered column={2}>
                            <Descriptions.Item 
                                label={
                                    <Space>
                                        Venue Name
                                        {getAvailabilityBadge(isVenueAvailable(reservationDetails.venue.ven_id))}
                                    </Space>
                                } 
                                span={2}
                            >
                                {reservationDetails.venue.venue_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Event Title" span={2}>
                                {reservationDetails.venue.venue_form_event_title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Description" span={2}>
                                {reservationDetails.venue.venue_form_description}
                            </Descriptions.Item>
                            <Descriptions.Item label="Participants">
                                <Space>
                                    <TeamOutlined />
                                    {reservationDetails.venue.venue_participants}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Schedule" span={2}>
                                <Space direction="vertical">
                                    <CalendarOutlined />
                                    {formatDateRange(
                                        reservationDetails.venue?.venue_form_start_date,
                                        reservationDetails.venue?.venue_form_end_date
                                    )}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Equipment section with null check */}
                        <div className="mt-4">
                            <Descriptions bordered column={1}>
                                <Descriptions.Item 
                                    label={
                                        <Space>
                                            <ToolOutlined />
                                            Equipment Requested
                                        </Space>
                                    }
                                >
                                    {reservationDetails.equipment && 
                                     reservationDetails.equipment.equip_id === null && 
                                     reservationDetails.equipment.equipment_name === null && 
                                     reservationDetails.equipment.reservation_equipment_quantity === null ? (
                                        <Tag color="default">No Equipment Added</Tag>
                                    ) : (
                                        <>
                                            {reservationDetails.equipment.equipment_name}
                                            <Tag color="orange" className="ml-2">
                                                Quantity: {reservationDetails.equipment.reservation_equipment_quantity}
                                            </Tag>
                                            {getAvailabilityBadge(isEquipmentAvailable(reservationDetails.equipment.equip_id))}
                                        </>
                                    )}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </TabPane>
                )}
            </Tabs>
        </Modal>
    );
};

export default ReservationRequests;

