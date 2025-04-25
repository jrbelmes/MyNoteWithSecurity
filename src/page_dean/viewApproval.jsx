import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser, FiBox, FiInfo, FiClock, FiArchive, FiTool, FiGrid, FiUsers } from 'react-icons/fi';
import { Modal, Descriptions, Badge, Timeline, Card, Tabs, Button, Tag, Space, Divider, Alert, Table, List, Avatar, Tooltip, Empty, Spin } from 'antd';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [requestType, setRequestType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const navigate = useNavigate();
  useEffect(() => {
            const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
            console.log("this is encryptedUserLevel", encryptedUserLevel);
            if (encryptedUserLevel !== '5' && encryptedUserLevel !== '6') {
                localStorage.clear();
                navigate('/gsd');
            }
      }, [navigate]);

  // Fetch the department_id from localStorage on component mount
  useEffect(() => {
    const storedDepartmentId = SecureStorage.getSessionItem("department_id");
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

  const handleApproval = async (reservationId, isAccepted) => {
    if (!selectedRequest) {
      alert('No request selected');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'handleApproval',
        reservation_id: reservationId,
        is_accepted: isAccepted,
        user_id: SecureStorage.getSessionItem("user_id"),
      });

      if (response.data.status === 'success') {
        alert(isAccepted ? 'Request approved successfully' : 'Request declined successfully');
        await fetchApprovalRequests();
        handleCloseDetails();
      } else {
        alert(response.data.message || 'Failed to update approval status');
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Network error occurred while updating approval status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle request type filter change
  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
  };

  // View details of the selected request
  const handleViewDetails = async (request) => {
    const formattedRequest = {
      reservation_id: request.reservation_id,
      requester: request.requester_name,
      department_name: request.department_name,
      reservation_created_at: request.reservation_created_at,
      reservation_start_date: request.reservation_start_date,
      reservation_end_date: request.reservation_end_date,
      title: request.reservation_title,
      description: request.reservation_description,
      venue: request.venues?.[0] ? {
        id: request.venues[0].venue_id,
        name: request.venues[0].venue_name,
        occupancy: request.venues[0].occupancy,
        operating_hours: request.venues[0].operating_hours,
      } : null,
      vehicle: request.vehicles?.[0] ? {
        id: request.vehicles[0].vehicle_id,
        license: request.vehicles[0].license,
        model: request.vehicles[0].model,
        driver_id: request.drivers?.[0]?.driver_id,
        driver_name: request.drivers?.[0]?.name,
        purpose: request.reservation_description,
      } : null,
      equipment: request.equipment ? {
        equipment_ids: request.equipment.map(e => e.equipment_id),
        items: request.equipment
      } : null,
      passengers: request.passengers || []
    };
    
    setSelectedRequest(formattedRequest);
  };

  // Close the details view
  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  useEffect(() => {
    if (departmentId) {
      fetchApprovalRequests();
    }
  }, [departmentId]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.purpose || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesType = requestType === 'all' || 
      (requestType === 'vehicle' && request.vehicle?.id) ||
      (requestType === 'venue' && request.venue?.id);

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.reservation_created_at) - new Date(a.reservation_created_at);
    }
    return new Date(a.reservation_created_at) - new Date(b.reservation_created_at);
  });

  // Unified RequestDetailsModal component that handles all request types
  const RequestDetailsModal = ({ request, visible, onClose, onApprove, onDecline }) => {
    if (!request) return null;
    
    // Format date/time for display
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return 'N/A';
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Calculate reservation duration
    const calculateDuration = () => {
      if (!request.reservation_start_date || !request.reservation_end_date) return "N/A";
      
      const start = new Date(request.reservation_start_date);
      const end = new Date(request.reservation_end_date);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs > 0 ? `${diffHrs}h` : ''} ${diffMins > 0 ? `${diffMins}m` : ''}`.trim() || "0m";
    };
    
    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        width={1000}
        style={{ top: 20 }}
        className="request-details-modal"
        title={null}
        footer={null}
        bodyStyle={{ padding: 0, borderRadius: '8px', overflow: 'hidden' }}
      >
        <div className="flex flex-col md:flex-row h-full" style={{ maxHeight: '80vh' }}>
          {/* Left Panel - Request Information */}
          <div className="w-full md:w-1/3 bg-gradient-to-b from-blue-50 to-blue-100 p-6 flex flex-col" style={{ borderRight: '1px solid #f0f0f0' }}>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">Reservation Details</h3>
              <div className="h-1 w-20 bg-blue-500 mt-2 rounded-full"></div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-3 bg-white p-3 rounded-lg shadow-sm">
                <Avatar size={40} icon={<FiUser />} className="mr-3" style={{ backgroundColor: '#1890ff' }} />
                <div>
                  <div className="font-semibold">{request.requester}</div>
                  <div className="text-xs text-gray-500">{request.department_name}</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Request ID</div>
                    <div className="font-mono text-sm bg-gray-50 py-1 px-2 rounded">{request.reservation_id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Requested On</div>
                    <div className="text-sm">{formatDateTime(request.reservation_created_at)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FiCalendar className="text-blue-500 mr-2" />
                  Schedule Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Start Date & Time</div>
                    <div className="text-sm font-medium">{formatDateTime(request.reservation_start_date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">End Date & Time</div>
                    <div className="text-sm font-medium">{formatDateTime(request.reservation_end_date)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FiInfo className="text-blue-500 mr-2" />
                  Request Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Title</div>
                    <div className="text-sm font-medium">{request.title || 'No title provided'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Description</div>
                    <div className="text-sm bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                      {request.description || 'No description provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Resource Details */}
          <div className="w-full md:w-2/3 bg-white p-0 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reserved Resources</h3>
              <p className="text-sm text-gray-500">Review all resources requested for this reservation</p>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              {/* Venue Section */}
              {request.venue && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: "#52c41a20" }}
                    >
                      <FiMapPin style={{ color: "#52c41a" }} />
                    </div>
                    <span className="text-base font-medium">Venue</span>
                  </div>
                  
                  <Card 
                    className="shadow-sm hover:shadow-md transition-shadow border-0" 
                    style={{ borderLeft: `4px solid #52c41a` }}
                  >
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Venue Name</div>
                      <div className="font-medium">{request.venue.name}</div>
                    </div>
                  </Card>
                </div>
              )}
              
              {/* Vehicle Section */}
              {request.vehicle && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: "#52c41a20" }}
                    >
                      <FiBox style={{ color: "#52c41a" }} />
                    </div>
                    <span className="text-base font-medium">Vehicle</span>
                  </div>
                  
                  <Card 
                    className="shadow-sm hover:shadow-md transition-shadow border-0" 
                    style={{ borderLeft: `4px solid #52c41a` }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">License Plate</div>
                        <div className="font-medium">{request.vehicle.license}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Model</div>
                        <div>{request.vehicle.model}</div>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Passengers List */}
                  {request.passengers && request.passengers.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mb-2 flex items-center">
                        <FiUsers className="mr-2 text-gray-400" />
                        Passengers ({request.passengers.length})
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {request.passengers.map(passenger => (
                            <Tag key={passenger.passenger_id} className="flex items-center px-3 py-1">
                              <Avatar size={20} icon={<FiUser />} className="mr-2" />
                              {passenger.name}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Equipment Section */}
              {request.equipment && request.equipment.items && request.equipment.items.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: "#52c41a20" }}
                    >
                      <FiTool style={{ color: "#52c41a" }} />
                    </div>
                    <span className="text-base font-medium">Equipment</span>
                  </div>
                  
                  <Card 
                    className="shadow-sm hover:shadow-md transition-shadow border-0" 
                    style={{ borderLeft: `4px solid #52c41a` }}
                  >
                    <Table
                      dataSource={request.equipment.items}
                      rowKey="equipment_id"
                      pagination={false}
                      size="small"
                      className="equipment-table"
                      columns={[
                        {
                          title: 'Equipment',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: 'Quantity',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          width: 100,
                          align: 'center',
                          render: qty => <Tag>{qty}</Tag>
                        }
                      ]}
                    />
                  </Card>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <Alert
                  message="Ready for Review"
                  description="Please review the details of this reservation request and take appropriate action."
                  type="info"
                  showIcon
                  className="mb-0 mr-4 flex-1"
                  style={{ maxWidth: '65%' }}
                />
                
                <div className="flex gap-3">
                  <Button 
                    danger 
                    icon={<FiX />} 
                    size="large"
                    onClick={() => onDecline(request.reservation_id)}
                  >
                    Decline
                  </Button>
                  <Button 
                    type="primary" 
                    className="bg-green-600" 
                    icon={<FiCheck />} 
                    size="large"
                    onClick={() => onApprove(request.reservation_id)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DeanSidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <header className="bg-white shadow-sm px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">Approval Requests</h1>
              <p className="mt-1 text-sm text-gray-500">Manage and review reservation requests for your department</p>
            </div>
          </header>

          {/* Filters Section */}
          <div className="bg-white border-b px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by requester, title, purpose..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <select
                  value={requestType}
                  onChange={handleRequestTypeChange}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="venue">Venue</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="equipment">Equipment</option>
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

                <Tooltip title="Refresh data">
                  <button
                    onClick={fetchApprovalRequests}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Spin size="large" />
                  </div>
                ) : sortedRequests.length === 0 ? (
                  <Empty 
                    description="No requests found matching your criteria" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="my-16"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {sortedRequests.map((request) => (
                      <motion.div
                        key={request.reservation_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100"
                      >
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.reservation_title || 'Unnamed Request'}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {request.reservation_description || 'No description provided'}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <FiUser className="mr-2" />
                                  {request.requester}
                                </span>
                                <span className="flex items-center">
                                  <FiCalendar className="mr-2" />
                                  {new Date(request.reservation_created_at).toLocaleDateString()}
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
                                request.vehicle ? 
                                'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {request.vehicle ? 'Vehicle' : 'Venue'}
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

      {/* Universal Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            visible={!!selectedRequest}
            onClose={handleCloseDetails}
            onApprove={() => handleApproval(selectedRequest.reservation_id, true)}
            onDecline={() => handleApproval(selectedRequest.reservation_id, false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewApproval;