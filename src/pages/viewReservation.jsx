import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCar, FaBuilding, FaTools } from 'react-icons/fa';

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

    const getIconForType = (type) => {
        switch (type) {
            case 'Vehicle':
                return <FaCar className="mr-2 text-blue-500" />;
            case 'Venue':
                return <FaBuilding className="mr-2 text-green-500" />;
            case 'Equipment':
                return <FaTools className="mr-2 text-orange-500" />;
            default:
                return null;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending':
                return { color: 'orange' }; // Orange for pending
            case 'Reserved':
                return { color: 'green' }; // Green for reserved
            case 'Declined':
                return { color: 'red' }; // Red for declined
            default:
                return { color: 'gray' }; // Default color
        }
    };

    const filteredReservations = reservations.filter((reservation) => {
        return filter === 'All' || reservation.type === filter;
    });

    return (
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">View Reservations</h2>

                <div className="mb-4">
                    <label htmlFor="filter" className="mr-2">Filter by Type:</label>
                    <select
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
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
                            filteredReservations.map((reservation) => (
                                <div key={reservation.id} className="bg-white shadow-md rounded-lg p-4 mb-4 flex items-center justify-between">
                                    <div className="flex-grow">
                                        <div className="flex items-center">
                                            {getIconForType(reservation.type)}
                                            <h3 className="font-bold">ID: {reservation.id}</h3>
                                        </div>
                                        <p>Type: {reservation.type}</p>
                                        <p>Start Date: {new Date(reservation.start_date).toLocaleDateString()}</p>
                                        <p>End Date: {new Date(reservation.end_date).toLocaleDateString()}</p>
                                        {reservation.quantity && <p>Quantity: {reservation.quantity}</p>}
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-bold">Status:</p>
                                        <p style={getStatusStyle(reservation.status)}>{reservation.status}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No reservations found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewReservations;
