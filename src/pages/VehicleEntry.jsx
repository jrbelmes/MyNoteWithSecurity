import React, { useState, useEffect, useRef } from 'react'; // Add useRef to imports
import Sidebar from './Sidebar';
import { FaPlus, FaTrash, FaSearch, FaCar, FaEye, FaEdit, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';
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
import { faEdit, faTrashAlt, faSearch, faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { Modal, Form, Input, TimePicker, Table, Button, Space, Tooltip, Image, Select, Upload, Empty, Pagination, Alert } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import {SecureStorage} from '../utils/encryption'; // Adjust the import path as necessary

const VehicleEntry = () => {
    const user_level_id = SecureStorage.getSessionItem('user_level_id');
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
    const [fileList, setFileList] = useState([]);
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const navigate = useNavigate();
    const BASE_URL = "http://localhost/coc/gsd/user.php";
    const user_id = localStorage.getItem('user_id');
    const IMAGE_BASE_URL = "http://localhost/coc/gsd/";
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('vehicle_id');
    const [sortOrder, setSortOrder] = useState('desc');

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
                    const imageUrl = `${IMAGE_BASE_URL}${vehicle.vehicle_pic}`;
                    setVehicleImage(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'vehicle-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setVehicleImage(null);
                    setFileList([]);
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
        setYear(new Date());
        setVehicleImage(null);
        setFileList([]);
        setSelectedStatus('');
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    const sanitizeAndValidateLicense = (value) => {
        const sanitized = sanitizeInput(value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid characters detected in license number');
            return '';
        }
        return sanitized;
    };

    const handleLicenseChange = (e) => {
        const value = e.target.value;
        setVehicleLicensed(sanitizeAndValidateLicense(value));
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            if (file) {
                // Create a reader to convert the file to base64
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setVehicleImage(reader.result);
                };
            } else if (newFileList[0].url) {
                // If it's already uploaded and has a URL
                setVehicleImage(newFileList[0].url);
            }
        } else {
            setVehicleImage(null);
        }
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
                        vehicle_license: sanitizedLicense,
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

                // If update is successful
                if (response.data.status === 'success') {
                    console.log('Update Success Response:', response.data);
                    toast.success(response.data.message || 'Vehicle updated successfully');
                    resetForm();
                    setShowEditModal(false);
                    fetchVehicles();
                    return;
                } else {
                    console.log('Update Error Response:', response.data);
                    toast.error(response.data.message || 'Failed to update vehicle');
                    return;
                }
            } else {
                // Add operation
                const requestData = JSON.stringify({
                    operation: "saveVehicle",
                    data: {
                        vehicle_model_id: vehicleModelId,
                        vehicle_license: sanitizedLicense,
                        year: dayjs(year).format('YYYY'),
                        vehicle_pic: vehicleImage,
                        user_admin_id: user_id,
                        status_availability_id: selectedStatus
                    }
                });
    
                response = await axios.post("http://localhost/coc/gsd/insert_master.php", requestData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // If add is successful, close modal and refresh data
                if (response.data.status === 'success') {
                    console.log('Add Success Response:', response.data);
                    toast.success(response.data.message);
                    resetForm();
                    setShowAddModal(false);
                    fetchVehicles();
                    return;
                }
            }
    
            // Only show error toast if the response indicates an error
            if (response.data.status !== 'success') {
               
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleArchiveVehicle = (vehicle) => {
        setSelectedVehicleId(vehicle.vehicle_id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (selectedVehicleId) {
            try {
                const response = await axios.post("http://localhost/coc/gsd/delete_master.php", 
                    JSON.stringify({
                        operation: "archiveResource",
                        resourceType: "vehicle",
                        resourceId: selectedVehicleId
                    }), {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.data.status === 'success') {
                    toast.success("Vehicle successfully archived!");
                    fetchVehicles();
                    setShowConfirmDelete(false);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleMakeChange = async (selectedMakeId) => {
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

    const handleCategoryChange = (selectedCategoryId) => {
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
        setSearchTerm(searchTerm);
        if (searchTerm === '') {
            setFilteredVehicles(vehicles);
        } else {
            const results = vehicles.filter(vehicle =>
                (vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm)) ||
                (vehicle.vehicle_license && vehicle.vehicle_license.toLowerCase().includes(searchTerm)) ||
                (vehicle.vehicle_make_name && vehicle.vehicle_make_name.toLowerCase().includes(searchTerm)) ||
                (vehicle.vehicle_category_name && vehicle.vehicle_category_name.toLowerCase().includes(searchTerm)) ||
                (vehicle.year && vehicle.year.toString().includes(searchTerm))
            );
            setFilteredVehicles(results);
        }
    };

    const handleCloseModal = () => {
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingVehicle(null);
    };

    const getImageUrl = (vehiclePic) => {
        if (!vehiclePic) return null;
        return `${IMAGE_BASE_URL}${vehiclePic}`;
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const handleRefresh = () => {
        fetchVehicles();
        setSearchTerm('');
    };
    
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
                <div className="p-[2.5rem] lg:p-12 min-h-screen">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="mb-4 mt-20">
                           
                            <h2 className="text-2xl font-bold text-green-900 mt-5">
                                Vehicle Management
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search vehicles..."
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        size="large"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip title="Refresh data">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        size="large"
                                    />
                                </Tooltip>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="large"
                                    onClick={handleAddVehicle}
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    Add Vehicle
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="loader"></div>
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('vehicle_id')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    ID
                                                    {sortField === 'vehicle_id' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Image
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('vehicle_license')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    License
                                                    {sortField === 'vehicle_license' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('vehicle_make_name')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Make
                                                    {sortField === 'vehicle_make_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('vehicle_category_name')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Category
                                                    {sortField === 'vehicle_category_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('vehicle_model_name')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Model
                                                    {sortField === 'vehicle_model_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('year')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Year
                                                    {sortField === 'year' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Status
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Actions
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVehicles && filteredVehicles.length > 0 ? (
                                            filteredVehicles
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((vehicle) => (
                                                    <tr
                                                        key={vehicle.vehicle_id}
                                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                    >
                                                        <td className="px-6 py-4">{vehicle.vehicle_id}</td>
                                                        <td className="px-6 py-4">
                                                            {vehicle.vehicle_pic ? (
                                                                <div className="cursor-pointer" onClick={() => handleViewImage(getImageUrl(vehicle.vehicle_pic))}>
                                                                    <img 
                                                                        src={getImageUrl(vehicle.vehicle_pic)} 
                                                                        alt={vehicle.vehicle_model_name} 
                                                                        className="w-12 h-12 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                                                    <i className="pi pi-car text-xl"></i>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <FaEye className="mr-2 text-green-900" />
                                                                <span className="font-medium">{vehicle.vehicle_license}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{vehicle.vehicle_make_name}</td>
                                                        <td className="px-6 py-4">{vehicle.vehicle_category_name}</td>
                                                        <td className="px-6 py-4">{vehicle.vehicle_model_name}</td>
                                                        <td className="px-6 py-4">{vehicle.year}</td>
                                                        <td className="px-6 py-4">
                                                            <Tag 
                                                                value={vehicle.status_availability_name || 'Unknown'} 
                                                                severity={vehicle.status_availability_name?.toLowerCase() === 'available' ? 'success' : 'danger'}
                                                                className="px-2 py-1 text-xs font-semibold"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    type="primary"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEditVehicle(vehicle)}
                                                                    size="middle"
                                                                    className="bg-green-900 hover:bg-lime-900"
                                                                />
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleArchiveVehicle(vehicle)}
                                                                    size="middle"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No vehicles found
                                                            </span>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={pageSize}
                                        total={filteredVehicles ? filteredVehicles.length : 0}
                                        onChange={(page, size) => {
                                            setCurrentPage(page);
                                            setPageSize(size);
                                        }}
                                        showSizeChanger={true}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} of ${total} items`
                                        }
                                        className="flex justify-end"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <FaEye className="mr-2 text-green-900" /> 
                        {selectedVehicleId ? "Edit Vehicle" : "Add Vehicle"}
                    </div>
                }
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
                                <Select
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
                                <Select
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
                                <Select
                                    value={vehicleModelId}
                                    options={modelsByCategory[category]?.map(model => ({
                                        label: model.vehicle_model_name,
                                        value: model.vehicle_model_id
                                    }))}
                                    onChange={(value) => setVehicleModelId(value)}
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
                                <Select
                                    value={selectedStatus}
                                    options={statusAvailability.map(status => ({
                                        label: status.status_availability_name,
                                        value: status.status_availability_id
                                    }))}
                                    onChange={(value) => setSelectedStatus(value)}
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
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={handleImageUpload}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                >
                                    {fileList.length < 1 && (
                                        <Button icon={<PlusOutlined />}>
                                            Upload
                                        </Button>
                                    )}
                                </Upload>
                                {vehicleImage && typeof vehicleImage === 'string' && vehicleImage.startsWith('http') && (
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

            {/* Confirm Delete Modal */}
            <Modal
                title={<div className="text-red-600 flex items-center"><ExclamationCircleOutlined className="mr-2" /> Confirm Deletion</div>}
                open={showConfirmDelete}
                onCancel={() => setShowConfirmDelete(false)}
                footer={[
                    <Button key="back" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={loading}
                        onClick={() => confirmDelete()}
                        icon={<DeleteOutlined />}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description={`Are you sure you want to archive this vehicle? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                open={viewImageModal}
                footer={null}
                onCancel={() => setViewImageModal(false)}
                width={700}
                centered
            >
                {currentImage && (
                    <Image
                        src={currentImage}
                        alt="Vehicle"
                        className="w-full object-contain max-h-[70vh]"
                        preview={false}
                    />
                )}
            </Modal>
        </div>
    );
};

export default VehicleEntry;