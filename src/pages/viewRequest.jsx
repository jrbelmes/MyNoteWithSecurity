import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaCar, FaBuilding, FaTools } from 'react-icons/fa';

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

        // Subscribe to the refresh event
        subscribe('refreshReservations', fetchReservations);

        // Cleanup subscription on unmount
        return () => {
            events['refreshReservations'] = events['refreshReservations'].filter(listener => listener !== fetchReservations);
        };
    }, []);

    const handleAction = async () => {
        const operation = 'updateReservationStatus';
        const status = 'accepted';

        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master2.php', {
                operation,
                json: JSON.stringify({ reservation_id: currentRequest }),
            });

            if (response.data?.status === 'success') {
                toast.success(`Reservation ${status}!`);
                emit('refreshReservations'); // Emit event to refresh reservations
            } else {
                toast.error(response.data?.message || 'Failed to update reservation status.');
            }
        } catch (error) {
            toast.error(`Error ${status} reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleDeclineAction = async () => {
        const operation = 'updateReservationStatus1';
        const status = 'declined';

        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master2.php', {
                operation,
                json: JSON.stringify({ reservation_id: currentRequest }),
            });

            if (response.data?.status === 'success') {
                toast.success(`Reservation ${status}!`);
                emit('refreshReservations'); // Emit event to refresh reservations
            } else {
                toast.error(response.data?.message || 'Failed to update reservation status.');
            }
        } catch (error) {
            toast.error(`Error ${status} reservation: ${error.response?.data?.message || error.message}`);
        } finally {
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
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">Reservation Requests</h2>

                <div className="mb-4">
                    <label htmlFor="filter" className="mr-2">Filter by Type:</label>
                    <select
                        id="filter"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="All">All</option>
                        <option value="Vehicle">Vehicle</option>
                        <option value="Venue">Venue</option>
                        <option value="Equipment">Equipment</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map(reservation => (
                                <div key={reservation.reservation_id} className="bg-white shadow-md rounded-lg p-4 mb-4 flex items-center">
                                    {getIconForType(reservation.equipment_names ? 'Equipment' : reservation.venue_names ? 'Venue' : 'Vehicle')}
                                    <div className="flex-grow">
                                        <h3 className="font-bold">Reservation ID: {reservation.reservation_id}</h3>
                                        <p>User Name: {reservation.reservations_users_id}</p>
                                        <p>Type: {reservation.equipment_names ? 'Equipment' : reservation.venue_names ? 'Venue' : 'Vehicle'}</p>
                                        <p>Status: {reservation.reservation_status_name}</p>
                                        <p>Start Date: {new Date(reservation.reservation_start_date).toLocaleString()}</p>
                                        <p>End Date: {new Date(reservation.reservation_end_date).toLocaleString()}</p>
                                        {reservation.equipment_names && <p>Equipment: {reservation.equipment_names}</p>}
                                        {reservation.venue_names && <p>Venue: {reservation.venue_names}</p>}
                                        {reservation.vehicle_ids && <p>Vehicles: {reservation.vehicle_ids}</p>}
                                    </div>
                                    <div className="flex flex-col">
                                        <Button
                                            variant="success"
                                            onClick={() => { 
                                                setCurrentRequest(reservation.reservation_id); 
                                                setActionType('accept'); 
                                                setIsModalOpen(true); 
                                            }}
                                        >
                                            <FaCheck /> Accept
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => { 
                                                setCurrentRequest(reservation.reservation_id); 
                                                setActionType('decline'); 
                                                setIsModalOpen(true); 
                                            }}
                                            className="mt-2"
                                        >
                                            <FaTimes /> Decline
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No requests found.</p>
                        )}
                    </div>
                )}

                <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Action</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to {actionType === 'accept' ? 'accept' : 'decline'} this reservation?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={actionType === 'accept' ? handleAction : handleDeclineAction}>
                            {actionType === 'accept' ? 'Accept' : 'Decline'}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default ReservationRequests;
