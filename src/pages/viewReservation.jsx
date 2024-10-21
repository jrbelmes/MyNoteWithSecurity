import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaFilter, FaEye, FaCalendar, FaSearch, FaTimes, FaPrint } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';

// Add this function at the top of your file, outside of the component:
const formatDate = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

const ReservationReport = ({ reservations, month, year }) => {
    return (
        <div className="p-8 bg-white">
            <h1 className="text-3xl font-bold mb-6">Reservation Report: {formatDate(new Date(year, month))}</h1>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">ID</th>
                        <th className="border border-gray-300 p-2">Name</th>
                        <th className="border border-gray-300 p-2">Event Title</th>
                        <th className="border border-gray-300 p-2">Status</th>
                        <th className="border border-gray-300 p-2">Created</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map((reservation) => (
                        <tr key={reservation.reservation_id}>
                            <td className="border border-gray-300 p-2">{reservation.reservation_id}</td>
                            <td className="border border-gray-300 p-2">{reservation.reservation_name}</td>
                            <td className="border border-gray-300 p-2">{reservation.reservation_event_title}</td>
                            <td className="border border-gray-300 p-2">{reservation.reservation_status_name}</td>
                            <td className="border border-gray-300 p-2">{formatDate(new Date(reservation.date_created))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ViewReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date_created');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [reportMonth, setReportMonth] = useState(new Date());
    const [showReport, setShowReport] = useState(false);

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

    const filteredAndSortedReservations = reservations
        .filter((reservation) => {
            const matchesFilter = filter === 'All' ||
                (filter === 'Vehicle' && reservation.vehicle_ids !== null) ||
                (filter === 'Venue' && reservation.venue_names !== null) ||
                (filter === 'Equipment' && reservation.equipment_names !== null);

            const matchesDateRange = (!startDate || new Date(reservation.date_created) >= startDate) &&
                (!endDate || new Date(reservation.date_created) <= endDate);

            const matchesSearch = searchTerm === '' ||
                reservation.reservation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reservation.reservation_event_title.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesFilter && matchesDateRange && matchesSearch;
        })
        .sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    const handleSort = (field) => {
        if (field === sortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAndSortedReservations.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const clearFilters = () => {
        setFilter('All');
        setStartDate(null);
        setEndDate(null);
        setSearchTerm('');
        setSortBy('date_created');
        setSortOrder('desc');
    };

    const generateReport = () => {
        const filteredReservations = reservations.filter(reservation => {
            const reservationDate = new Date(reservation.date_created);
            return reservationDate.getMonth() === reportMonth.getMonth() &&
                   reservationDate.getFullYear() === reportMonth.getFullYear();
        });

        if (filteredReservations.length === 0) {
            toast.error('No reservations found for the selected month.');
            return;
        }

        setShowReport(true);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    return (
        <div className="flex flex-col lg:flex-row bg-gray-100 min-h-screen">
            {!showReport ? (
                <>
                    <Sidebar />
                    <div className="flex-grow p-6 lg:p-10">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold mb-6 text-gray-800"
                        >
                            Reservations
                        </motion.h2>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 bg-white rounded-lg shadow p-4"
                        >
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center">
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
                                <div className="flex items-center">
                                    <FaCalendar className="text-gray-500 mr-3" />
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        selectsStart
                                        startDate={startDate}
                                        endDate={endDate}
                                        placeholderText="Start Date"
                                        className="form-input border-0 focus:ring-0"
                                    />
                                    <span className="mx-2">to</span>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate}
                                        placeholderText="End Date"
                                        className="form-input border-0 focus:ring-0"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <FaSearch className="text-gray-500 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Search reservations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="form-input border-0 focus:ring-0"
                                    />
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                >
                                    <FaTimes className="mr-2" />
                                    Clear Filters
                                </button>
                            </div>
                            <div className="flex items-center mt-4">
                                <FaPrint className="text-gray-500 mr-3" />
                                <DatePicker
                                    selected={reportMonth}
                                    onChange={(date) => setReportMonth(date)}
                                    dateFormat="MMMM yyyy"
                                    showMonthYearPicker
                                    className="form-input border-0 focus:ring-0"
                                />
                                <button
                                    onClick={generateReport}
                                    className="ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </motion.div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                                        <thead className="bg-gray-200">
                                            <tr>
                                                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('reservation_id')}>ID</th>
                                                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('reservation_name')}>Name</th>
                                                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('reservation_event_title')}>Event Title</th>
                                                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('date_created')}>Created</th>
                                                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('reservation_status_name')}>Status</th>
                                                <th className="px-4 py-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {currentItems.map((reservation) => (
                                                    <motion.tr 
                                                        key={reservation.reservation_id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="hover:bg-gray-100"
                                                    >
                                                        <td className="px-4 py-2">{reservation.reservation_id}</td>
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
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                                {filteredAndSortedReservations.length === 0 && (
                                    <p className="text-center text-gray-500 mt-4">No reservations found.</p>
                                )}
                                <div className="mt-4 flex justify-center">
                                    {Array.from({ length: Math.ceil(filteredAndSortedReservations.length / itemsPerPage) }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => paginate(i + 1)}
                                            className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </>
            ) : (
                <ReservationReport 
                    reservations={reservations.filter(reservation => {
                        const reservationDate = new Date(reservation.date_created);
                        return reservationDate.getMonth() === reportMonth.getMonth() &&
                               reservationDate.getFullYear() === reportMonth.getFullYear();
                    })}
                    month={reportMonth.getMonth()}
                    year={reportMonth.getFullYear()}
                />
            )}

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
                                    <p className="font-medium text-gray-600">Name:</p>
                                    <p>{selectedReservation.reservation.reservation_name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-600">Status:</p>
                                    <p className={`px-2 py-1 rounded-full text-xs inline-block ${getStatusClass(selectedReservation.reservation.reservation_status_name)}`}>
                                        {selectedReservation.reservation.reservation_status_name}
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
                                            <li key={vehicle.vehicle_license} className="text-sm">{vehicle.vehicle_license} (ID: {vehicle.vehicle_reservation_vehicle_id})</li>
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
    );
};

export default ViewReservations;
