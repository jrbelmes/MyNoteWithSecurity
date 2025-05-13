import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Input, Table, Space, Tooltip } from 'antd';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaTools, FaEdit } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const EquipmentCategories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ categoryId: '', name: '' });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const encryptedUrl = SecureStorage.getLocalItem("url");

    useEffect(() => {
        const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
        console.log("this is encryptedUserLevel", encryptedUserLevel);
        if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}fetchMaster.php`, new URLSearchParams({ operation: 'fetchEquipments' }));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
                setFilteredCategories(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error fetching equipment categories');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const categoryToEdit = categories.find((category) => category.equipments_category_id === id);
        if (categoryToEdit) {
            setFormData({ categoryId: categoryToEdit.equipments_category_id, name: categoryToEdit.equipments_category_name });
            setEditMode(true);
            setShowModal(true);
        }
    };

    const handleDelete = (id) => {
        setSelectedCategoryId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!selectedCategoryId) {
            toast.error('Equipment category ID is required for deletion.');
            return;
        }

        try {
            const requestData = {
                operation: 'deleteEquipmentCategory',
                equipmentCategoryId: selectedCategoryId
            };

            const response = await axios.post(
                `${encryptedUrl}delete_master.php`,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.status === 'success') {
                setCategories(categories.filter(category => category.equipments_category_id !== selectedCategoryId));
                setFilteredCategories(filteredCategories.filter(category => category.equipments_category_id !== selectedCategoryId));
                toast.success('Equipment category deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete equipment category.');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Error deleting equipment category.');
        } finally {
            setShowConfirmDelete(false);
            setSelectedCategoryId(null);
        }
    };

    const handleSave = async () => {
        const sanitizedName = sanitizeInput(formData.name);
        if (!sanitizedName.trim()) {
            toast.error("Please enter a category name.");
            return;
        }

        if (!validateInput(sanitizedName)) {
            toast.error("Invalid characters in category name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const requestData = {
                operation: editMode ? 'updateEquipmentCategory' : 'saveEquipmentCategory',
                json: {
                    equipments_category_name: sanitizedName.trim()
                }
            };

            if (editMode) {
                requestData.json.equipments_category_id = formData.categoryId;
            }

            const endpoint = editMode 
                ? `${encryptedUrl}update_master1.php`
                : `${encryptedUrl}vehicle_master.php`;

            const response = await axios.post(
                endpoint,
                JSON.stringify(requestData),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.status === 'success') {
                toast.success(editMode ? 'Equipment category updated successfully!' : 'Equipment category added successfully!');
                fetchCategories();
                closeModal();
            } else {
                toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'add'} equipment category.`);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`Error ${editMode ? 'updating' : 'adding'} equipment category.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ categoryId: '', name: '' });
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        const results = categories.filter(category =>
            category.equipments_category_name.toLowerCase().includes(searchTerm)
        );
        setFilteredCategories(results);
    };

    const handleAddCategory = () => {
        setFormData({ categoryId: '', name: '' });
        setEditMode(false);
        setShowModal(true);
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Name',
            dataIndex: 'equipments_category_name',
            key: 'equipments_category_name',
            sorter: (a, b) => a.equipments_category_name.localeCompare(b.equipments_category_name),
            render: (text) => <span className="font-semibold text-green-800">{text}</span>
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Category">
                        <Button 
                            type="primary" 
                            icon={<FaEdit />} 
                            onClick={() => handleEdit(record.equipments_category_id)}
                            size="small"
                            className="bg-green-500 hover:bg-green-600 border-green-500"
                        />
                    </Tooltip>
                    <Tooltip title="Delete Category">
                        <Button 
                            icon={<FaTrash />} 
                            onClick={() => handleDelete(record.equipments_category_id)}
                            size="small"
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-100">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <div className="mb-4 mt-20">
                    <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                        <FaArrowLeft className="mr-2" /> Back to Master
                    </Button>
                </div>
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Equipment Categories</h2>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search by category name"
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddCategory}
                            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FaPlus className="mr-2" /> Add Category
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
                                dataSource={filteredCategories}
                                rowKey="equipments_category_id"
                                pagination={{
                                    pageSize: pageSize,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '20', '50'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                    onChange: (page, pageSize) => {
                                        setPageSize(pageSize);
                                    }
                                }}
                                bordered
                                size="middle"
                                className="venue-table"
                                style={{ backgroundColor: 'white' }}
                                locale={{
                                    emptyText: (
                                        <div className="text-center py-8">
                                            <FaTools className="mx-auto text-6xl text-gray-300 mb-4" />
                                            <p className="text-xl text-gray-500">No categories found</p>
                                        </div>
                                    )
                                }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add/Edit Category Modal */}
            <Modal
                title={editMode ? 'Edit Equipment Category' : 'Add Equipment Category'} 
                open={showModal} 
                onCancel={closeModal}
                footer={[
                    <Button key="cancel" onClick={closeModal}>
                        Cancel
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={isSubmitting} 
                        onClick={handleSave}
                        className="bg-green-500 hover:bg-green-600"
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                ]}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Category Name"
                        required
                        tooltip="Enter a unique category name"
                    >
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                            placeholder="Enter category name"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal
                title="Confirm Deletion"
                open={showConfirmDelete} 
                onCancel={() => setShowConfirmDelete(false)}
                footer={[
                    <Button key="cancel" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>,
                    <Button 
                        key="delete" 
                        danger 
                        onClick={confirmDelete}
                    >
                        Delete
                    </Button>
                ]}
            >
                <p>Are you sure you want to delete this equipment category?</p>
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default EquipmentCategories;
