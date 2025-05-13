import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Tooltip, Space, Input, Tag } from 'antd';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const VehicleModels = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [makes, setMakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', makeId: '', categoryId: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setEditingModel] = useState(null);
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
    fetchModels();
    fetchMakes();
    fetchCategories();
  }, []);

  const fetchMakes = async () => {
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
        'operation=fetchMake',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const data = response.data;
      if (data.status === 'success') {
        setMakes(data.data);
      } else {
        toast.error(`Error fetching makes: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching makes:', error);
      toast.error('Error fetching makes.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
        'operation=fetchVehicleCategories',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const data = response.data;
      if (data.status === 'success') {
        setCategories(data.data);
      } else {
        toast.error(`Error fetching categories: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error fetching categories.');
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`, 
        new URLSearchParams({ operation: 'fetchModels' })
      );
      if (response.data.status === 'success') {
        setModels(response.data.data);
        setFilteredModels(response.data.data);
      } else {
        toast.error(`Error fetching models: ${response.data.message}`);
      }
    } catch (error) {
      toast.error('Error fetching vehicle models.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleModelById = async (id) => {
    try {
      const response = await axios.post(`${encryptedUrl}fetchMaster.php`,
        `operation=fetchModelById&id=${id}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('API Response:', response.data); // Log the entire response

      if (response.data.status === 'success' && response.data.data.length > 0) {
        const modelData = response.data.data[0];
        console.log('Fetched Model Data:', modelData); // Log the fetched model data
        
        setFormData({
          id: modelData.vehicle_model_id,
          name: modelData.vehicle_model_name,
          makeId: makes.find(make => make.vehicle_make_name === modelData.vehicle_make_name)?.vehicle_make_id || '',
          categoryId: categories.find(category => category.vehicle_category_name === modelData.vehicle_category_name)?.vehicle_category_id || ''
        });
        
        console.log('Form Data after setting:', formData); // Log the form data
        
        setEditMode(true);
        setShowModal(true);
      } else {
        toast.error('Failed to fetch vehicle model details.');
      }
    } catch (error) {
      console.error('Error fetching vehicle model details:', error);
      toast.error('Error fetching vehicle model details.');
    }
  };

  const handleEdit = (id) => {
    fetchVehicleModelById(id);
  };

  const handleDelete = (id) => {
    setSelectedModelId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.post(`${encryptedUrl}delete_master.php`, 
        {
          operation: 'deleteModel',
          modelId: selectedModelId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.status === 'success') {
        setModels(models.filter(model => model.vehicle_model_id !== selectedModelId));
        setFilteredModels(filteredModels.filter(model => model.vehicle_model_id !== selectedModelId));
        toast.success('Vehicle model deleted successfully!');
      } else {
        toast.error(response.data.message || 'Failed to delete vehicle model.');
      }
    } catch (error) {
      toast.error('Error deleting vehicle model.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim() || !formData.makeId || !formData.categoryId) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      let response;
      if (editMode) {
        const requestData = {
          operation: 'updateVehicleModel',
          modelData: {
            id: formData.id,
            name: sanitizedName,
            make_id: parseInt(formData.makeId),
            category_id: parseInt(formData.categoryId)
          }
        };
        response = await axios.post(`${encryptedUrl}update_master1.php`, 
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        const requestData = {
          operation: 'saveModelData',
          json: JSON.stringify({
            name: sanitizedName,
            category_id: parseInt(formData.categoryId),
            make_id: parseInt(formData.makeId)
          })
        };
        response = await axios.post(`${encryptedUrl}vehicle_master.php`, 
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        fetchModels();
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to update vehicle model.');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
    setEditingModel(null);
  };

  const handleSearchChange = (e) => {
    const searchTerm = sanitizeInput(e.target.value.toLowerCase());
    setSearchTerm(searchTerm);
    const results = models.filter(model =>
      model.vehicle_model_name.toLowerCase().includes(searchTerm) ||
      model.vehicle_make_name.toLowerCase().includes(searchTerm) ||
      model.vehicle_category_name.toLowerCase().includes(searchTerm)
    );
    setFilteredModels(results);
  };

  const handleAddModel = () => {
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
    setEditMode(false);
    setShowModal(true);
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Model Name',
      dataIndex: 'vehicle_model_name',
      key: 'vehicle_model_name',
      sorter: (a, b) => a.vehicle_model_name.localeCompare(b.vehicle_model_name),
      render: (text) => <span className="font-semibold text-green-800">{text}</span>
    },
    {
      title: 'Make Name',
      dataIndex: 'vehicle_make_name',
      key: 'vehicle_make_name',
      sorter: (a, b) => a.vehicle_make_name.localeCompare(b.vehicle_make_name),
    },
    {
      title: 'Category',
      dataIndex: 'vehicle_category_name',
      key: 'vehicle_category_name',
      sorter: (a, b) => a.vehicle_category_name.localeCompare(b.vehicle_category_name),
      render: (text) => (
        <Tag
          className="px-2 py-1 text-xs font-semibold"
          color="blue"
        >
          {text}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Model">
            <Button 
              type="primary" 
              icon={<FontAwesomeIcon icon={faEdit} />} 
              onClick={() => handleEdit(record.vehicle_model_id)}
              size="small"
              className="bg-green-500 hover:bg-green-600 border-green-500"
            />
          </Tooltip>
          <Tooltip title="Delete Model">
            <Button 
              icon={<FontAwesomeIcon icon={faTrashAlt} />} 
              onClick={() => handleDelete(record.vehicle_model_id)}
              size="small"
              className="text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-100">
      <div className="flex-none">
        <Sidebar />
      </div>
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
        <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-sm">Vehicle Models</h2>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-full md:w-64 mb-4 md:mb-0"
            >
              <Input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search models..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                prefix={<FontAwesomeIcon icon={faSearch} className="text-green-400" />}
              />
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddModel}
              className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Model
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
                dataSource={filteredModels}
                rowKey="vehicle_model_id"
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  onChange: (page, pageSize) => {
                    setPageSize(pageSize);
                  }
                }}
                scroll={{ x: 1000 }}
                bordered
                size="middle"
                className="model-table"
                style={{ backgroundColor: 'white' }}
                locale={{
                  emptyText: (
                    <div className="text-center py-8">
                      <i className="pi pi-search text-6xl text-gray-300 mb-4"></i>
                      <p className="text-xl text-gray-500">No models found</p>
                    </div>
                  )
                }}
              />
            </div>
          )}
        </div>

        <Modal
          title={editMode ? 'Edit Vehicle Model' : 'Add New Vehicle Model'}
          open={showModal}
          onCancel={closeModal}
          okText={editMode ? 'Update' : 'Add'}
          onOk={handleSave}
          confirmLoading={isSubmitting}
        >
          <Form layout="vertical">
            <Form.Item label="Model Name">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter model name"
              />
            </Form.Item>
            <Form.Item label="Select Make">
              <select 
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500" 
                value={formData.makeId} 
                onChange={(e) => setFormData({ ...formData, makeId: e.target.value })}
              >
                <option value="">Select a make...</option>
                {makes.map((make) => (
                  <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                    {make.vehicle_make_name}
                  </option>
                ))}
              </select>
            </Form.Item>
            <Form.Item label="Select Category">
              <select 
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500" 
                value={formData.categoryId} 
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category.vehicle_category_id} value={category.vehicle_category_id}>
                    {category.vehicle_category_name}
                  </option>
                ))}
              </select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Confirm Deletion"
          open={showConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
          onOk={confirmDelete}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <p>Are you sure you want to delete this vehicle model?</p>
        </Modal>

        <Toaster />
      </motion.div>
    </div>
  );
};

export default VehicleModels;
