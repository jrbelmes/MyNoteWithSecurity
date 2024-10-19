import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../vehicle.css'; // Assuming custom styles are included here

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
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#F4CE14] bg-opacity-10">
            <Sidebar />
            <div className="flex-grow p-8">
                <h2 className="text-3xl font-bold text-[#495E57] mb-6">Venue Management</h2>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <div className="relative w-full md:w-64 mb-4 md:mb-0">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search venues..."
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-[#495E57]" />
                        </div>
                        <button onClick={handleAddVenue} className="bg-[#495E57] text-white px-4 py-2 rounded-lg hover:bg-[#3a4a45] transition duration-300 flex items-center">
                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                            Add Venue
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="loader"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#495E57] text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        <th className="px-6 py-3">No.</th>
                                        <th className="px-6 py-3">Venue Name</th>
                                        <th className="px-6 py-3">Occupancy</th>
                                        <th className="px-6 py-3">Created At</th>
                                        <th className="px-6 py-3">Updated At</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#495E57] divide-opacity-20">
                                    {currentVenues.length > 0 ? (
                                        currentVenues.map((venue, index) => (
                                            <tr key={venue.ven_id} className="hover:bg-[#F4CE14] hover:bg-opacity-10 transition-all">
                                                <td className="px-6 py-4 whitespace-nowrap">{indexOfFirstVenue + index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{venue.ven_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{venue.ven_occupancy}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{venue.ven_created_at}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{venue.ven_updated_at}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button className="text-[#495E57] hover:text-[#3a4a45] mr-3" onClick={() => handleEditVenue(venue)}>
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
                                            <td colSpan="6" className="px-6 py-4 text-center text-[#495E57]">
                                                No venues found.
                                            </td>
                                        </tr>
                                    )}
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
                                    className={`mx-1 px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-[#495E57] text-white' : 'bg-[#F4CE14] text-[#495E57] hover:bg-[#f3d44a]'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-6 text-[#495E57]">
                                {editMode ? 'Edit Venue' : 'Add Venue'}
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[#495E57] mb-2">Venue Name</label>
                                <input
                                    type="text"
                                    value={venueName}
                                    onChange={handleVenueNameChange}
                                    className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
                                />
                                {venueExists && (
                                    <p className="text-red-600 text-sm mt-2">Venue already exists!</p>
                                )}
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-[#495E57] mb-2">Max Occupancy</label>
                                <input
                                    type="number"
                                    value={maxOccupancy}
                                    onChange={(e) => setMaxOccupancy(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 text-[#495E57] px-4 py-2 rounded-md hover:bg-gray-400 transition duration-300 mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="bg-[#495E57] text-white px-4 py-2 rounded-md hover:bg-[#3a4a45] transition duration-300"
                                >
                                    {editMode ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueEntry;
