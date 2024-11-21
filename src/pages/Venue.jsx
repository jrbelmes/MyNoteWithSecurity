import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../vehicle.css';
import { Modal, Input, Form, TimePicker, Select } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from 'primereact/fileupload';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { DataView } from 'primereact/dataview';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';

const VenueEntry = () => {
    const adminId = localStorage.getItem('adminId') || '';
    const user_level_id = localStorage.getItem('user_level_id');
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venuePic, setVenuePic] = useState(null);
    const [operatingHours, setOperatingHours] = useState('');
    const [venueExists, setVenueExists] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentVenueId, setCurrentVenueId] = useState(null);
    const [operatingHoursStart, setOperatingHoursStart] = useState(null);
    const [operatingHoursEnd, setOperatingHoursEnd] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceDate, setMaintenanceDate] = useState(null);
    const [maintenanceDescription, setMaintenanceDescription] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('1'); // Add this state
    const [statusOptions, setStatusOptions] = useState([]); // Add this state
    const navigate = useNavigate();
    const user_id = localStorage.getItem('user_id');
    const fileUploadRef = useRef(null);

   

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchStatusAvailability();
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

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", 
                new URLSearchParams({
                    operation: 'fetchStatusAvailability'
                })
            );
            
            if (response.data.status === 'success') {
                setStatusOptions(response.data.data);
            } else {
                console.error("Failed to fetch status options");
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
        }
    };

    const handleAddVenue = () => {
        setVenueName('');
        setMaxOccupancy('');
        setShowModal(true);
        setEditMode(false);
        setVenueExists(false);
    };

    const getVenueDetails = async (venueId) => {
        try {
            const formData = new URLSearchParams();
            formData.append('operation', 'fetchVenueById');
            formData.append('id', venueId);
    
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            console.log('Venue details response:', response.data); // Debug log
    
            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const venue = response.data.data[0];
                setVenueName(venue.ven_name);
                setMaxOccupancy(venue.ven_occupancy);
                setCurrentVenueId(venue.ven_id);
                setSelectedStatus(venue.status_availability_id);
                
                if (venue.ven_operating_hours) {
                    const [start, end] = venue.ven_operating_hours.split(' - ');
                    setOperatingHours(venue.ven_operating_hours);
                    if (start && end) {
                        setOperatingHoursStart(dayjs(start, 'HH:mm:ss'));
                        setOperatingHoursEnd(dayjs(end, 'HH:mm:ss'));
                    }
                }
                
                if (venue.ven_pic) {
                    const imageUrl = `http://localhost/coc/gsd/${venue.ven_pic}`;
                    setPreviewUrl(imageUrl);
                } else {
                    setPreviewUrl(null);
                }
                
                setShowModal(true);
                setEditMode(true);
            } else {
                toast.error("Failed to fetch venue details");
            }
        } catch (error) {
            console.error("Error fetching venue details:", error);
            toast.error("An error occurred while fetching venue details");
        }
    };
    

    const handleEditVenue = (venue) => {
        getVenueDetails(venue.ven_id);
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

    const handleUpdateVenue = async () => {
        if (!venueName || !maxOccupancy || !operatingHours) {
            toast.error("Please fill in all required fields!");
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                operation: 'updateVenue',
                venueData: {
                    venue_id: currentVenueId,
                    venue_name: venueName,
                    max_occupancy: maxOccupancy,
                    operating_hours: operatingHours,
                    status_availability_id: selectedStatus
                }
            };

            // Handle venue picture if exists
            if (venuePic instanceof File) {
                const formData = new FormData();
                formData.append('venue_pic', venuePic);
                formData.append('operation', 'updateVenue');
                formData.append('venueData', JSON.stringify(requestData.venueData));

                const response = await axios.post(
                    "http://localhost/coc/gsd/update_master1.php",
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.status === 'success') {
                    toast.success("Venue successfully updated!");
                    fetchVenues();
                    setShowModal(false);
                    resetForm();
                } else {
                    toast.error(response.data.message || "Failed to update venue");
                }
            } else {
                // If no new image, send JSON request
                const response = await axios.post(
                    "http://localhost/coc/gsd/update_master1.php",
                    requestData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.status === 'success') {
                    toast.success("Venue successfully updated!");
                    fetchVenues();
                    setShowModal(false);
                    resetForm();
                } else {
                    toast.error(response.data.message || "Failed to update venue");
                }
            }
        } catch (error) {
            console.error("Error updating venue:", error);
            toast.error("An error occurred while updating the venue.");
        } finally {
            setLoading(false);
        }
    };
    

    const resetForm = () => {
        setVenueName('');
        setMaxOccupancy('');
        setOperatingHours('');
        setVenuePic(null);
        setPreviewUrl(null);
        setOperatingHoursStart(null);
        setOperatingHoursEnd(null);
    };

    const handleSubmit = async () => {
        if (editMode) {
            await handleUpdateVenue();
        } else {
            if (!venueName || !maxOccupancy || !operatingHours) {
                toast.error("Please fill in all required fields!");
                return;
            }

            setLoading(true);
            try {
                let imageBase64 = null;
                if (venuePic) {
                    const reader = new FileReader();
                    imageBase64 = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(venuePic);
                    });
                }

                const requestData = {
                    operation: 'saveVenue',
                    data: {
                        name: venueName,
                        occupancy: maxOccupancy,
                        operating_hours: operatingHours,
                        user_admin_id: parseInt(user_id),
                        status_availability_id: parseInt(selectedStatus),
                        ven_pic: imageBase64
                    }
                };

                const response = await axios.post(
                    "http://localhost/coc/gsd/insert_master.php",
                    requestData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.status === 'success') {
                    toast.success("Venue successfully added!");
                    fetchVenues();
                    setShowModal(false);
                    resetForm();
                } else {
                    toast.error(response.data.message || "Failed to save venue");
                }
            } catch (error) {
                console.error("Error saving venue:", error);
                toast.error("An error occurred while saving the venue.");
            } finally {
                setLoading(false);
            }
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

    const handleTimeChange = (times, timeStrings) => {
        if (times) {
            setOperatingHoursStart(times[0]);
            setOperatingHoursEnd(times[1]);
            setOperatingHours(`${timeStrings[0]} - ${timeStrings[1]}`);
        } else {
            setOperatingHoursStart(null);
            setOperatingHoursEnd(null);
            setOperatingHours('');
        }
    };

    const onFileUpload = (event) => {
        if (event.files && event.files[0]) {
            const file = event.files[0];
            setVenuePic(file);
            setPreviewUrl(URL.createObjectURL(file));
            toast.success('File uploaded successfully');
        }
    };

    const onFileRemove = () => {
        setVenuePic(null);
        setPreviewUrl(null);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    const handleMaintenanceSubmit = async () => {
        if (!maintenanceDate || !maintenanceDescription) {
            toast.error("Please fill in all maintenance details!");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", new URLSearchParams({
                operation: "scheduleMaintenanceVenue",
                venue_id: currentVenueId,
                maintenance_date: dayjs(maintenanceDate).format('YYYY-MM-DD HH:mm:ss'),
                description: maintenanceDescription
            }));

            if (response.data.status === 'success') {
                toast.success("Maintenance schedule set successfully!");
                setShowMaintenanceModal(false);
                setMaintenanceDate(null);
                setMaintenanceDescription('');
                fetchVenues();
            } else {
                toast.error("Failed to set maintenance schedule");
            }
        } catch (error) {
            console.error("Error scheduling maintenance:", error);
            toast.error("An error occurred while scheduling maintenance");
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

    const getImageUrl = (venuePic) => {
        if (!venuePic) return null;
        return `http://localhost/coc/gsd/${venuePic}`;
    };

    const itemTemplate = (venue) => {
        const imageUrl = getImageUrl(venue.ven_pic);

        return (
            <Card className="mb-4 transform hover:scale-[1.01] transition-transform duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 flex justify-center items-start">
                        <div className="relative group w-full min-h-[200px] bg-gray-100 rounded-lg">
                            {imageUrl ? (
                                <img 
                                    src={imageUrl}
                                    alt={venue.ven_name}
                                    className="w-full h-48 md:h-64 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-48 md:h-64">
                                    <p className="text-gray-500">No image available</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="md:col-span-9">
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-green-800 mb-2">{venue.ven_name}</h3>
                                    <p className="text-gray-600 text-sm">
                                        ID: <span className="font-semibold">#{venue.ven_id}</span>
                                    </p>
                                </div>
                                <Tag 
                                    value={venue.status_availability_id === '1' ? 'Available' : 'Not Available'} 
                                    severity={venue.status_availability_id === '1' ? 'success' : 'danger'}
                                    className="px-4 py-2 text-sm font-semibold"
                                />
                            </div>

                            <Divider className="my-3" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-users text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Max Occupancy</p>
                                        <p className="font-semibold">{venue.ven_occupancy} people</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-clock text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Operating Hours</p>
                                        <p className="font-semibold">{venue.ven_operating_hours || 'Not specified'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-calendar text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="font-semibold">{dayjs(venue.ven_created_at).format('MMM D, YYYY HH:mm')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-refresh text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Updated</p>
                                        <p className="font-semibold">{dayjs(venue.ven_updated_at).format('MMM D, YYYY HH:mm')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-auto">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEditVenue(venue)}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors duration-300"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                    <span>Edit</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteVenue(venue.ven_id)}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors duration-300"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                    <span>Delete</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setCurrentVenueId(venue.ven_id);
                                        setShowMaintenanceModal(true);
                                    }}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors duration-300"
                                >
                                    <i className="pi pi-calendar-plus"></i>
                                    <span>Schedule Maintenance</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-white to-green-500 overflow-hidden">
            <div className="flex-none">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-6 lg:p-10"
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
                            <DataView
                                value={filteredVenues}
                                itemTemplate={itemTemplate}
                                paginator
                                rows={entriesPerPage}
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} venues"
                                rowsPerPageOptions={[5, 10, 20]}
                                emptyMessage={
                                    <div className="text-center py-8">
                                        <i className="pi pi-search text-6xl text-gray-300 mb-4"></i>
                                        <p className="text-xl text-gray-500">No venues found</p>
                                    </div>
                                }
                                className="p-4"
                            />
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
            </div>

            {/* Venue Modal */}
            <Modal
                title={editMode ? 'Edit Venue' : 'Add Venue'}
                open={showModal}
                onCancel={() => setShowModal(false)}
                okText={editMode ? 'Update' : 'Add'}
                onOk={handleSubmit}
                confirmLoading={loading}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Venue Name"
                        validateStatus={venueExists ? 'error' : ''}
                        help={venueExists && 'Venue already exists!'}
                    >
                        <Input
                            value={venueName}
                            onChange={handleVenueNameChange}
                            placeholder="Enter venue name"
                        />
                    </Form.Item>
                    <Form.Item label="Max Occupancy">
                        <Input
                            type="number"
                            value={maxOccupancy}
                            onChange={(e) => setMaxOccupancy(e.target.value)}
                            placeholder="Enter maximum occupancy"
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Operating Hours"
                        required
                        tooltip="Select start and end time"
                    >
                        <TimePicker.RangePicker 
                            format="HH:mm:ss"
                            value={[operatingHoursStart, operatingHoursEnd]}
                            onChange={handleTimeChange}
                            className="w-full"
                            placeholder={['Start Time', 'End Time']}
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Venue Picture" 
                        tooltip="Upload venue image (max 5MB, formats: jpg, png)"
                    >
                        <FileUpload
                            ref={fileUploadRef}
                            mode="advanced"
                            name="venue-pic"
                            multiple={false}
                            accept="image/*"
                            maxFileSize={5000000}
                            onSelect={onFileUpload}
                            onClear={onFileRemove}
                            headerTemplate={options => {
                                const { className, chooseButton, uploadButton, cancelButton } = options;
                                return (
                                    <div className={className} style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center'}}>
                                        {chooseButton}
                                    </div>
                                );
                            }}
                            emptyTemplate={
                                <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                                    <i className="pi pi-image mb-2 text-4xl text-gray-400" />
                                    <p className="m-0 text-gray-500">
                                        Drag and drop image here or click to browse
                                    </p>
                                </div>
                            }
                        />
                        {previewUrl && (
                            <div className="mt-4">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded shadow-md"
                                />
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item 
                        label="Status" 
                        required
                        tooltip="Select venue availability status"
                    >
                        <Select
                            value={selectedStatus}
                            onChange={(value) => setSelectedStatus(value)}
                            className="w-full"
                        >
                            {statusOptions.map(status => (
                                <Select.Option 
                                    key={status.status_availability_id} 
                                    value={status.status_availability_id}
                                >
                                    {status.status_availability_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Maintenance Modal */}
            <Modal
                title="Schedule Maintenance"
                open={showMaintenanceModal}
                onCancel={() => setShowMaintenanceModal(false)}
                onOk={handleMaintenanceSubmit}
                confirmLoading={loading}
            >
                <Form layout="vertical">
                    <Form.Item 
                        label="Maintenance Date" 
                        required
                        tooltip="Select the date and time for maintenance"
                    >
                        <Input
                            type="datetime-local"
                            value={maintenanceDate}
                            onChange={(e) => setMaintenanceDate(e.target.value)}
                            min={dayjs().format('YYYY-MM-DDTHH:mm')}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Maintenance Description"
                        required
                        tooltip="Provide details about the maintenance"
                    >
                        <Input.TextArea
                            value={maintenanceDescription}
                            onChange={(e) => setMaintenanceDescription(e.target.value)}
                            placeholder="Enter maintenance details"
                            rows={4}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default VenueEntry;

