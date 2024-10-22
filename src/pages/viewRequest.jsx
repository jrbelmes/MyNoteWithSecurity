import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Sidebar1 from './sidebarpersonel';
import { Modal, Button, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaCar, FaBuilding, FaTools, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'fetchAllPendingReservations',
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
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'getReservationDetailsById',
                reservation_id: reservationId,
            });

            if (response.data?.status === 'success') {
                setReservationDetails(response.data.data);
                setIsDetailModalOpen(true);
            } else {
                toast.error('Failed to fetch reservation details.');
            }
        } catch (error) {
            toast.error('Error fetching reservation details. Please try again later.');
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleAccept = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master2.php', {
                operation: 'updateReservationStatus',
                json: JSON.stringify({ reservation_id: currentRequest }),
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation accepted!');
                fetchReservations();
            } else {
                toast.error(response.data?.message || 'Failed to accept reservation.');
            }
        } catch (error) {
            toast.error(`Error accepting reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsDetailModalOpen(false);
        }
    };

    const handleDecline = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master2.php', {
                operation: 'updateReservationStatus1',
                json: JSON.stringify({ reservation_id: currentRequest }),
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation declined!');
                fetchReservations();
            } else {
                toast.error(response.data?.message || 'Failed to decline reservation.');
            }
        } catch (error) {
            toast.error(`Error declining reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsDeclineModalOpen(false);
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

    return (
        <div className="flex flex-col lg:flex-row bg-gray-100 min-h-screen">
            {userLevel === '100' && <Sidebar />}
            {userLevel === '1' && <Sidebar1 />}
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
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-2xl font-semibold text-gray-800">Request #{reservation.reservation_id}</h3>
                                                {getIconForType(reservation.equipment_names ? 'Equipment' : reservation.venue_names ? 'Venue' : 'Vehicle')}
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-gray-600"><span className="font-medium text-gray-700">User:</span> {reservation.reservations_users_id}</p>
                                                <p className="text-gray-600"><span className="font-medium text-gray-700">Type:</span> {reservation.equipment_names ? 'Equipment' : reservation.venue_names ? 'Venue' : 'Vehicle'}</p>
                                                <p className="text-gray-600"><span className="font-medium text-gray-700">Status:</span> <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{reservation.reservation_status_name}</span></p>
                                                <p className="text-gray-600"><span className="font-medium text-gray-700">Start:</span> {new Date(reservation.reservation_start_date).toLocaleString()}</p>
                                                <p className="text-gray-600"><span className="font-medium text-gray-700">End:</span> {new Date(reservation.reservation_end_date).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex border-t border-gray-200">
                                            <button
                                                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                                onClick={() => { 
                                                    setCurrentRequest(reservation.reservation_id);
                                                    fetchReservationDetails(reservation.reservation_id);
                                                }}
                                            >
                                                <FaCheck className="inline mr-2" /> Accept
                                            </button>
                                            <button
                                                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                onClick={() => { 
                                                    setCurrentRequest(reservation.reservation_id);
                                                    setIsDeclineModalOpen(true);
                                                }}
                                            >
                                                <FaTimes className="inline mr-2" /> Decline
                                            </button>
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
                <Modal show={isDetailModalOpen} onHide={() => setIsDetailModalOpen(false)} centered size="lg">
                    <Modal.Header closeButton className="bg-gray-100">
                        <Modal.Title className="text-2xl font-semibold">Reservation Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-6">
                        {reservationDetails && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Reservation ID</p>
                                        <p className="font-medium text-lg">{reservationDetails.reservation.reservation_id}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Requested by</p>
                                        <p className="font-medium text-lg">{reservationDetails.reservation.users_name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Reservation Name</p>
                                        <p className="font-medium text-lg">{reservationDetails.reservation.reservation_name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Event Title</p>
                                        <p className="font-medium text-lg">{reservationDetails.reservation.reservation_event_title}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="font-medium">{reservationDetails.reservation.reservation_description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Start Date</p>
                                        <p className="font-medium text-lg">{reservationDetails.reservation.reservation_start_date}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">End Date</p>
                                        <p className="font-medium text-lg">{reservationDetails.reservation.reservation_end_date}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Contact Number</p>
                                    <p className="font-medium text-lg">{reservationDetails.reservation.users_contact_number}</p>
                                </div>

                                {/* Equipment Section */}
                                {reservationDetails.equipment && reservationDetails.equipment.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                    >
                                        <h4 className="font-semibold mb-2 flex items-center">
                                            <FaTools className="mr-2 text-blue-500" /> Equipment Used
                                        </h4>
                                        <ul className="list-disc pl-5">
                                            {reservationDetails.equipment.map((equip, index) => (
                                                <li key={index} className="text-sm">
                                                    {equip.equip_name} (Quantity: {equip.quantity})
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}

                                {/* Vehicles Section */}
                                {reservationDetails.vehicles && reservationDetails.vehicles.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.3 }}
                                    >
                                        <h4 className="font-semibold mb-2 flex items-center">
                                            <FaCar className="mr-2 text-green-500" /> Vehicles Used
                                        </h4>
                                        <ul className="list-disc pl-5">
                                            {reservationDetails.vehicles.map((vehicle, index) => (
                                                <li key={index} className="text-sm">
                                                    {vehicle.vehicle_license} (ID: {vehicle.vehicle_reservation_vehicle_id})
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}

                                {/* Venues Section */}
                                {reservationDetails.venues && reservationDetails.venues.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.3 }}
                                    >
                                        <h4 className="font-semibold mb-2 flex items-center">
                                            <FaBuilding className="mr-2 text-yellow-500" /> Venues Used
                                        </h4>
                                        <ul className="list-disc pl-5">
                                            {reservationDetails.venues.map((venue, index) => (
                                                <li key={index} className="text-sm">
                                                    {venue.ven_name}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                        <Button variant="success" onClick={handleAccept}>Accept</Button>
                    </Modal.Footer>
                </Modal>

                {/* Confirmation Modal for Declining */}
                <Modal show={isDeclineModalOpen} onHide={() => setIsDeclineModalOpen(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="text-xl font-semibold">Confirm Decline</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-gray-600">Are you sure you want to decline this reservation?</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setIsDeclineModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDecline}>Confirm Decline</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default ReservationRequests;
