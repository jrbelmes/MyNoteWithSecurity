import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import { Modal, Descriptions, Badge, Timeline, Card, Tabs, Button, Tag, Space, Divider } from 'antd';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null); // Will be fetched from localStorage
  const [requestType, setRequestType] = useState('vehicle'); // Default type
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch the department_id from localStorage on component mount
  useEffect(() => {
    const storedDepartmentId = localStorage.getItem("department_id");
    if (storedDepartmentId) {
      setDepartmentId(storedDepartmentId);
    } else {
      console.error("No department ID found in localStorage.");
    }
  }, []);

  // Fetch the approval requests when the component mounts or when filters change
  const fetchApprovalRequests = async () => {
    if (!departmentId) {
      console.error("Department ID is not available");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'fetchApprovalByDept',
        department_id: departmentId,
      });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve or Disapprove a request
  const handleApproval = async (approvalId, status) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'approveRequest',
        approval_id: approvalId,
        status: status,
      });

      if (response.data.status === 'success') {
        alert(response.data.message);
        // Refresh the list after successful approval
        fetchApprovalRequests();
        // Close the details modal
        handleCloseDetails();
      } else {
        alert('Failed to update approval status');
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Error occurred while updating approval status');
    }
  };

  // Handle request type filter change
  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
  };

  // View details of the selected request
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  // Close the details view
  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  // Decline the selected request
  const handleDecline = async (approvalId) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'declineRequest',
        approval_id: approvalId,
      });

      if (response.data.status === 'success') {
        alert(response.data.message);
        // Refresh the list after successful decline
        fetchApprovalRequests();
        // Close the details modal
        handleCloseDetails();
      } else {
        alert('Failed to decline the request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Error occurred while declining the request');
    }
  };

  useEffect(() => {
    if (departmentId) {
      fetchApprovalRequests();
    }
  }, [departmentId]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.vehicle?.form_name || request.venue?.form_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.vehicle?.purpose || request.venue?.event_title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesType = requestType === 'all' || 
      (requestType === 'vehicle' && request.vehicle?.license) ||
      (requestType === 'venue' && request.venue?.name);

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.approval_created_at) - new Date(a.approval_created_at);
    }
    return new Date(a.approval_created_at) - new Date(b.approval_created_at);
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <DeanSidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <header className="bg-white shadow-sm px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">Approval Requests Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage and process department requests</p>
            </div>
          </header>

          {/* Filters Section */}
          <div className="bg-white border-b px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={requestType}
                  onChange={handleRequestTypeChange}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="venue">Venue</option>
                  <option value="vehicle">Vehicle</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <button
                  onClick={fetchApprovalRequests}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : sortedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No requests found matching your criteria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {sortedRequests.map((request) => (
                      <motion.div
                        key={request.approval_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Enhanced Request Card Layout */}
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.vehicle?.form_name || request.venue?.form_name || 'Unnamed Request'}
                              </h3>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <FiCalendar className="mr-2" />
                                  {new Date(request.approval_created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <FiMapPin className="mr-2" />
                                  {request.vehicle?.destination || request.venue?.name || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                  <FiUser className="mr-2" />
                                  {request.vehicle?.requester || request.venue?.requester || 'Unknown'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                request.vehicle?.license ? 
                                'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {request.vehicle?.license ? 'Vehicle' : 'Venue'}
                              </span>
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                <FiEye className="mr-2" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <Modal
            visible={!!selectedRequest}
            onCancel={handleCloseDetails}
            width={1000}
            footer={[
              <Button key="approve" type="primary" className="bg-green-600" onClick={() => handleApproval(selectedRequest.approval_id, 'approved')}>
                Approve
              </Button>,
              <Button key="decline" danger onClick={() => handleDecline(selectedRequest.approval_id)}>
                Decline
              </Button>,
              <Button key="close" onClick={handleCloseDetails}>
                Close
              </Button>,
            ]}
            title={
              <div className="flex justify-between items-center">
                <span className="text-xl">Request Details</span>
                <Tag color={selectedRequest.vehicle?.license ? 'blue' : 'green'}>
                  {selectedRequest.vehicle?.license ? 'Vehicle Request' : 'Venue Request'}
                </Tag>
              </div>
            }
          >
            <Tabs defaultActiveKey="1">
              {selectedRequest.vehicle?.license ? (
                <>
                  <Tabs.TabPane tab="Basic Information" key="1">
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Form Name" span={2}>
                        {selectedRequest.vehicle.form_name}
                      </Descriptions.Item>
                      <Descriptions.Item label="License">{selectedRequest.vehicle.license}</Descriptions.Item>
                      <Descriptions.Item label="Model">{selectedRequest.vehicle.model}</Descriptions.Item>
                      <Descriptions.Item label="Make">{selectedRequest.vehicle.make}</Descriptions.Item>
                      <Descriptions.Item label="Category">{selectedRequest.vehicle.category}</Descriptions.Item>
                      <Descriptions.Item label="Purpose" span={2}>
                        {selectedRequest.vehicle.purpose}
                      </Descriptions.Item>
                      <Descriptions.Item label="Destination" span={2}>
                        {selectedRequest.vehicle.destination}
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>
                  
                  <Tabs.TabPane tab="Schedule & Drivers" key="2">
                    <Card title="Schedule Information">
                      <Timeline>
                        <Timeline.Item color="green">
                          Start: {new Date(selectedRequest.vehicle.start_date).toLocaleString()}
                        </Timeline.Item>
                        <Timeline.Item color="red">
                          End: {new Date(selectedRequest.vehicle.end_date).toLocaleString()}
                        </Timeline.Item>
                      </Timeline>
                    </Card>
                    
                    <Divider />
                    
                    <Card title="Driver">
                      {selectedRequest.vehicle.driver_names?.map((driver, index) => (
                        <Tag key={index} color="blue" className="mb-2 mr-2">
                          {driver}
                        </Tag>
                      ))}
                    </Card>
                  </Tabs.TabPane>
                  
                  <Tabs.TabPane tab="Passengers" key="3">
                    <Card>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedRequest.passengers?.map((passenger) => (
                          <Card key={passenger.passenger_id} size="small" className="bg-gray-50">
                            <p>{passenger.passenger_name}</p>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  </Tabs.TabPane>
                </>
              ) : (
                <>
                  <Tabs.TabPane tab="Event Details" key="1">
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Event Title" span={2}>
                        {selectedRequest.venue.event_title}
                      </Descriptions.Item>
                      <Descriptions.Item label="Venue Name">{selectedRequest.venue.name}</Descriptions.Item>
                      <Descriptions.Item label="Participants">{selectedRequest.venue.participants}</Descriptions.Item>
                      <Descriptions.Item label="Description" span={2}>
                        {selectedRequest.venue.description}
                      </Descriptions.Item>
                      <Descriptions.Item label="Requester" span={2}>
                        {selectedRequest.venue.requester}
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>
                  
                  <Tabs.TabPane tab="Schedule" key="2">
                    <Card>
                      <Timeline>
                        <Timeline.Item color="green">
                          Start: {new Date(selectedRequest.venue.start_date).toLocaleString()}
                        </Timeline.Item>
                        <Timeline.Item color="red">
                          End: {new Date(selectedRequest.venue.end_date).toLocaleString()}
                        </Timeline.Item>
                      </Timeline>
                    </Card>
                  </Tabs.TabPane>
                  
                  {selectedRequest.equipment && (
                    <Tabs.TabPane tab="Equipment" key="3">
                      <Card>
                        <Descriptions bordered>
                          <Descriptions.Item label="Equipment Name">
                            {selectedRequest.equipment.name}
                          </Descriptions.Item>
                          <Descriptions.Item label="Quantity">
                            {selectedRequest.equipment.quantity}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Tabs.TabPane>
                  )}
                </>
              )}
              
              <Tabs.TabPane tab="Status History" key="4">
                <Timeline>
                  <Timeline.Item color="blue">
                    Request Created: {new Date(selectedRequest.approval_created_at).toLocaleString()}
                  </Timeline.Item>
                  {selectedRequest.status_history?.map((status, index) => (
                    <Timeline.Item 
                      key={index}
                      color={status.status === 'approved' ? 'green' : status.status === 'declined' ? 'red' : 'gray'}
                    >
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}: {new Date(status.timestamp).toLocaleString()}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Tabs.TabPane>
            </Tabs>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewApproval;
