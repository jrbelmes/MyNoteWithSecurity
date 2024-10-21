import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaFilter, FaEye, FaCalendar, FaSearch, FaPrint, FaSort, FaChartBar } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';

// Add this function at the top of the file, along with getStatusClass
const formatDate = (date) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

// Update the ReservationReport component to accept formatDate as a prop
const ReservationReport = ({ reservations, reportType, reportDate, getStatusClass, formatDate }) => {
    const formatReportDate = () => {
        if (reportType === 'monthly') {
            return formatDate(reportDate).split(' ').slice(0, 2).join(' ');
        } else {
            return formatDate(reportDate).split(' ').slice(0, 1).join(' ');
        }
    };

    return (
        <div className="p-8 bg-white font-sans max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 border-b-2 border-green-500 pb-4">
                <img
                    src="/images/assets/phinma.png"
                    alt="PHINMA Logo"
                    className="w-24 h-auto"
                />
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-green-800">General Service Department</h1>
                    <h2 className="text-xl text-green-600">Reservation And Monitoring System</h2>
                    <h3 className="text-lg font-semibold">PHINMA Cagayan de Oro College</h3>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 text-center text-green-700 bg-green-100 py-2 rounded-lg">
                Reservation Report: {formatReportDate()}
            </h2>

            <table className="w-full border-collapse mb-6">
                <thead>
                    <tr className="bg-green-600 text-white">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Requested By</th>
                        <th className="p-2 text-left">Event Title</th>
                        <th className="p-2 text-left">Date Range</th>
                        <th className="p-2 text-left">Date Created</th>
                        <th className="p-2 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map((reservation, index) => (
                        <tr key={reservation.reservation_id} className={index % 2 === 0 ? 'bg-green-50' : 'bg-white'}>
                            <td className="p-2 border-b border-green-200">{index + 1}</td>
                            <td className="p-2 border-b border-green-200">{reservation.reservation_name}</td>
                            <td className="p-2 border-b border-green-200">{reservation.reservation_event_title}</td>
                            <td className="p-2 border-b border-green-200">
                                {formatDate(new Date(reservation.reservation_start_date)).split(',')[0]} - 
                                {formatDate(new Date(reservation.reservation_end_date)).split(',')[0]}
                            </td>
                            <td className="p-2 border-b border-green-200">
                                {formatDate(new Date(reservation.date_created))}
                            </td>
                            <td className="p-2 border-b border-green-200">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(reservation.reservation_status_name)}`}>
                                    {reservation.reservation_status_name}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-8 flex justify-between items-center text-sm text-gray-600">
                <p>Total Reservations: {reservations.length}</p>
                <p>Generated on: {new Date().toLocaleString()}</p>
            </div>

            <div className="mt-8 text-center">
                <button onClick={() => window.print()} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors print:hidden">
                    <FaPrint className="inline-block mr-2" />
                    Print Report
                </button>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: auto;
                        margin: 20mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                    }
                    h1, h2, h3 {
                        margin: 0;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .print:hidden {
                        display: none !important;
                    }
                    /* Hide URL and timestamp */
                    @page {
                        margin: 0.5cm;
                    }
                    @page :first {
                        margin-top: 0;
                    }
                    @page :left {
                        margin-left: 0;
                    }
                    @page :right {
                        margin-right: 0;
                    }
                    body::after {
                        content: none !important;
                    }
                }
            `}</style>
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
    const [reportType, setReportType] = useState('monthly');
    const [reportDate, setReportDate] = useState(new Date());
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

    const generateReport = () => {
        let filteredReservations;
        if (reportType === 'monthly') {
            filteredReservations = reservations.filter(reservation => {
                const reservationDate = new Date(reservation.date_created);
                return reservationDate.getMonth() === reportDate.getMonth() &&
                       reservationDate.getFullYear() === reportDate.getFullYear();
            });
        } else {
            filteredReservations = reservations.filter(reservation => {
                const reservationDate = new Date(reservation.date_created);
                return reservationDate.getFullYear() === reportDate.getFullYear();
            });
        }

        if (filteredReservations.length === 0) {
            toast.error(`No reservations found for the selected ${reportType === 'monthly' ? 'month' : 'year'}.`);
            return;
        }

        setShowReport(true);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-green-50 to-white">
            {!showReport ? (
                <>
                    <Sidebar />
                    <div className="flex-grow p-4 lg:p-6">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold mb-4 text-green-800"
                        >
                            Reservations
                        </motion.h2>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 bg-white rounded-lg shadow-md p-4"
                        >
                            {/* Separate search input with full width */}
                            <div className="mb-3">
                                <div className="flex items-center bg-green-100 rounded-lg p-2">
                                    <FaSearch className="text-green-600 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search reservations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="form-input w-full bg-transparent border-0 focus:ring-0 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Other filters in a grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                                <div className="flex items-center bg-green-100 rounded-lg p-2">
                                    <FaFilter className="text-green-600 mr-2" />
                                    <select
                                        id="filter"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="form-select w-full bg-transparent border-0 focus:ring-0 text-green-700 text-sm"
                                    >
                                        <option value="All">All</option>
                                        <option value="Vehicle">Vehicles</option>
                                        <option value="Venue">Venues</option>
                                        <option value="Equipment">Equipment</option>
                                    </select>
                                </div>
                                <div className="flex items-center bg-green-100 rounded-lg p-2">
                                    <FaCalendar className="text-green-600 mr-2" />
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        selectsStart
                                        startDate={startDate}
                                        endDate={endDate}
                                        placeholderText="Start Date"
                                        className="form-input w-full bg-transparent border-0 focus:ring-0 text-sm"
                                    />
                                </div>
                                <div className="flex items-center bg-green-100 rounded-lg p-2">
                                    <FaCalendar className="text-green-600 mr-2" />
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate}
                                        placeholderText="End Date"
                                        className="form-input w-full bg-transparent border-0 focus:ring-0 text-sm"
                                    />
                                </div>
                                <div className="flex items-center bg-green-100 rounded-lg p-2">
                                    <FaChartBar className="text-green-600 mr-2" />
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="form-select w-full bg-transparent border-0 focus:ring-0 text-green-700 text-sm"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="flex items-center bg-green-100 rounded-lg p-2">
                                    <FaCalendar className="text-green-600 mr-2" />
                                    <DatePicker
                                        selected={reportDate}
                                        onChange={(date) => setReportDate(date)}
                                        dateFormat={reportType === 'monthly' ? "MMM yyyy" : "yyyy"}
                                        showMonthYearPicker={reportType === 'monthly'}
                                        showYearPicker={reportType === 'yearly'}
                                        className="form-input w-full bg-transparent border-0 focus:ring-0 text-sm"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={generateReport}
                                        className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors w-full flex items-center justify-center text-sm"
                                    >
                                        <FaPrint className="mr-2" />
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                                    <table className="min-w-full">
                                        <thead className="bg-green-600 text-white">
                                            <tr>
                                                {['Name', 'Event Title', 'Created', 'Status', 'Actions'].map((header) => (
                                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort(header.toLowerCase())}>
                                                        <div className="flex items-center">
                                                            {header}
                                                            <FaSort className="ml-1" />
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-green-200">
                                            <AnimatePresence>
                                                {currentItems.map((reservation) => (
                                                    <motion.tr 
                                                        key={reservation.reservation_id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="hover:bg-green-50"
                                                    >
                                                    
                                                        <td className="px-6 py-4 whitespace-nowrap">{reservation.reservation_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{reservation.reservation_event_title}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(new Date(reservation.date_created))}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(reservation.reservation_status_name)}`}>
                                                                {reservation.reservation_status_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button 
                                                                className="text-green-600 hover:text-green-900 transition-colors"
                                                                onClick={() => fetchReservationDetails(reservation.reservation_id)}
                                                            >
                                                                <FaEye size={18} />
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
                                <div className="mt-6 flex justify-center">
                                    {Array.from({ length: Math.ceil(filteredAndSortedReservations.length / itemsPerPage) }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => paginate(i + 1)}
                                            className={`mx-1 px-4 py-2 rounded-lg ${currentPage === i + 1 ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'} hover:bg-green-500 hover:text-white transition-colors`}
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
                        if (reportType === 'monthly') {
                            return reservationDate.getMonth() === reportDate.getMonth() &&
                                   reservationDate.getFullYear() === reportDate.getFullYear();
                        } else {
                            return reservationDate.getFullYear() === reportDate.getFullYear();
                        }
                    })}
                    reportType={reportType}
                    reportDate={reportDate}
                    getStatusClass={getStatusClass}
                    formatDate={formatDate}  // Pass the function as a prop
                />
            )}

            {/* Modal for Reservation Details */}
            <AnimatePresence>
                {modalOpen && selectedReservation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-3xl font-bold mb-6 text-green-800">Reservation Details</h3>
                            <div className="grid grid-cols-2 gap-6">
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
                            <button className="mt-8 bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors" onClick={() => setModalOpen(false)}>Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ViewReservations;
