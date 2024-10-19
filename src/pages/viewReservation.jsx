import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCar, FaBuilding, FaTools, FaFilter, FaEye } from 'react-icons/fa';

const ViewReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
                operation: 'fetchAllReservations',
            });

            if (response.data && response.data.status === 'success') {
                setReservations(response.data.data);
            } else {
                toast.error('No reservations found.');
            }
        } catch (error) {
            toast.error('Error fetching reservations.');
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
        fetchReservations();
    }, []);

    const getIconForType = (equipmentNames, venueNames, vehicleIds) => {
        if (vehicleIds) return <FaCar className="mr-2 text-blue-500" />;
        if (venueNames) return <FaBuilding className="mr-2 text-green-500" />;
        if (equipmentNames) return <FaTools className="mr-2 text-orange-500" />;
        return null;
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

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : 'Invalid Date';
    };

    const filteredReservations = reservations.filter((reservation) => {
        if (filter === 'All') return true;
        if (filter === 'Vehicle') return reservation.vehicle_ids !== null;
        if (filter === 'Venue') return reservation.venue_names !== null;
        if (filter === 'Equipment') return reservation.equipment_names !== null;
        return false;
    });

    return (
        <div className="flex flex-col lg:flex-row bg-gray-100 min-h-screen">
            <Sidebar />
            <div className="flex-grow p-6 lg:p-10">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Reservations</h2>

                <div className="mb-6 bg-white rounded-lg shadow p-4 flex items-center">
                    <FaFilter className="text-gray-500 mr-3" />
                    <select
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="form-select border-0 focus:ring-0 text-gray-700"
                    >
                        <option value="All">All Reservations</option>
                        <option value="Vehicle">Vehicles</option>
                        <option value="Venue">Venues</option>
                        <option value="Equipment">Equipment</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map((reservation) => (
                                <div key={reservation.reservation_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center mb-2">
                                            {getIconForType(reservation.equipment_names, reservation.venue_names, reservation.vehicle_ids)}
                                            <h3 className="font-semibold text-lg text-gray-800">ID: {reservation.reservation_id}</h3>
                                            <button 
                                                className="ml-auto text-gray-500 hover:text-gray-800"
                                                onClick={() => fetchReservationDetails(reservation.reservation_id)}
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600">{reservation.reservation_event_title}</p>
                                        <p className="text-sm text-gray-500">
                                            Created: {formatDate(reservation.date_created)}
                                        </p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm"><span className="font-medium">Name:</span> {reservation.reservation_name}</p>
                                        <p className="text-sm mt-1"><span className="font-medium">Description:</span> {reservation.reservation_description}</p>
                                        <p className="text-sm mt-1"><span className="font-medium">Start:</span> {formatDate(reservation.reservation_start_date)}</p>
                                        <p className="text-sm mt-1"><span className="font-medium">End:</span> {formatDate(reservation.reservation_end_date)}</p>
                                        <p className="text-sm mt-2">
                                            <span className="font-medium">Status: </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(reservation.reservation_status_name)}`}>
                                                {reservation.reservation_status_name}
                                            </span>
                                        </p>
                                        {reservation.equipment_names && <p className="text-sm mt-1"><span className="font-medium">Equipment:</span> {reservation.equipment_names}</p>}
                                        {reservation.venue_names && <p className="text-sm mt-1"><span className="font-medium">Venue:</span> {reservation.venue_names}</p>}
                                        {reservation.vehicle_ids && <p className="text-sm mt-1"><span className="font-medium">Vehicle IDs:</span> {reservation.vehicle_ids}</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-center text-gray-500">No reservations found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Modal for Reservation Details */}
            {modalOpen && selectedReservation && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <h3 className="text-xl font-bold mb-4">Reservation Details</h3>
                        <p><span className="font-medium">Name:</span> {selectedReservation.reservation.reservation_name}</p>
                        <p><span className="font-medium">Status:</span> {selectedReservation.reservation.reservation_status_name}</p>
                        <p><span className="font-medium">Event Title:</span> {selectedReservation.reservation.reservation_event_title}</p>
                        <p><span className="font-medium">Description:</span> {selectedReservation.reservation.reservation_description}</p>
                        <p><span className="font-medium">Start:</span> {formatDate(selectedReservation.reservation.reservation_start_date)}</p>
                        <p><span className="font-medium">End:</span> {formatDate(selectedReservation.reservation.reservation_end_date)}</p>
                        <p><span className="font-medium">Created:</span> {formatDate(selectedReservation.reservation.date_created)}</p>

                        {/* Display vehicle, equipment, and venue information */}
                        {selectedReservation.equipment && selectedReservation.equipment.length > 0 && (
                            <div>
                                <h4 className="mt-4 font-semibold">Equipment Used:</h4>
                                <ul>
                                    {selectedReservation.equipment.map((equip) => (
                                        <li key={equip.equip_name} className="text-sm">{equip.equip_name} (Quantity: {equip.quantity})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {selectedReservation.vehicles && selectedReservation.vehicles.length > 0 && (
                            <div>
                                <h4 className="mt-4 font-semibold">Vehicles Used:</h4>
                                <ul>
                                    {selectedReservation.vehicles.map((vehicle) => (
                                        <li key={vehicle.vehicle_license} className="text-sm">{vehicle.vehicle_license} (ID: {vehicle.vehicle_reservation_vehicle_id})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {selectedReservation.venues && selectedReservation.venues.length > 0 && (
                            <div>
                                <h4 className="mt-4 font-semibold">Venues Used:</h4>
                                <ul>
                                    {selectedReservation.venues.map((venue) => (
                                        <li key={venue.ven_name} className="text-sm">{venue.ven_name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded" onClick={() => setModalOpen(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewReservations;
