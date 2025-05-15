import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaSearch, FaPlus, FaEye, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { Modal, Form, Input, Upload, Select, Table, Button, Image, Tooltip, Space, Empty, Pagination, Alert } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Tag } from 'primereact/tag';

const EquipmentEntry = () => {
    const adminId = localStorage.getItem('adminId') || '';
    const [equipments, setEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const navigate = useNavigate();
    
    const [form] = Form.useForm();
    const [equipmentImage, setEquipmentImage] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [statusAvailability, setStatusAvailability] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
    const [sortField, setSortField] = useState('equip_id');
    const [sortOrder, setSortOrder] = useState('desc');

    const user_level_id = SecureStorage.getSessionItem('user_level_id');
    const user_id = SecureStorage.getSessionItem('user_id');

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
                    user_admin_id: user_admin_id
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
                    user_admin_id: user_admin_id
                }
            };
        }

        const url = editingEquipment 
            ? "http://localhost/coc/gsd/update_master1.php"
            : "http://localhost/coc/gsd/insert_master.php";

        setLoading(true);
        try {
            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                toast.success(`Equipment successfully ${editingEquipment ? "updated" : "added"}!`);
                fetchEquipments();
                resetForm();
            } else {
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
                setSelectedStatus(equipment.status_availability_id);
                setEditingEquipment(equipment);
                
                // Update form values
                form.setFieldsValue({
                    equipmentName: equipment.equip_name,
                    equipmentQuantity: equipment.equip_quantity,
                    category: equipment.equipment_equipment_category_id,
                    status: equipment.status_availability_id
                });

                // If there's an image, prepare it for display
                if (equipment.equip_pic) {
                    const imageUrl = `http://localhost/coc/gsd/${equipment.equip_pic}`;
                    setEquipmentImage(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'equipment-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setFileList([]);
                    setEquipmentImage(null);
                }
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
    };

    const handleArchiveEquipment = (equip_id) => {
        setSelectedEquipmentId(equip_id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            const requestData = {
                operation: "archiveResource",
                resourceType: "equipment",
                resourceId: selectedEquipmentId
            };
            
            const url = "http://localhost/coc/gsd/delete_master.php";
            const response = await axios.post(url, JSON.stringify(requestData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success("Equipment archived successfully!");
                fetchEquipments();
                setShowConfirmDelete(false);
            } else {
                toast.error("Failed to archive equipment: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while archiving equipment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        return `http://localhost/coc/gsd/${imagePath}`;
    };

    const handleRefresh = () => {
        fetchEquipments();
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

    const filteredEquipments = equipments.filter(equipment =>
        equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
                <Sidebar />
            </div>
            
            {/* Scrollable Content Area */}
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
                                Equipment Management
                            </h2>
                        </div>
                    </motion.div>

                    {/* Search and Filters */}
                    <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search equipments by name"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        size="large"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-lime-900 hover:bg-green-600"
                                >
                                    Add Equipment
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
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('equip_id')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    ID
                                                    {sortField === 'equip_id' && (
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
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('equip_name')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Equipment Name
                                                    {sortField === 'equip_name' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3" onClick={() => handleSort('equip_quantity')}>
                                                <div className="flex items-center cursor-pointer hover:text-gray-900">
                                                    Quantity
                                                    {sortField === 'equip_quantity' && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3">
                                                <div className="flex items-center">
                                                    Category
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
                                        {filteredEquipments && filteredEquipments.length > 0 ? (
                                            filteredEquipments
                                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                                .map((equipment) => (
                                                    <tr
                                                        key={equipment.equip_id}
                                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                    >
                                                        <td className="px-6 py-4">{equipment.equip_id}</td>
                                                        <td className="px-6 py-4">
                                                            {equipment.equip_pic ? (
                                                                <div className="cursor-pointer" onClick={() => handleViewImage(getImageUrl(equipment.equip_pic))}>
                                                                    <img 
                                                                        src={getImageUrl(equipment.equip_pic)} 
                                                                        alt={equipment.equip_name} 
                                                                        className="w-12 h-12 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                                                    <i className="pi pi-box text-xl"></i>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <FaEye className="mr-2 text-green-900" />
                                                                <span className="font-medium">{equipment.equip_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{equipment.equip_quantity}</td>
                                                        <td className="px-6 py-4">{equipment.equipment_category_name || 'Not specified'}</td>
                                                        <td className="px-6 py-4">
                                                            <Tag 
                                                                value={equipment.status || 'Available'} 
                                                                severity={(equipment.status || 'Available') === 'Available' ? 'success' : 'danger'}
                                                                className="px-2 py-1 text-xs font-semibold"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    type="primary"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => handleEditClick(equipment)}
                                                                    size="middle"
                                                                    className="bg-green-900 hover:bg-lime-900"
                                                                />
                                                                <Button
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleArchiveEquipment(equipment.equip_id)}
                                                                    size="middle"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-24 text-center">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                No equipments found
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
                                        total={filteredEquipments ? filteredEquipments.length : 0}
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

            {/* Add/Edit Equipment Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <FaEye className="mr-2 text-green-900" /> 
                        {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                    </div>
                }
                open={isAddModalOpen || isEditModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                }}
                okText={editingEquipment ? 'Update' : 'Add'}
                onOk={handleSubmit}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
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
                            min="1"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: 'Please select a category!' }]}
                    >
                        <Select
                            value={selectedCategory}
                            onChange={(value) => setSelectedCategory(value)}
                            placeholder="Select a category"
                        >
                            {categories.map(category => (
                                <Select.Option key={category.equipments_category_id} value={category.equipments_category_id}>
                                    {category.equipments_category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Status Availability"
                        name="status"
                        rules={[{ required: true, message: 'Please select status!' }]}
                    >
                        <Select
                            value={selectedStatus}
                            onChange={(value) => setSelectedStatus(value)}
                            placeholder="Select status"
                        >
                            {statusAvailability.map(status => (
                                <Select.Option key={status.status_availability_id} value={status.status_availability_id}>
                                    {status.status_availability_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

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
                                <Button icon={<PlusOutlined />}>
                                    Upload
                                </Button>
                            )}
                        </Upload>
                        {equipmentImage && typeof equipmentImage === 'string' && equipmentImage.startsWith('http') && (
                            <div className="mt-4">
                                <img
                                    src={equipmentImage}
                                    alt="Equipment Preview"
                                    className="w-32 h-32 object-cover rounded shadow-md"
                                />
                            </div>
                        )}
                    </Form.Item>
                </Form>
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
                        alt="Equipment"
                        className="w-full object-contain max-h-[70vh]"
                        preview={false}
                    />
                )}
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
                    description={`Are you sure you want to archive this equipment? This action cannot be undone.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            </Modal>
        </div>
    );
};

export default EquipmentEntry;