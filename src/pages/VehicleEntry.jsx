import React, { useState, useEffect, useRef } from 'react'; // Add useRef to imports
import Sidebar from './Sidebar';
import { FaPlus, FaTrash, FaSearch, FaCar } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../vehicle.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/lara-light-green/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { DataView } from 'primereact/dataview';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Modal, Form, Input, TimePicker } from 'antd'; // Add this import
import { sanitizeInput, validateInput } from '../utils/sanitize';

const VehicleEntry = () => {
    const user_level_id = localStorage.getItem('user_level_id');
    // Add fileUploadRef before other state declarations
    const fileUploadRef = useRef(null);
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [makes, setMakes] = useState([]);
    const [modelsByCategory, setModelsByCategory] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [vehicleLicensed, setVehicleLicensed] = useState('');
    const [makeId, setMakeId] = useState('');
    const [vehicleModelId, setVehicleModelId] = useState('');
    const [category, setCategory] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [year, setYear] = useState(new Date());
    const [vehicleImage, setVehicleImage] = useState(null);
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const navigate = useNavigate();
    const BASE_URL = "http://localhost/coc/gsd/user.php";
    const user_id = localStorage.getItem('user_id');
    const IMAGE_BASE_URL = "http://localhost/coc/gsd/";

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchVehicles();
        fetchMakes();
        fetchCategoriesAndModels();
        fetchStatusAvailability(); // Add this line
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchAllVehicles" }));
            if (response.data.status === 'success') {
                setVehicles(response.data.data);
                setFilteredVehicles(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMakes = async () => {
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchMake" }));
            if (response.data.status === 'success') {
                setMakes(response.data.data);
                return response.data.data;
            } else {
                toast.error(response.data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message);
            return [];
        }
    };

    const getVehicleById = async (id) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", new URLSearchParams({ 
                operation: "fetchVehicleById", 
                id 
            }));

            if (response.data.status === 'success' && response.data.data.length > 0) {
                const vehicle = response.data.data[0];
                setEditingVehicle(vehicle);
                setVehicleLicensed(vehicle.vehicle_license);
                setYear(new Date(vehicle.year, 0)); // Convert year to Date object
                
                // Handle vehicle image
                if (vehicle.vehicle_pic) {
                    setVehicleImage(`${IMAGE_BASE_URL}${vehicle.vehicle_pic}`);
                }

                // Handle status
                const status = statusAvailability.find(s => s.status_availability_name === vehicle.status_availability_name);
                if (status) {
                    setSelectedStatus(status.status_availability_id);
                }

                // Fetch and set make
                const makesData = await fetchMakes();
                const selectedMake = makesData.find(make => make.vehicle_make_name === vehicle.vehicle_make_name);
                if (selectedMake) {
                    setMakeId(selectedMake.vehicle_make_id);
                    await fetchCategoriesAndModels(selectedMake.vehicle_make_id);
                }
            } else {
                toast.error("Failed to fetch vehicle details");
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (editingVehicle && categories.length > 0) {
            const selectedCategory = categories.find(cat => cat.vehicle_category_name === editingVehicle.vehicle_category_name);
            if (selectedCategory) {
                setCategory(selectedCategory.vehicle_category_id);
                
                const models = modelsByCategory[selectedCategory.vehicle_category_id] || [];
                const selectedModel = models.find(model => model.vehicle_model_name === editingVehicle.vehicle_model_name);
                if (selectedModel) {
                    setVehicleModelId(selectedModel.vehicle_model_id);
                }
            }
        }
    }, [editingVehicle, categories, modelsByCategory]);

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicleId(vehicle.vehicle_id);
        getVehicleById(vehicle.vehicle_id);
        setShowEditModal(true);
    };

    const handleAddVehicle = () => {
        resetForm();
        setSelectedVehicleId(null);
        setShowAddModal(true);
    };

    const resetForm = () => {
        setVehicleLicensed('');
        setMakeId('');
        setCategory('');
        setVehicleModelId('');
        setCategories([]);
        setModelsByCategory({});
        setSelectedVehicleId(null);
    };

    const sanitizeAndValidateLicense = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid characters detected in license number');
            return '';
        }
        return sanitized;
    };

    const handleSubmit = async () => {
        // Sanitize and validate inputs
        const sanitizedLicense = sanitizeAndValidateLicense(vehicleLicensed);
        if (!sanitizedLicense) {
            return;
        }

        if (!vehicleModelId || !year || !selectedStatus) {
            toast.error("Please fill in all required fields.");
            return;
        }
    
        setIsSubmitting(true);
    
        try {
            let response;
            if (selectedVehicleId) {
                // Update operation with JSON format
                const requestData = {
                    operation: "updateVehicleLicense",
                    vehicleData: {
                        vehicle_id: selectedVehicleId,
                        vehicle_model_id: vehicleModelId,
                        vehicle_license: sanitizedLicense, // Use sanitized value
                        year: dayjs(year).format('YYYY'),
                        status_availability_id: selectedStatus,
                        vehicle_pic: vehicleImage || editingVehicle?.vehicle_pic || ''
                    }
                };
    
                response = await axios.post(
                    "http://localhost/coc/gsd/update_master1.php",
                    JSON.stringify(requestData),
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // Add operation
                const requestData = JSON.stringify({
                    operation: "saveVehicle",
                    data: {
                        vehicle_model_id: vehicleModelId,
                        vehicle_license: sanitizedLicense, // Use sanitized value
                        year: dayjs(year).format('YYYY'),
                        vehicle_pic: vehicleImage,
                        user_admin_id: user_id,  // Add this line
                        status_availability_id: selectedStatus  // Add this line
                    }
                });
    
                response = await axios.post("http://localhost/coc/gsd/insert_master.php", requestData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
    
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                resetForm();
                setShowAddModal(false);
                setShowEditModal(false);
                fetchVehicles();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVehicle = async (vehicle) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            try {
                const response = await axios.post("http://localhost/coc/gsd/delete_master.php", new URLSearchParams({
                    operation: "deleteVehicle",
                    vehicle_id: vehicle.vehicle_id,
                }));
                if (response.data.status === 'success') {
                    toast.success("Vehicle successfully deleted!");
                    fetchVehicles();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleMakeChange = async (e) => {
        const selectedMakeId = e.target.value;
        setMakeId(selectedMakeId);
        setCategory(''); // Reset category when make changes
        setVehicleModelId(''); // Reset model when make changes
        if (selectedMakeId) {
            await fetchCategoriesAndModels(selectedMakeId);
        } else {
            setCategories([]);
            setModelsByCategory({});
        }
    };

    const handleCategoryChange = (e) => {
        const selectedCategoryId = e.target.value;
        setCategory(selectedCategoryId);
        setVehicleModelId(''); // Reset model when category changes
    };

    const fetchCategoriesAndModels = async (makeId) => {
        if (!makeId) return;
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ 
                operation: "fetchCategoriesAndModels",
                make_id: makeId
            }));
            if (response.data.status === 'success') {
                setCategories(response.data.data.categories);
                setModelsByCategory(response.data.data.modelsByCategory);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", 
                new URLSearchParams({ operation: "fetchStatusAvailability" })
            );
            if (response.data.status === 'success') {
                setStatusAvailability(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const results = vehicles.filter(vehicle =>
            vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm)
        );
        setFilteredVehicles(results);
    };
    const handleCloseModal = () => {
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingVehicle(null);
    };

    const itemTemplate = (vehicle) => {
        // Helper function to determine tag severity based on status
        const getStatusSeverity = (status) => {
            return status?.toLowerCase() === 'available' ? 'success' : 'danger';
        };
    
        return (
            <Card className="mb-4 transform hover:scale-[1.01] transition-transform duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 flex justify-center items-start">
                        <div className="relative group w-full min-h-[200px] bg-gray-100 rounded-lg">
                            {vehicle.vehicle_pic ? (
                                <img 
                                    src={`${IMAGE_BASE_URL}${vehicle.vehicle_pic}`}
                                    alt={vehicle.vehicle_model_name}
                                    className="w-full h-48 md:h-64 object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'placeholder-image-url'; // Optional: provide a fallback image
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-48 md:h-64">
                                    <FaCar className="text-4xl text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="md:col-span-9">
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-green-800 mb-2">{vehicle.vehicle_model_name}</h3>
                                    <p className="text-gray-600 text-sm">
                                        License: <span className="font-semibold">{vehicle.vehicle_license}</span>
                                    </p>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Year: <span className="font-semibold">{vehicle.year}</span>
                                    </p>
                                </div>
                                <Tag 
                                    value={vehicle.status_availability_name || 'Unknown'} 
                                    severity={getStatusSeverity(vehicle.status_availability_name)}
                                    className="px-4 py-2 text-sm font-semibold capitalize"
                                />
                            </div>

                            <Divider className="my-3" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-car text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Make</p>
                                        <p className="font-semibold">{vehicle.vehicle_make_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-tag text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Category</p>
                                        <p className="font-semibold">{vehicle.vehicle_category_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-calendar text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Year</p>
                                        <p className="font-semibold">{vehicle.year}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-clock text-green-600"></i>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Updated</p>
                                        <p className="font-semibold">{vehicle.updated_at || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-auto">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEditVehicle(vehicle)}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors duration-300"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                    <span>Edit</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteVehicle(vehicle)}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors duration-300"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                    <span>Delete</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    const handleImageUpload = (event) => {
        const file = event.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setVehicleImage(reader.result); // This will store the base64 image data
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLicenseChange = (e) => {
        const sanitized = sanitizeAndValidateLicense(e.target.value);
        setVehicleLicensed(sanitized);
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
                    <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Vehicle Management</h2>
                    <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="relative w-full md:w-64 mb-4 md:mb-0"
                            >
                                <input
                                    type="text"
                                    onChange={handleSearchChange}
                                    placeholder="Search vehicles..."
                                    className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                />
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                            </motion.div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddVehicle}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Vehicle
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
                                value={filteredVehicles}
                                itemTemplate={itemTemplate}
                                paginator
                                rows={10}
                                emptyMessage={
                                    <div className="text-center py-8">
                                        <i className="pi pi-car text-6xl text-gray-300 mb-4"></i>
                                        <p className="text-xl text-gray-500">No vehicles found</p>
                                    </div>
                                }
                                className="p-4"
                            />
                        )}
                    </div>
                </motion.div>
            </div>

            <Modal
                title={selectedVehicleId ? "Edit Vehicle" : "Add Vehicle"}
                open={showAddModal || showEditModal}
                onCancel={handleCloseModal}
                okText={selectedVehicleId ? "Update" : "Add"}
                onOk={handleSubmit}
                confirmLoading={isSubmitting}
                width={800}
                className="vehicle-modal"
            >
                <Form layout="vertical">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Form.Item
                                label="Make"
                                required
                                tooltip="Select the vehicle make"
                            >
                                <Dropdown
                                    value={makeId}
                                    options={makes.map(make => ({
                                        label: make.vehicle_make_name,
                                        value: make.vehicle_make_id
                                    }))}
                                    onChange={handleMakeChange}
                                    placeholder="Select Make"
                                    className="w-full"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Category"
                                required
                                tooltip="Select the vehicle category"
                            >
                                <Dropdown
                                    value={category}
                                    options={categories.map(cat => ({
                                        label: cat.vehicle_category_name,
                                        value: cat.vehicle_category_id
                                    }))}
                                    onChange={handleCategoryChange}
                                    placeholder="Select Category"
                                    className="w-full"
                                    disabled={!makeId}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Model"
                                required
                                tooltip="Select the vehicle model"
                            >
                                <Dropdown
                                    value={vehicleModelId}
                                    options={modelsByCategory[category]?.map(model => ({
                                        label: model.vehicle_model_name,
                                        value: model.vehicle_model_id
                                    }))}
                                    onChange={(e) => setVehicleModelId(e.value)}
                                    placeholder="Select Model"
                                    className="w-full"
                                    disabled={!category}
                                />
                            </Form.Item>

                            <Form.Item
                                label="License Number"
                                required
                                tooltip="Enter the vehicle license number"
                            >
                                <Input
                                    value={vehicleLicensed}
                                    onChange={handleLicenseChange}
                                    placeholder="Enter license number"
                                    maxLength={50} // Add reasonable limit
                                />
                            </Form.Item>

                            <Form.Item
                                label="Year"
                                required
                                tooltip="Select the vehicle year"
                            >
                                <Calendar
                                    value={year}
                                    onChange={(e) => setYear(e.value)}
                                    view="year"
                                    dateFormat="yy"
                                    placeholder="Select Year"
                                    className="w-full"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Availability Status"
                                required
                                tooltip="Select the vehicle availability status"
                            >
                                <Dropdown
                                    value={selectedStatus}
                                    options={statusAvailability.map(status => ({
                                        label: status.status_availability_name,
                                        value: status.status_availability_id
                                    }))}
                                    onChange={(e) => setSelectedStatus(e.value)}
                                    placeholder="Select Status"
                                    className="w-full"
                                />
                            </Form.Item>
                        </div>

                        <div className="space-y-4">
                            <Form.Item
                                label="Vehicle Image"
                                tooltip="Upload vehicle image (max 5MB)"
                            >
                                <FileUpload
                                    ref={fileUploadRef}
                                    mode="advanced"
                                    name="vehicle-pic"
                                    multiple={false}
                                    accept="image/*"
                                    maxFileSize={5000000}
                                    onSelect={handleImageUpload}
                                    headerTemplate={options => {
                                        const { className, chooseButton } = options;
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
                                {vehicleImage && (
                                    <div className="mt-4">
                                        <img src={vehicleImage} 
                                            alt="Vehicle Preview" 
                                            className="max-w-full h-auto rounded-lg shadow-lg" 
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </div>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default VehicleEntry;
