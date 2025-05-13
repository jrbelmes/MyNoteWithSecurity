import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaCar, FaEdit } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';
import { Table, Space, Button, Tooltip, Modal, Form, Input } from 'antd';
import dayjs from 'dayjs';

const VehicleCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
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
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
        new URLSearchParams({ operation: 'fetchVehicleCategories' })
      );
      if (response.data.status === 'success') {
        setCategories(response.data.data);
        setFilteredCategories(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error fetching vehicle categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    const categoryToEdit = categories.find((category) => category.vehicle_category_id === id);
    if (categoryToEdit) {
      setFormData({ id: categoryToEdit.vehicle_category_id, name: categoryToEdit.vehicle_category_name });
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedCategoryId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.post(`${encryptedUrl}delete_master.php`, {
        operation: 'deleteVehicleCategory',
        vehicleCategoryId: selectedCategoryId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        setCategories(categories.filter(category => category.vehicle_category_id !== selectedCategoryId));
        setFilteredCategories(filteredCategories.filter(category => category.vehicle_category_id !== selectedCategoryId));
        toast.success('Vehicle category deleted successfully!');
      } else {
        toast.error(response.data.message || 'Failed to delete vehicle category.');
      }
    } catch (error) {
      toast.error('Error deleting vehicle category.');
    } finally {
      setShowConfirmDelete(false);
    }
  };
  
  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editMode ? 'update_master1.php' : 'vehicle_master.php';
      const requestData = editMode ? {
        operation: 'updateVehicleCategory',
        id: formData.id,
        name: sanitizedName
      } : {
        operation: 'saveCategoryData',
        json: JSON.stringify({
          vehicle_category_name: sanitizedName
        })
      };

      const response = await axios.post(`${encryptedUrl}${endpoint}`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        toast.success(editMode ? 'Vehicle category updated successfully!' : 'Vehicle category added successfully!');
        fetchCategories();
        closeModal();
      } else {
        toast.error(response.data.message || `Failed to ${editMode ? 'update' : 'add'} vehicle category.`);
      }
    } catch (error) {
      toast.error(`Error ${editMode ? 'updating' : 'adding'} vehicle category.`);
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
    const searchTerm = e.target.value;
    setSearchTerm(searchTerm);
    const results = categories.filter(category =>
      category.vehicle_category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(results);
  };

  const handleAddCategory = () => {
    setFormData({ id: '', name: '' });
    setEditMode(false);
    setShowModal(true);
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Name',
      dataIndex: 'vehicle_category_name',
      key: 'vehicle_category_name',
      sorter: (a, b) => a.vehicle_category_name.localeCompare(b.vehicle_category_name),
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
              onClick={() => handleEdit(record.vehicle_category_id)}
              size="small"
              className="bg-green-500 hover:bg-green-600 border-green-500"
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Button 
              icon={<FaTrash />} 
              onClick={() => handleDelete(record.vehicle_category_id)}
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
        <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Vehicle Categories</h2>
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
                placeholder="Search categories..."
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
                rowKey="vehicle_category_id"
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
                      <FaSearch className="text-6xl text-gray-300 mb-4 mx-auto" />
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
        title={
          <div className="flex items-center">
            <FaCar className="mr-2" /> 
            {editMode ? 'Edit Vehicle Category' : 'Add Vehicle Category'}
          </div>
        }
        open={showModal}
        onCancel={closeModal}
        okText={editMode ? 'Update' : 'Add'}
        onOk={handleSave}
        confirmLoading={isSubmitting}
      >
        <Form layout="vertical">
          <Form.Item
            label="Category Name"
            required
            tooltip="Enter the vehicle category name"
          >
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        title={<div className="text-red-600">Confirm Deletion</div>}
        open={showConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        onOk={confirmDelete}
      >
        <p>Are you sure you want to delete this vehicle category?</p>
        <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
      </Modal>

      <Toaster position="top-right" />
    </div>
  );
};

export default VehicleCategories;
