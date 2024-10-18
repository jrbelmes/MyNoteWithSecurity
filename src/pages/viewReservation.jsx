
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCar, FaBuilding, FaTools, FaFilter } from 'react-icons/fa';

const ViewReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');

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

    useEffect(() => {
        fetchReservations();
    }, []);

    const getIconForType = (equipmentNames, venueNames, vehicleIds) => {
        if (vehicleIds) return <FaCar className="mr-2 text-blue-500" />;
        if (venueNames) return <FaBuilding className="mr-2 text-green-500" />;
        if (equipmentNames) return <FaTools className="mr-2 text-orange-500" />;
        return null;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
                return { color: 'orange' };
            case 'reserve':
                return { color: 'green' };
            case 'declined':
                return { color: 'red' };
            default:
                return { color: 'gray' };
        }
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
                                        </div>
                                        <p className="text-sm text-gray-600">{reservation.reservation_event_title}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm"><span className="font-medium">Name:</span> {reservation.reservation_name}</p>
                                        <p className="text-sm mt-1"><span className="font-medium">Description:</span> {reservation.reservation_description}</p>
                                        <p className="text-sm mt-1"><span className="font-medium">Start:</span> {new Date(reservation.reservation_start_date).toLocaleString()}</p>
                                        <p className="text-sm mt-1"><span className="font-medium">End:</span> {new Date(reservation.reservation_end_date).toLocaleString()}</p>
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
        </div>
    );
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

export default ViewReservations;