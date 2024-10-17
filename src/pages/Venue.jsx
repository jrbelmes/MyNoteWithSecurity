import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import '../vehicle.css';

const VenueEntry = () => {
    const adminId = localStorage.getItem('adminId') || '';
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
        if (adminLevel !== '100') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [adminLevel, navigate]);

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
                max_occupancy: maxOccupancy,
                adminId: adminId,
            };

            let url, operation;
            if (editMode) {
                venueData.venue_id = currentVenueId;
                url = "http://localhost/coc/gsd/update_master1.php";
                operation = "updateVenueData";
            } else {
                url = "http://localhost/coc/gsd/insert_master.php";
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
            const response = await axios.post("http://localhost/gsd/delete_master.php", new URLSearchParams({
                operation: "deleteVenue",
                venue_id: venueId
            }));

            if (response.data.status === 'success') {
                toast.success("Venue successfully deleted!");
                fetchVenues();
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
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">Venue Entry</h2>
                <div className="flex flex-col lg:flex-row items-center mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="border border-gray-300 p-2 rounded w-full max-w-xs"
                    />
                    <button onClick={handleAddVenue} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-4">
                        Add Venue
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">No.</th>
                                <th className="py-3 px-6 text-left">Venue Name</th>
                                <th className="py-3 px-6 text-left">Occupancy</th>
                                <th className="py-3 px-6 text-left">Created At</th>
                                <th className="py-3 px-6 text-left">Updated At</th>
                                <th className="py-3 px-6 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {currentVenues.length > 0 ? (
                                currentVenues.map((venue, index) => (
                                    <tr key={venue.ven_id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6">{indexOfFirstVenue + index + 1}</td>
                                        <td className="py-3 px-6">{venue.ven_name}</td>
                                        <td className="py-3 px-6">{venue.ven_occupancy}</td>
                                        <td className="py-3 px-6">{venue.ven_created_at}</td>
                                        <td className="py-3 px-6">{venue.ven_updated_at}</td>
                                        <td className="py-3 px-6">
                                            <button className="text-blue-600 hover:text-blue-800 mr-2" onClick={() => handleEditVenue(venue)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteVenue(venue.ven_id)}>
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-3 px-6 text-center">No venues found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                <div className="flex justify-center mt-4">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index}
                            onClick={() => paginate(index + 1)}
                            className={`mx-1 px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg p-4 w-80">
                            <h3 className="text-lg font-bold mb-2">{editMode ? "Edit Venue" : "Add Venue"}</h3>
                            <div className="mb-2">
                                <label className="block mb-1">Venue Name:</label>
                                <input
                                    type="text"
                                    value={venueName}
                                    onChange={handleVenueNameChange}
                                    className="border border-gray-300 p-2 w-full"
                                    required
                                />
                                {venueExists && <span className="text-red-600">This venue already exists!</span>}
                            </div>
                            <div className="mb-2">
                                <label className="block mb-1">Max Occupancy:</label>
                                <input
                                    type="number"
                                    value={maxOccupancy}
                                    onChange={(e) => setMaxOccupancy(e.target.value)}
                                    className="border border-gray-300 p-2 w-full"
                                    required
                                />
                            </div>
                            <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2">
                                {editMode ? "Update" : "Add"}
                            </button>
                            <button onClick={() => setShowModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueEntry;
