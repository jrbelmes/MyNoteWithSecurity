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
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', 
                {
                    operation: 'fetchRequestById',
                    reservation_id: reservationId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.status === 'success' && response.data.data) {
                const details = response.data.data;
                
                // Format equipment data with null checks
                let formattedEquipment = [];
                if (details.equipment && Array.isArray(details.equipment)) {
                    formattedEquipment = details.equipment;
                } else if (details.equipment && details.equipment.name) {
                    try {
                        const names = details.equipment.name.split(',');
                        const quantities = details.equipment.quantity ? details.equipment.quantity.split(',') : [];
                        const ids = details.equipment.equipment_ids ? details.equipment.equipment_ids.split(',') : [];
                        
                        formattedEquipment = names.map((name, index) => ({
                            equip_id: ids[index] || '',
                            equipment_name: name.trim(),
                            reservation_equipment_quantity: quantities[index] || '1'
                        }));
                    } catch (error) {
                        console.warn('Error formatting equipment:', error);
                        formattedEquipment = [];
                    }
                }

                // Create a formatted details object
                const formattedDetails = {
                    ...details,
                    equipment: formattedEquipment,
                    // Format venue data with null checks
                    venue: details.venue ? {
                        ...details.venue,
                        venue_name: details.venue.name || 'N/A',
                        venue_form_name: details.venue.form_name || 'N/A',
                        venue_form_event_title: details.venue.event_title || 'N/A',
                        venue_form_description: details.venue.description || 'N/A',
                        venue_participants: details.venue.participants || '0',
                        venue_form_start_date: details.venue.start_date,
                        venue_form_end_date: details.venue.end_date
                    } : null,
                    // Format vehicle data with null checks
                    vehicle: details.vehicle ? {
                        ...details.vehicle,
                        vehicle_form_name: details.vehicle.form_name || 'N/A',
                        vehicle_form_purpose: details.vehicle.purpose || 'N/A',
                        vehicle_form_destination: details.vehicle.destination || 'N/A',
                        vehicle_form_start_date: details.vehicle.start_date,
                        vehicle_form_end_date: details.vehicle.end_date,
                        drivers: details.vehicle.driver_names || []
                    } : null
                };

                setReservationDetails(formattedDetails);
                setCurrentRequest({
                    reservation_id: reservationId
                });
                setIsDetailModalOpen(true);
            } else {
                toast.error('Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('API Error:', error);
            toast.error(`Error: ${error.response?.data?.message || 'Failed to fetch reservation details'}`);
        }
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
                                        key={reservation.reservation_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col gap-4">
                                                {/* Status Badge */}
                                                
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
                                                        // Fix: Pass the reservation_id directly
                                                        fetchReservationDetails(reservation.reservation_id);
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
                        setCurrentRequest(null);
                        setReservationDetails(null);
                    }}
                    reservationDetails={reservationDetails}
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

const DetailModal = ({ visible, onClose, reservationDetails, onAccept, onDecline, isAccepting, isDeclining }) => {
    if (!reservationDetails) return null;

    // Determine the request type based on the response data
    const isVenueRequest = reservationDetails.venue && reservationDetails.venue.form_name;
    const isVehicleRequest = reservationDetails.vehicle && reservationDetails.vehicle.form_name;

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
                    style={{ backgroundColor: '#52c41a' }}
                >
                    Reserve
                </Button>,
            ]}
        >
            {isVenueRequest ? (
                // Venue request content
                <Descriptions bordered column={2}>
                    <Descriptions.Item 
                        label="Venue Name" 
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

                    {/* Equipment section */}
                    <Descriptions.Item label="Equipment Requested" span={2}>
                        {!reservationDetails.equipment || reservationDetails.equipment.length === 0 ? (
                            <Tag color="default">No Equipment Added</Tag>
                        ) : (
                            <div className="space-y-2">
                                {Array.isArray(reservationDetails.equipment) ? (
                                    reservationDetails.equipment.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span>{item.equipment_name}</span>
                                            <Tag color="orange">
                                                Quantity: {item.reservation_equipment_quantity}
                                            </Tag>
                                        </div>
                                    ))
                                ) : (
                                    <Tag color="default">Invalid Equipment Data</Tag>
                                )}
                            </div>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            ) : isVehicleRequest ? (
                <Descriptions bordered column={2}>
                    <Descriptions.Item 
                        label="Vehicle Details" 
                        span={2}
                    >
                        <Tag color="blue">{reservationDetails.vehicle.license}</Tag>
                        <Tag color="green">{reservationDetails.vehicle.model} {reservationDetails.vehicle.make}</Tag>
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
                                reservationDetails.vehicle.vehicle_form_start_date,
                                reservationDetails.vehicle.vehicle_form_end_date
                            )}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Assigned Driver" span={2}>
                        <Space>
                            <UserOutlined />
                            {Array.isArray(reservationDetails.vehicle.drivers) && reservationDetails.vehicle.drivers.length > 0
                                ? reservationDetails.vehicle.drivers[0]
                                : 'No driver assigned'}
                        </Space>
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Alert
                    message="Unknown Request Type"
                    description="Could not determine the type of request."
                    type="warning"
                />
            )}
        </Modal>
    );
};

export default ReservationRequests;

