import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { DataView } from 'primereact/dataview';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Modal, Form, Input, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { sanitizeInput, validateInput } from '../utils/sanitize';

const EquipmentEntry = () => {
    const adminId = localStorage.getItem('adminId') || '';
    const [equipments, setEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const navigate = useNavigate();
    
    const [filteredEquipments, setFilteredEquipments] = useState([]);
    const [form] = Form.useForm();
    const [equipmentImage, setEquipmentImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');

    const user_level_id = localStorage.getItem('user_level_id');

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchEquipments();
        fetchCategories();
        fetchStatusAvailability();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const filtered = equipments.filter(equipment =>
                equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredEquipments(filtered);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, equipments]);

    const fetchEquipments = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchEquipmentsWithStatus" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setEquipments(response.data.data);
            } else {
                toast.error("Error fetching equipments: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
            toast.error("An error occurred while fetching equipments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchCategories" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
            } else {
                toast.error("Error fetching categories: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("An error occurred while fetching categories.");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusAvailability = async () => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchStatusAvailability" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setStatusAvailability(response.data.data);
            } else {
                toast.error("Error fetching status availability: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
            toast.error("An error occurred while fetching status availability.");
        }
    };

    const handleEquipmentNameChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!validateInput(sanitized)) {
            toast.error('Invalid input detected. Please avoid special characters and scripts.');
            return;
        }
        setNewEquipmentName(sanitized);
        form.setFieldsValue({ equipmentName: sanitized });
    };

    const handleEquipmentQuantityChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        if (!/^\d*$/.test(sanitized)) {
            toast.error('Please enter only numbers for quantity.');
            return;
        }
        setNewEquipmentQuantity(sanitized);
        form.setFieldsValue({ equipmentQuantity: sanitized });
    };

    const handleSubmit = async () => {
        if (!validateInput(newEquipmentName)) {
            toast.error('Equipment name contains invalid characters.');
            return;
        }

        if (!newEquipmentName || !newEquipmentQuantity || !selectedCategory || !selectedStatus) {
            toast.error("All fields are required!");
            return;
        }

        const user_admin_id = localStorage.getItem('user_id');
        const user_level = localStorage.getItem('user_level_id');

        let requestData;
        if (editingEquipment) {
            requestData = {
                operation: "updateEquipment",
                equipmentData: {
                    equipmentId: editingEquipment.equip_id,
                    name: newEquipmentName,
                    quantity: newEquipmentQuantity,
                    categoryId: selectedCategory,
                    statusId: selectedStatus,
                    equip_pic: equipmentImage || null,
                    user_admin_id: user_level === '1' ? user_admin_id : null,  // Set for user admin (level 1)
                    super_admin_id: user_level === '4' ? user_admin_id : null  // Set for super admin (level 4)
                }
            };
        } else {
            requestData = {
                operation: "saveEquipment",
                data: {
                    name: newEquipmentName,
                    quantity: newEquipmentQuantity,
                    categoryId: selectedCategory,
                    equip_pic: equipmentImage,
                    status_availability_id: selectedStatus,
                    user_admin_id: user_level === '1' ? user_admin_id : null,  // Set for user admin (level 1)
                    super_admin_id: user_level === '4' ? user_admin_id : null  // Set for super admin (level 4)
                }
            };
        }

        const url = editingEquipment 
            ? "http://localhost/coc/gsd/update_master1.php"
            : "http://localhost/coc/gsd/insert_master.php";

        setLoading(true);
        try {
            // Update the request to send data as JSON
            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                toast.success(`Equipment successfully ${editingEquipment ? "updated" : "added"}!`);
                console.log(requestData);
                console.log(user_level_id);
                fetchEquipments();
                resetForm();
            } else {
                console.log(requestData);
                console.log(user_level_id);
                toast.error(`Failed to ${editingEquipment ? "update" : "add"} equipment: ` + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            toast.error(`An error occurred while ${editingEquipment ? "updating" : "adding"} equipment.`);
            console.error("Error saving equipment:", error);
        } finally {
            setLoading(false);
            if (editingEquipment) {
                setIsEditModalOpen(false);
            } else {
                setIsAddModalOpen(false);
            }
        }
    };
    
    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            const reader = new FileReader();
            reader.onloadend = () => {
                // Store the complete base64 string including data URL
                setEquipmentImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setEquipmentImage(null);
        }
    };

    const resetForm = () => {
        setNewEquipmentName('');
        setNewEquipmentQuantity('');
        setSelectedCategory('');
        setEditingEquipment(null);
        setEquipmentImage(null);
        setFileList([]);
        setSelectedStatus('');
        form.resetFields();
    };

    const handleEditClick = async (equipment) => {
        await getEquipmentDetails(equipment.equip_id);
        setIsEditModalOpen(true);
    };

    const getEquipmentDetails = async (equip_id) => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const equipment = response.data.data[0];
                setNewEquipmentName(equipment.equip_name);
                setNewEquipmentQuantity(equipment.equip_quantity);
                setSelectedCategory(equipment.equipment_equipment_category_id);
                setSelectedStatus(equipment.status_availability_id); // Add this line
                setEditingEquipment(equipment);
                
                // Update form values
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    equipmentQuantity: equipment.equip_quantity,
                    category: equipment.equipment_equipment_category_id,
                    status: equipment.status_availability_id  // Add this line
                });
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    };

    const handleDeleteClick = async (equip_id) => {
        const confirmation = window.confirm("Are you sure you want to archive this equipment?");
        if (!confirmation) return;

        const requestData = {
            operation: "archiveResource",
            resourceType: "equipment",
            resourceId: equip_id
        };

        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/delete_master.php";
            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success("Equipment archived successfully!");
                fetchEquipments();
            } else {
                toast.error("Failed to archive equipment: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while archiving equipment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const indexOfLastEquipment = currentPage * entriesPerPage;
    const indexOfFirstEquipment = indexOfLastEquipment - entriesPerPage;
    const currentEquipments = filteredEquipments.slice(indexOfFirstEquipment, indexOfLastEquipment);
    const totalPages = Math.ceil(filteredEquipments.length / entriesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const itemTemplate = (equipment) => {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <Card className="mb-4 bg-white bg-opacity-95 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-3 flex justify-center items-start">
                            <div className="group relative w-full min-h-[200px] rounded-lg overflow-hidden">
                                {equipment.equip_pic ? (
                                    <div className="relative h-48 md:h-64">
                                        <img 
                                            src={`http://localhost/coc/gsd/${equipment.equip_pic}`}
                                            alt={equipment.equip_name}
                                            className="object-cover w-full h-full rounded-lg transform group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-48 md:h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                                        <i className="pi pi-box text-6xl text-gray-400"></i>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Tag 
                                        value={equipment.status || 'Available'} 
                                        severity={equipment.status === 'Available' ? 'success' : 'danger'}
                                        className="px-3 py-1 text-xs font-semibold rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-9 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-green-800 mb-2 group-hover:text-green-600">
                                        {equipment.equip_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                            ID: {equipment.equip_id}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                            QTY: {equipment.equip_quantity}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <i className="pi pi-tag text-green-600 mr-2"></i>
                                    <div>
                                        <p className="text-xs text-gray-500">Category</p>
                                        <p className="font-semibold text-sm">{equipment.equipment_category_name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <i className="pi pi-calendar text-green-600 mr-2"></i>
                                    <div>
                                        <p className="text-xs text-gray-500">Created</p>
                                        <p className="font-semibold text-sm">{new Date(equipment.equip_created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <i className="pi pi-clock text-green-600 mr-2"></i>
                                    <div>
                                        <p className="text-xs text-gray-500">Last Updated</p>
                                        <p className="font-semibold text-sm">{equipment.equip_updated_at ? new Date(equipment.equip_updated_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-auto">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEditClick(equipment)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    <FontAwesomeIcon icon={faEdit} className="text-sm" />
                                    <span>Edit</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteClick(equipment.equip_id)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    <i className="pi pi-inbox text-sm"></i>
                                    <span>Archive</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
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
                    <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Equipment Management</h2>
                    <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="relative w-full md:w-96"
                            >
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search equipment..."
                                    className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-lg"
                                />
                                <FontAwesomeIcon 
                                    icon={faSearch} 
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 text-xl"
                                />
                            </motion.div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                <span className="text-lg">Add New Equipment</span>
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
                                value={filteredEquipments}
                                itemTemplate={itemTemplate}
                                paginator
                                rows={10}
                                emptyMessage={
                                    <div className="text-center py-8">
                                        <i className="pi pi-cog text-6xl text-gray-300 mb-4"></i>
                                        <p className="text-xl text-gray-500">No equipment found</p>
                                    </div>
                                }
                                className="p-4"
                            />
                        )}
                    </div>
                </motion.div>
            </div>

            <Modal
                title={editingEquipment ? "Edit Equipment" : "Add Equipment"}
                open={isAddModalOpen || isEditModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                }}
                onOk={handleSubmit}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        equipmentName: newEquipmentName,
                        equipmentQuantity: newEquipmentQuantity,
                        category: selectedCategory
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Form.Item
                                label="Equipment Name"
                                name="equipmentName"
                                rules={[{ required: true, message: 'Please input equipment name!' }]}
                            >
                                <Input
                                    value={newEquipmentName}
                                    onChange={handleEquipmentNameChange}
                                    placeholder="Enter equipment name"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Quantity"
                                name="equipmentQuantity"
                                rules={[{ required: true, message: 'Please input quantity!' }]}
                            >
                                <Input
                                    type="number"
                                    value={newEquipmentQuantity}
                                    onChange={handleEquipmentQuantityChange}
                                    placeholder="Enter quantity"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Category"
                                name="category"
                                rules={[{ required: true, message: 'Please select a category!' }]}
                            >
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.equipments_category_id} value={category.equipments_category_id}>
                                            {category.equipments_category_name}
                                        </option>
                                    ))}
                                </select>
                            </Form.Item>

                            <Form.Item
                                label="Status Availability"
                                name="status"
                                rules={[{ required: true, message: 'Please select status!' }]}
                            >
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select status</option>
                                    {statusAvailability.map(status => (
                                        <option key={status.status_availability_id} value={status.status_availability_id}>
                                            {status.status_availability_name}
                                        </option>
                                    ))}
                                </select>
                            </Form.Item>
                        </div>

                        <div className="space-y-4">
                            <Form.Item
                                label="Equipment Image"
                                tooltip="Upload equipment image (max 5MB)"
                            >
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={handleImageUpload}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                >
                                    {fileList.length < 1 && (
                                        <div>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>

                            {equipmentImage && (
                                <div className="mt-4">
                                    <img
                                        src={equipmentImage}
                                        alt="Equipment Preview"
                                        className="max-w-full h-auto rounded-lg shadow-lg"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default EquipmentEntry;
