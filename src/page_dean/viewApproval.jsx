import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold">
                    Form Name: {selectedRequest.vehicle.form_name || selectedRequest.venue.form_name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted: {new Date(selectedRequest.approval_created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedRequest.vehicle.license ? 
                  'bg-blue-100 text-blue-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedRequest.vehicle.license ? 'Vehicle Request' : 'Venue Request'}
                </span>
              </div>

              {/* Content based on request type */}
              {selectedRequest.vehicle.license ? (
                // Vehicle Request Details
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Vehicle Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Vehicle Information</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">License:</span> {selectedRequest.vehicle.license}</p>
                        <p><span className="font-medium">Model:</span> {selectedRequest.vehicle.model}</p>
                        <p><span className="font-medium">Make:</span> {selectedRequest.vehicle.make}</p>
                        <p><span className="font-medium">Category:</span> {selectedRequest.vehicle.category}</p>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Trip Details</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Purpose:</span> {selectedRequest.vehicle.purpose}</p>
                        <p><span className="font-medium">Destination:</span> {selectedRequest.vehicle.destination}</p>
                        <p><span className="font-medium">Requestor:</span> {selectedRequest.vehicle.requester}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800">Driver Information</h4>
                    <div className="space-y-2">
                      {selectedRequest.vehicle.driver_names && selectedRequest.vehicle.driver_names.map((driver, index) => (
                        <p key={index}><span className="font-medium">Driver:</span> {driver}</p>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800">Schedule</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Start Date & Time:</p>
                        <p>{new Date(selectedRequest.vehicle.start_date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">End Date & Time:</p>
                        <p>{new Date(selectedRequest.vehicle.end_date).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Passengers List */}
                  {selectedRequest.passengers && selectedRequest.passengers.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Passengers</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRequest.passengers.map((passenger) => (
                          <div key={passenger.passenger_id} className="p-2 bg-white rounded border">
                            {passenger.passenger_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Venue Request Details
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Venue Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Venue Information</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Venue Name:</span> {selectedRequest.venue.name}</p>
                        <p><span className="font-medium">Event Title:</span> {selectedRequest.venue.event_title}</p>
                        <p><span className="font-medium">Description:</span> {selectedRequest.venue.description}</p>
                        <p><span className="font-medium">Participants:</span> {selectedRequest.venue.participants}</p>
                        <p><span className="font-medium">Requester:</span> {selectedRequest.venue.requester}</p>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Schedule</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Start Date:</span> {selectedRequest.venue.start_date}</p>
                        <p><span className="font-medium">End Date:</span> {selectedRequest.venue.end_date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  {selectedRequest.equipment && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Equipment</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedRequest.equipment.name}</p>
                        <p><span className="font-medium">Quantity:</span> {selectedRequest.equipment.quantity}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                <button
                  onClick={() => handleApproval(selectedRequest.approval_id, 'approved')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-150"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecline(selectedRequest.approval_id)}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition duration-150"
                >
                  Decline
                </button>
                <button
                  onClick={handleCloseDetails}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition duration-150"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewApproval;
