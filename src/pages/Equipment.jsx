import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { motion } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { Modal, Form, Input, Upload, Select, Table, Button, Image, Tooltip, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Tag } from 'primereact/tag';

const EquipmentEntry = () => {
    const adminId = localStorage.getItem('adminId') || '';
    const [equipments, setEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
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

    const handleArchiveEquipment = async (equip_id) => {
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

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        return `http://localhost/coc/gsd/${imagePath}`;
    };

    const filteredEquipments = equipments.filter(equipment =>
        equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Table columns configuration
    const columns = [
        {
            title: 'ID',
            dataIndex: 'equip_id',
            key: 'equip_id',
            width: 80,
            sorter: (a, b) => a.equip_id - b.equip_id,
        },
        {
            title: 'Image',
            dataIndex: 'equip_pic',
            key: 'equip_pic',
            width: 100,
            render: (text, record) => {
                const imageUrl = getImageUrl(record.equip_pic);
                return (
                    <div className="flex justify-center">
                        {imageUrl ? (
                            <div className="cursor-pointer" onClick={() => handleViewImage(imageUrl)}>
                                <img 
                                    src={imageUrl} 
                                    alt={record.equip_name} 
                                    className="w-16 h-16 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                <i className="pi pi-box text-2xl"></i>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Equipment Name',
            dataIndex: 'equip_name',
            key: 'equip_name',
            sorter: (a, b) => a.equip_name.localeCompare(b.equip_name),
            render: (text) => <span className="font-semibold text-green-800">{text}</span>
        },
        {
            title: 'Quantity',
            dataIndex: 'equip_quantity',
            key: 'equip_quantity',
            width: 120,
            sorter: (a, b) => a.equip_quantity - b.equip_quantity,
        },
        {
            title: 'Category',
            dataIndex: 'equipment_category_name',
            key: 'equipment_category_name',
            width: 150,
            render: (text) => text || 'Not specified',
            filters: categories.map(category => ({
                text: category.equipments_category_name,
                value: category.equipments_category_name,
            })),
            onFilter: (value, record) => record.equipment_category_name === value,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag 
                    value={status || 'Available'} 
                    severity={(status || 'Available') === 'Available' ? 'success' : 'danger'}
                    className="px-2 py-1 text-xs font-semibold"
                />
            ),
            filters: statusAvailability.map(status => ({
                text: status.status_availability_name,
                value: status.status_availability_name === 'Available' ? 'Available' : 'Not Available',
            })),
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Created At',
            dataIndex: 'equip_created_at',
            key: 'equip_created_at',
            width: 170,
            sorter: (a, b) => new Date(a.equip_created_at) - new Date(b.equip_created_at),
            render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
        },
        {
            title: 'Updated At',
            dataIndex: 'equip_updated_at',
            key: 'equip_updated_at',
            width: 170,
            sorter: (a, b) => {
                if (!a.equip_updated_at) return -1;
                if (!b.equip_updated_at) return 1;
                return new Date(a.equip_updated_at) - new Date(b.equip_updated_at);
            },
            render: (text) => text ? dayjs(text).format('MMM D, YYYY HH:mm') : 'N/A'
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Equipment">
                        <Button 
                            type="primary" 
                            icon={<FontAwesomeIcon icon={faEdit} />} 
                            onClick={() => handleEditClick(record)}
                            size="small"
                            className="bg-green-500 hover:bg-green-600 border-green-500"
                        />
                    </Tooltip>
                    <Tooltip title="Archive Equipment">
                        <Button 
                            icon={<FontAwesomeIcon icon={faTrashAlt} />} 
                            onClick={() => handleArchiveEquipment(record.equip_id)}
                            size="small"
                            className="text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400"
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-green-100 to-white overflow-hidden">
            <div className="flex-none">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto bg-white bg-opacity-60 mt-20">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-6 lg:p-10"
                >
                    <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-sm">Equipment Management</h2>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="relative w-full md:w-64 mb-4 md:mb-0"
                            >
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search equipments..."
                                    className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                />
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                            </motion.div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Equipment
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
                                <Table 
                                    columns={columns} 
                                    dataSource={filteredEquipments}
                                    rowKey="equip_id"
                                    pagination={{
                                        pageSize: pageSize,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['10', '20', '50'],
                                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                        onChange: (page, pageSize) => {
                                            setPageSize(pageSize);
                                        }
                                    }}
                                    scroll={{ x: 1300 }}
                                    bordered
                                    size="middle"
                                    className="equipment-table"
                                    style={{ backgroundColor: 'white' }}
                                    locale={{
                                        emptyText: (
                                            <div className="text-center py-8">
                                                <i className="pi pi-box text-6xl text-gray-300 mb-4"></i>
                                                <p className="text-xl text-gray-500">No equipment found</p>
                                            </div>
                                        )
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Add/Edit Equipment Modal */}
            <Modal
                title={editingEquipment ? "Edit Equipment" : "Add Equipment"}
                open={isAddModalOpen || isEditModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                }}
                okText={editingEquipment ? "Update" : "Add"}
                onOk={handleSubmit}
                confirmLoading={loading}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        equipmentName: newEquipmentName,
                        equipmentQuantity: newEquipmentQuantity,
                        category: selectedCategory,
                        status: selectedStatus
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
                                            className="max-w-full h-auto max-h-40 rounded-lg shadow-lg"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </div>
                    </div>
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
        </div>
    );
};

export default EquipmentEntry;