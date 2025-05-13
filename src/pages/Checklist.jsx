import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Card, Space, Typography, Modal, Select, Input, List, message, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEye } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../vehicle.css';

function Checklist() {
  const [currentTab, setCurrentTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [resourceType, setResourceType] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [venueData, setVenueData] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewChecklistItems, setViewChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ operation: 'fetchChecklist' })
        });
        const result = await response.json();
        if (result.status === 'success') {
          // Transform data for venues
          const venueList = Object.values(result.data.venues || {}).map(item => ({
            key: `v${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setVenueData(venueList);

          // Transform data for equipment
          const equipmentList = Object.values(result.data.equipment || {}).map(item => ({
            key: `e${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setEquipmentData(equipmentList);

          // Transform data for vehicles
          const vehicleList = Object.values(result.data.vehicles || {}).map(item => ({
            key: `vh${item.id}`,
            id: item.id,
            name: item.name,
            checklistCount: item.count
          }));
          setVehicleData(vehicleList);
        }
      } catch (error) {
        console.error('Error fetching checklists:', error);
        message.error('Failed to fetch checklists');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, []);

  const fetchChecklistById = async (type, id) => {
    try {
      console.log('Sending request with:', { type, id });
      
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fetchChecklistById',
          type,
          id
        })
      });
      
      const result = await response.json();
      console.log('Response received:', result);

      if (result.status === 'success') {
        console.log('Checklist items:', result.data);
        setViewChecklistItems(result.data);
        setIsViewModalVisible(true);
      } else {
        console.error('Error response:', result);
        message.error('Failed to fetch checklist items');
      }
    } catch (error) {
      console.error('Error details:', error);
      message.error('Failed to fetch checklist items');
    }
  };
  const handleEditChecklist = async (item) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'updateChecklist',
          data: {
            checklist_updates: [{
              type: currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle',
              id: item.checklist_id,
              checklist_name: newItem
            }]
          }
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success('Checklist item updated successfully');
        setNewItem('');
        setIsEditMode(false);
        setCurrentEditItem(null);
        // Refresh the checklist view
        const type = currentTab === '1' ? 'venue' : currentTab === '2' ? 'equipment' : 'vehicle';
        await fetchChecklistById(type, item.resource_id);
      } else {
        message.error(result.message || 'Failed to update checklist item');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      message.error('Failed to update checklist item. Please try again.');
    }
  };

  const startEdit = (item) => {
    setIsEditMode(true);
    setCurrentEditItem(item);
    setNewItem(item.checklist_name);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setCurrentEditItem(null);
    setNewItem('');
  };

  const columns = [
    {
      title: 'Name of Resource',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-semibold text-green-800">{text}</span>
    },
    {
      title: 'No. Checklist',
      dataIndex: 'checklistCount',
      key: 'checklistCount',
      sorter: (a, b) => a.checklistCount - b.checklistCount,
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'volcano'} className="px-2 py-1">
          {count}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Checklist">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => fetchChecklistById(
                currentTab === '1' ? 'venue' : 
                currentTab === '2' ? 'equipment' : 
                'vehicle',
                record.id
              )}
              size="small"
              className="bg-green-500 hover:bg-green-600 border-green-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const fetchResources = async (type) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ operation: 'fetchAllResources', type })
      });
      const result = await response.json();
      if (result.status === 'success') {
        switch (type) {
          case 'venue':
            setResources(result.data.venues.map(v => ({ 
              value: v.ven_id,
              label: v.ven_name 
            })));
            break;
          case 'vehicle':
            setResources(result.data.vehicles.map(v => ({ 
              value: v.vehicle_id, 
              label: `${v.vehicle_model_title} (${v.vehicle_registration})` 
            })));
            break;
          case 'equipment':
            setResources(result.data.equipment.map(e => ({ 
              value: e.equip_id, 
              label: e.equip_name 
            })));
            break;
          default:
            setResources([]);
            console.warn(`Unknown resource type: ${type}`);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleTypeChange = (value) => {
    setResourceType(value);
    setSelectedResource(null);
    fetchResources(value);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setChecklistItems([...checklistItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleSaveChecklist = async () => {
    if (!resourceType || !selectedResource || checklistItems.length === 0) {
      message.error('Please fill in all required fields and add at least one checklist item');
      return;
    }

    // Validate resource type
    if (!['venue', 'equipment', 'vehicle'].includes(resourceType)) {
      message.error('Invalid resource type');
      return;
    }

    try {
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'saveMasterChecklist',
          checklistNames: checklistItems,
          type: resourceType,
          id: selectedResource
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success(result.message || 'Checklist saved successfully');
        setIsModalVisible(false);
        setChecklistItems([]);
        setResourceType(null);
        setSelectedResource(null);
        setNewItem('');
        
        // Refresh the data after saving
        const updatedType = resourceType === 'venue' ? 'venue' :
                          resourceType === 'equipment' ? 'equipment' :
                          'vehicle';
        await fetchResources(updatedType);
        window.location.reload(); // Refresh to show updated counts
      } else {
        message.error(result.message || 'Failed to save checklist');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      message.error('Failed to save checklist. Please try again.');
    }
  };

  const filteredVenueData = venueData.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredEquipmentData = equipmentData.filter(equipment => 
    equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredVehicleData = vehicleData.filter(vehicle => 
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTabContent = (data) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100"
    >
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="relative w-full md:w-64 mb-4 md:mb-0"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
          />
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalVisible(true)}
          className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Checklist
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
            dataSource={data}
            rowKey="key"
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
            className="checklist-table"
            style={{ backgroundColor: 'white' }}
            locale={{
              emptyText: (
                <div className="text-center py-8">
                  <PlusOutlined className="text-5xl text-gray-300 mb-4" />
                  <p className="text-xl text-gray-500">No checklists found</p>
                </div>
              )
            }}
          />
        </div>
      )}

      <Modal
        title="Add Checklist"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSaveChecklist}
        okButtonProps={{
          disabled: !resourceType || !selectedResource || checklistItems.length === 0,
          className: 'bg-green-500'
        }}
        okText="Save Checklist"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Select
            style={{ width: '100%' }}
            placeholder="Select Type"
            onChange={handleTypeChange}
            className="rounded-md"
            options={[
              { value: 'venue', label: 'Venue' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'vehicle', label: 'Vehicle' }
            ]}
          />
          
          <Select
            style={{ width: '100%' }}
            placeholder="Select Resource"
            value={selectedResource}
            onChange={setSelectedResource}
            options={resources}
            disabled={!resourceType}
            className="rounded-md"
          />
          
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add checklist item"
              onPressEnter={handleAddItem}
              className="rounded-l-md"
            />
            <Button type="primary" onClick={handleAddItem} className="bg-green-500 hover:bg-green-600">Add</Button>
          </Space.Compact>
          
          <List
            bordered
            className="rounded-md max-h-60 overflow-y-auto"
            dataSource={checklistItems}
            renderItem={(item, index) => (
              <List.Item className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-3 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
                <Button 
                  type="text" 
                  danger 
                  size="small" 
                  onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </List.Item>
            )}
            locale={{ emptyText: 'No items added yet' }}
          />
        </Space>
      </Modal>

      <Modal
        title={
          <div className="flex items-center text-green-700">
            <FontAwesomeIcon icon={faEye} className="mr-2" />
            <span>View Checklist</span>
          </div>
        }
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)} className="bg-green-500 text-white hover:bg-green-600">
            Close
          </Button>
        ]}
      >
        <List
          bordered
          className="mt-4 rounded-md bg-green-50"
          dataSource={viewChecklistItems}
          renderItem={(item, index) => (
            <List.Item className="border-b border-green-100 py-3">
              <div className="flex items-center">
                <span className="bg-green-500 text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-3 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-green-800">{item.checklist_name}</span>
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={() => startEdit(item)} 
                  className="text-green-500 hover:text-green-600 ml-auto"
                />
              </div>
            </List.Item>
          )}
          locale={{
            emptyText: (
              <div className="text-center py-6">
                <p className="text-gray-500">No checklist items found</p>
              </div>
            )
          }}
        />
        {isEditMode && (
          <div className="mt-4">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Edit checklist item"
              className="rounded-md mb-2"
            />
            <Space>
              <Button type="primary" onClick={() => handleEditChecklist(currentEditItem)} className="bg-green-500 hover:bg-green-600">
                Save
              </Button>
              <Button onClick={cancelEdit} className="bg-gray-300 hover:bg-gray-400">
                Cancel
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </motion.div>
  );

  const items = [
    {
      key: '1',
      label: <span className="text-lg font-medium">Venue</span>,
      children: renderTabContent(filteredVenueData),
    },
    {
      key: '2',
      label: <span className="text-lg font-medium">Equipment</span>,
      children: renderTabContent(filteredEquipmentData),
    },
    {
      key: '3',
      label: <span className="text-lg font-medium">Vehicle</span>,
      children: renderTabContent(filteredVehicleData),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row bg-gradient-to-br from-white to-green-100 min-h-screen">
      <Sidebar />
      <div className="flex-grow p-8 lg:p-12 mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Checklist Management</h2>
          <Tabs
            activeKey={currentTab}
            onChange={setCurrentTab}
            items={items}
            type="card"
            className="checklist-tabs"
            size="large"
            tabBarStyle={{ marginBottom: '1rem', fontWeight: 'bold' }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default Checklist;
