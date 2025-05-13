import React, { useEffect, useState, useMemo } from 'react';
import { Button, Modal, Form, Input, Table, Space, Tooltip } from 'antd';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrashAlt, faCar, faPlus, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaArrowLeft} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const VehicleMakes = () => {
  const navigate = useNavigate();
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    fetchMakes();
  }, [encryptedUrl]);

  const fetchMakes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${encryptedUrl}fetchMaster.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'fetchMake' }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMakes(data.data);
      } else {
        console.error(data.message);
        toast.error("Failed to fetch vehicle makes");
      }
    } catch (error) {
      console.error('Error fetching vehicle makes:', error);
      toast.error("An error occurred while fetching vehicle makes");
    } finally {
      setLoading(false);
    }
  };

  const filteredMakes = useMemo(() => {
    return makes.filter(make => 
      make.vehicle_make_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [makes, searchTerm]);

  const handleEdit = (id) => {
    const makeToEdit = makes.find((make) => make.vehicle_make_id === id);
    if (makeToEdit) {
      setFormData({ id: makeToEdit.vehicle_make_id, name: makeToEdit.vehicle_make_name });
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedMakeId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${encryptedUrl}delete_master.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operation: 'deleteVehicleMake', 
          vehicleMakeId: selectedMakeId 
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMakes(makes.filter(make => make.vehicle_make_id !== selectedMakeId));
        toast.success('Vehicle make deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete vehicle make.');
      }
    } catch (error) {
      console.error('Error deleting vehicle make:', error);
      toast.error('Error deleting vehicle make.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleAdd = () => {
    setFormData({ id: '', name: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim()) {
      toast.error("Please enter a make name.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editMode ? 'update_master1.php' : 'vehicle_master.php';
      const operation = editMode ? 'updateVehicleMake' : 'saveMakeData';
      
      const requestBody = editMode 
        ? { operation, id: formData.id, name: sanitizedName }
        : { operation, json: { vehicle_make_name: sanitizedName } };

      const response = await fetch(`${encryptedUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.status === 'success') {
        if (editMode) {
          setMakes(makes.map(make => make.vehicle_make_id === formData.id ? { ...make, vehicle_make_name: formData.name } : make));
        } else {
          if (data.data) {
            const newMake = {
              vehicle_make_id: data.data.vehicle_make_id,
              vehicle_make_name: sanitizedName
            };
            setMakes(prevMakes => [...prevMakes, newMake]);
          }
        }
        toast.success(editMode ? 'Vehicle make updated successfully!' : 'Vehicle make added successfully!');
        fetchMakes(); // Refresh the list
      } else {
        toast.error(data.message || `Failed to ${editMode ? 'update' : 'add'} vehicle make.`);
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'adding'} vehicle make:`, error);
      toast.error(`Error ${editMode ? 'updating' : 'adding'} vehicle make.`);
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '' });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Make Name',
      dataIndex: 'vehicle_make_name',
      key: 'vehicle_make_name',
      sorter: (a, b) => a.vehicle_make_name.localeCompare(b.vehicle_make_name),
      render: (text) => <span className="font-semibold text-green-800">{text}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Make">
            <Button 
              type="primary" 
              icon={<FontAwesomeIcon icon={faEdit} />} 
              onClick={() => handleEdit(record.vehicle_make_id)}
              size="small"
              className="bg-green-500 hover:bg-green-600 border-green-500"
            />
          </Tooltip>
          <Tooltip title="Delete Make">
            <Button 
              icon={<FontAwesomeIcon icon={faTrashAlt} />} 
              onClick={() => handleDelete(record.vehicle_make_id)}
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
        
        <h2 className="text-4xl font-bold text-green-800 drop-shadow-lg mb-6">Vehicle Makes</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-full md:w-64 mb-4 md:mb-0"
            >
              <Input
                prefix={<FontAwesomeIcon icon={faSearch} className="text-green-400" />}
                placeholder="Search makes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              />
            </motion.div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Make
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
                dataSource={filteredMakes}
                rowKey="vehicle_make_id"
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
                className="vehicle-make-table"
                style={{ backgroundColor: 'white' }}
                locale={{
                  emptyText: (
                    <div className="text-center py-8">
                      <i className="pi pi-search text-6xl text-gray-300 mb-4"></i>
                      <p className="text-xl text-gray-500">No vehicle makes found</p>
                    </div>
                  )
                }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Vehicle Make Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCar} className="mr-2 text-green-600" /> 
            {editMode ? 'Edit Vehicle Make' : 'Add Vehicle Make'}
          </div>
        }
        open={showModal}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSave} 
            loading={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item 
            label="Name" 
            required
            tooltip="Enter the vehicle make name"
          >
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter make name"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        title={
          <div className="text-red-600 font-bold flex items-center">
            <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> 
            Confirm Deletion
          </div>
        }
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
        <p>Are you sure you want to delete this vehicle make?</p>
        <p className="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
      </Modal>

      <Toaster position="top-right" />
    </div>
  );
};

export default VehicleMakes;
