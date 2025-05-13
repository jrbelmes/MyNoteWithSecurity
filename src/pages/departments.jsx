import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Space, Tooltip, Input } from 'antd';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaBuilding, FaEdit } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import dayjs from 'dayjs';

const Departments = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);

    const user_level_id = localStorage.getItem('user_level_id');

    useEffect(() => {
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
              localStorage.clear();
              navigate('/gsd');
          }
      }, [navigate]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', new URLSearchParams({ operation: 'fetchDepartments' }));
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
                setFilteredDepartments(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error fetching departments');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const departmentToEdit = departments.find((dept) => dept.departments_id === id);
        if (departmentToEdit) {
            setFormData({ id: departmentToEdit.departments_id, name: departmentToEdit.departments_name });
            setEditMode(true);
            setShowModal(true);
        }
    };

    const handleDelete = (id) => {
        setSelectedDepartmentId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/delete_master.php', {
                operation: 'deleteDepartment',
                departmentId: selectedDepartmentId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'success') {
                setDepartments(departments.filter(dept => dept.departments_id !== selectedDepartmentId));
                setFilteredDepartments(filteredDepartments.filter(dept => dept.departments_id !== selectedDepartmentId));
                toast.success('Department deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete department.');
            }
        } catch (error) {
            toast.error('Error deleting department.');
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const handleSave = async () => {
        const sanitizedName = sanitizeInput(formData.name);
        if (!sanitizedName.trim()) {
            toast.error("Please enter a department name.");
            return;
        }
        
        if (!validateInput(sanitizedName)) {
            toast.error("Invalid characters in department name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = editMode ? 'update_master1.php' : 'vehicle_master.php';
            const operation = editMode ? 'updateDepartment' : 'saveDepartmentData';
            const payload = editMode ? 
                { operation, id: formData.id, name: sanitizedName.trim() } :
                { operation, json: { departments_name: sanitizedName.trim() } };
            
            console.log('Sending payload:', payload); // Debug log
            
            const response = await axios.post(`http://localhost/coc/gsd/${endpoint}`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response received:', response.data); // Debug log

            if (response.data.status === 'success') {
                if (editMode) {
                    setDepartments(departments.map(dept => 
                        dept.departments_id === formData.id ? { ...dept, departments_name: sanitizedName.trim() } : dept
                    ));
                    setFilteredDepartments(filteredDepartments.map(dept => 
                        dept.departments_id === formData.id ? { ...dept, departments_name: sanitizedName.trim() } : dept
                    ));
                    toast.success('Department updated successfully!');
                } else {
                    // Check if response.data.data exists
                    const newDepartment = {
                        departments_id: response.data.data?.departments_id || Date.now().toString(), // Fallback ID if not provided
                        departments_name: sanitizedName.trim()
                    };
                    setDepartments(prevDepartments => [...prevDepartments, newDepartment]);
                    setFilteredDepartments(prevFiltered => [...prevFiltered, newDepartment]);
                    toast.success('Department added successfully!');
                }
                closeModal();
            } else {
                toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'add'} department.`);
            }
        } catch (error) {
            console.error('Error saving department:', error.response || error); // Enhanced error logging
            toast.error(error.response?.data?.message || `Error ${editMode ? 'updating' : 'adding'} department.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ id: '', name: '' });
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        const results = departments.filter(dept =>
            dept.departments_name.toLowerCase().includes(searchTerm)
        );
        setFilteredDepartments(results);
    };

    const handleAddDepartment = () => {
        setFormData({ id: '', name: '' });
        setEditMode(false);
        setShowModal(true);
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Department Name',
            dataIndex: 'departments_name',
            key: 'departments_name',
            sorter: (a, b) => a.departments_name.localeCompare(b.departments_name),
            render: (text) => <span className="font-semibold text-green-800">{text}</span>
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Department">
                        <Button 
                            type="primary" 
                            icon={<FaEdit />} 
                            onClick={() => handleEdit(record.departments_id)}
                            size="small"
                            className="bg-green-500 hover:bg-green-600 border-green-500"
                        />
                    </Tooltip>
                    <Tooltip title="Delete Department">
                        <Button 
                            icon={<FaTrash />} 
                            onClick={() => handleDelete(record.departments_id)}
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
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Departments</h2>
                <div className="bg-white rounded-lg shadow-xl p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <Input
                                prefix={<FaSearch className="text-green-400" />}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search by department name"
                                className="pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddDepartment}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FaPlus className="mr-2" /> Add Department
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
                                dataSource={filteredDepartments}
                                rowKey="departments_id"
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
                                className="departments-table"
                                style={{ backgroundColor: 'white' }}
                                locale={{
                                    emptyText: (
                                        <div className="text-center py-8">
                                            <FaBuilding className="mx-auto text-6xl text-gray-300 mb-4" />
                                            <p className="text-xl text-gray-500">No departments found</p>
                                        </div>
                                    )
                                }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add/Edit Department Modal */}
            <Modal 
                title={
                    <span>
                        <FaBuilding className="inline-block mr-2" /> 
                        {editMode ? 'Edit' : 'Add'} Department
                    </span>
                }
                open={showModal} 
                onCancel={closeModal}
                footer={[
                    <Button key="back" onClick={closeModal}>
                        Cancel
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={isSubmitting} 
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item 
                        label="Department Name"
                        required
                        tooltip="Enter the department name"
                    >
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
                            placeholder="Enter department name"
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
                    <Button key="back" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>,
                    <Button 
                        key="submit" 
                        danger 
                        onClick={confirmDelete}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <p>Are you sure you want to delete this department?</p>
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default Departments;
