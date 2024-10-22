import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../vehicle.css';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';

const VenueEntry = () => {
    const user_level = localStorage.getItem('user_level') || '';
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venueExists, setVenueExists] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentVenueId, setCurrentVenueId] = useState(null);
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');

    useEffect(() => {
        if (user_level !== '100') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level, navigate]);

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchVenue" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            toast.error("An error occurred while fetching venues.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddVenue = () => {
        setVenueName('');
        setMaxOccupancy('');
        setShowModal(true);
        setEditMode(false);
        setVenueExists(false);
    };

    const handleEditVenue = (venue) => {
        setVenueName(venue.ven_name);
        setMaxOccupancy(venue.ven_occupancy);
        setCurrentVenueId(venue.ven_id);
        setShowModal(true);
        setEditMode(true);
    };

    const checkVenueExists = async () => {
        const response = await axios.post("http://localhost/coc/gsd/user.php", new URLSearchParams({
            operation: "venueExists",
            json: JSON.stringify({ venue_name: venueName })
        }));

        if (response.data.status === 'success' && response.data.exists) {
            setVenueExists(true);
        } else {
            setVenueExists(false);
        }
    };

    const handleSubmit = async () => {
        if (!venueName || !maxOccupancy) {
            toast.error("All fields are required!");
            return;
        }

        const venueData = {
            venue_name: venueName,
            max_occupancy: maxOccupancy
        };

        let url, operation;
        if (editMode) {
            venueData.venue_id = currentVenueId; // Use venue_id for the update
            url = "http://localhost/coc/gsd/update_master1.php"; // Update endpoint
            operation = "updateVenue";
        } else {
            url = "http://localhost/coc/gsd/insert_master.php"; // Insert endpoint
            operation = "saveVenueData";
        }

        const formData = new FormData();
        formData.append("operation", operation);
        formData.append("json", JSON.stringify(venueData));

        setLoading(true);
        try {
            const response = await axios.post(url, formData);
            if (response.data.status === 'success') {
                toast.success(editMode ? "Venue successfully updated!" : "Venue successfully added!");
                fetchVenues();
                setShowModal(false);
            } else {
                toast.warning("Failed to save venue: " + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error saving venue:", error);
            toast.error("An error occurred while saving the venue.");
        } finally {
            setLoading(false);
        }
    };

    const handleVenueNameChange = (e) => {
        setVenueName(e.target.value);
        if (!editMode) {
            checkVenueExists();
        }
    };

    const handleDeleteVenue = async (venueId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this venue?");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/delete_master.php", new URLSearchParams({
                operation: "deleteVenue",
                venue_id: venueId // Ensure this matches the expected key
            }));

            if (response.data.status === 'success') {
                toast.success("Venue successfully deleted!");
                fetchVenues(); // Refresh the venue list
            } else {
                toast.error("Failed to delete venue: " + response.data.message);
            }
        } catch (error) {
            console.error("Error deleting venue:", error);
            toast.error("An error occurred while deleting the venue.");
        } finally {
            setLoading(false);
        }
    };

    const filteredVenues = venues.filter(venue =>
        venue.ven_name && venue.ven_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastVenue = currentPage * entriesPerPage;
    const indexOfFirstVenue = indexOfLastVenue - entriesPerPage;
    const currentVenues = filteredVenues.slice(indexOfFirstVenue, indexOfLastVenue);
    const totalPages = Math.ceil(filteredVenues.length / entriesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-500">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Venue Management</h2>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search venues..."
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddVenue}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Venue
                        </motion.button>
                    </div>

                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center items-center h-64"
                        >
                            <div className="loader"></div>
                        </motion.div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-green-600 text-white">
                                        <th className="py-3 px-4 text-left rounded-tl-lg">No.</th>
                                        <th className="py-3 px-4 text-left">Venue Name</th>
                                        <th className="py-3 px-4 text-left">Occupancy</th>
                                        <th className="py-3 px-4 text-left">Created At</th>
                                        <th className="py-3 px-4 text-left">Updated At</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {currentVenues.map((venue, index) => (
                                            <motion.tr 
                                                key={venue.ven_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{indexOfFirstVenue + index + 1}</td>
                                                <td className="py-3 px-4">{venue.ven_name}</td>
                                                <td className="py-3 px-4">{venue.ven_occupancy}</td>
                                                <td className="py-3 px-4">{venue.ven_created_at}</td>
                                                <td className="py-3 px-4">{venue.ven_updated_at}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEditVenue(venue)}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDeleteVenue(venue.ven_id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => paginate(i + 1)}
                                    className={`mx-1 px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-green-600 text-white' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Venue Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title>{editMode ? 'Edit Venue' : 'Add Venue'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="venueName" className="block mb-2 font-semibold">Venue Name</label>
                            <input
                                type="text"
                                id="venueName"
                                value={venueName}
                                onChange={handleVenueNameChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {venueExists && (
                                <p className="text-red-600 text-sm mt-2">Venue already exists!</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="maxOccupancy" className="block mb-2 font-semibold">Max Occupancy</label>
                            <input
                                type="number"
                                id="maxOccupancy"
                                value={maxOccupancy}
                                onChange={(e) => setMaxOccupancy(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-green-50">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        {editMode ? 'Update' : 'Add'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VenueEntry;
