import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaCar, FaBuilding, FaTools, FaFilter, FaSpinner } from 'react-icons/fa';

// Event Emitter
const events = {};

const subscribe = (event, listener) => {
    if (!events[event]) {
        events[event] = [];
    }
    events[event].push(listener);
};

const emit = (event) => {
    if (events[event]) {
        events[event].forEach(listener => listener());
    }
};

const ReservationRequests = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [actionType, setActionType] = useState('');
    const [filter, setFilter] = useState('All');
    const [modalLoading, setModalLoading] = useState(false);

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

    useEffect(() => {
        fetchReservations();
        subscribe('refreshReservations', fetchReservations);
        return () => {
            events['refreshReservations'] = events['refreshReservations'].filter(listener => listener !== fetchReservations);
        };
    }, []);

    const handleAction = async () => {
        const operation = 'updateReservationStatus';
        setModalLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master2.php', {
                operation,
                json: JSON.stringify({ reservation_id: currentRequest }),
            });

            if (response.data?.status === 'success') {
                toast.success(`Reservation accepted!`);
                emit('refreshReservations');
            } else {
                toast.error(response.data?.message || 'Failed to update reservation status.');
            }
        } catch (error) {
            toast.error(`Error accepting reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setModalLoading(false);
            setIsModalOpen(false);
        }
    };

    const handleDeclineAction = async () => {
        const operation = 'updateReservationStatus1';
        setModalLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master2.php', {
                operation,
                json: JSON.stringify({ reservation_id: currentRequest }),
            });

            if (response.data?.status === 'success') {
                toast.success(`Reservation declined!`);
                emit('refreshReservations');
            } else {
                toast.error(response.data?.message || 'Failed to update reservation status.');
            }
        } catch (error) {
            toast.error(`Error declining reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setModalLoading(false);
            setIsModalOpen(false);
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

    const filteredReservations = reservations.filter(reservation => 
        filter === 'All' || (reservation.type && reservation.type === filter)
    );

    return (
        <div className="flex flex-col lg:flex-row bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-grow p-8 lg:p-12">
                <h2 className="text-3xl font-bold mb-8 text-gray-800">Reservation Requests</h2>

                <div className="mb-8 flex items-center">
                    <FaFilter className="text-gray-500 mr-3" />
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    >
                        <option value="All">All Types</option>
                        <option value="Vehicle">Vehicle</option>
                        <option value="Venue">Venue</option>
                        <option value="Equipment">Equipment</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <FaSpinner className="animate-spin text-4xl text-blue-500" />
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map(reservation => (
                                <div key={reservation.reservation_id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 transition-shadow duration-300 hover:shadow-md flex flex-col h-[400px]">
                                    <div className="p-6 flex-grow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-gray-800">Request #{reservation.reservation_id}</h3>
                                            {getIconForType(reservation.equipment_names ? 'Equipment' : reservation.venue_names ? 'Venue' : 'Vehicle')}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-600"><span className="font-medium text-gray-700">User:</span> {reservation.reservations_users_id}</p>
                                            <p className="text-gray-600"><span className="font-medium text-gray-700">Type:</span> {reservation.equipment_names ? 'Equipment' : reservation.venue_names ? 'Venue' : 'Vehicle'}</p>
                                            <p className="text-gray-600"><span className="font-medium text-gray-700">Status:</span> <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{reservation.reservation_status_name}</span></p>
                                            <p className="text-gray-600"><span className="font-medium text-gray-700">Start:</span> {new Date(reservation.reservation_start_date).toLocaleString()}</p>
                                            <p className="text-gray-600"><span className="font-medium text-gray-700">End:</span> {new Date(reservation.reservation_end_date).toLocaleString()}</p>
                                            {reservation.equipment_names && <p className="text-gray-600"><span className="font-medium text-gray-700">Equipment:</span> {reservation.equipment_names}</p>}
                                            {reservation.venue_names && <p className="text-gray-600"><span className="font-medium text-gray-700">Venue:</span> {reservation.venue_names}</p>}
                                            {reservation.vehicle_ids && <p className="text-gray-600"><span className="font-medium text-gray-700">Vehicles:</span> {reservation.vehicle_ids}</p>}
                                        </div>
                                    </div>
                                    <div className="flex border-t border-gray-200 mt-auto">
                                        <button
                                            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                            onClick={() => { 
                                                setCurrentRequest(reservation.reservation_id); 
                                                setActionType('accept'); 
                                                setIsModalOpen(true); 
                                            }}
                                        >
                                            <FaCheck className="inline mr-2" /> Accept
                                        </button>
                                        <button
                                            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                            onClick={() => { 
                                                setCurrentRequest(reservation.reservation_id); 
                                                setActionType('decline'); 
                                                setIsModalOpen(true); 
                                            }}
                                        >
                                            <FaTimes className="inline mr-2" /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600 col-span-full text-center py-12">No requests found.</p>
                        )}
                    </div>
                )}

                <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)} centered>
                    <Modal.Header closeButton className="border-b-0 pb-0">
                        <Modal.Title className="text-xl font-semibold">Confirm Action</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="pt-0">
                        <p className="text-gray-600">Are you sure you want to {actionType === 'accept' ? 'accept' : 'decline'} this reservation?</p>
                    </Modal.Body>
                    <Modal.Footer className="border-t-0">
                        <Button variant="outline-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant={actionType === 'accept' ? 'success' : 'danger'} 
                            onClick={actionType === 'accept' ? handleAction : handleDeclineAction}
                            className="ml-2"
                            disabled={modalLoading}
                        >
                            {modalLoading ? <FaSpinner className="animate-spin" /> : (actionType === 'accept' ? 'Accept' : 'Decline')}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default ReservationRequests;
