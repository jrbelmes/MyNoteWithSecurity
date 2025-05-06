import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser, FiBox, FiInfo, FiClock, FiArchive, FiTool, FiGrid, FiUsers } from 'react-icons/fi';
import { Descriptions, Badge, Timeline, Card, Tabs, Button, Tag, Space, Divider, Alert, Table, List, Avatar, Tooltip, Empty, Spin, Input } from 'antd';
import { Box, Typography, RadioGroup, FormControlLabel, Radio as MuiRadio, TextField, Modal as MuiModal, Button as MuiButton, Paper, AlertTitle } from '@mui/material';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [requestType, setRequestType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const declineReasons = [
    'Schedule conflict with existing reservation',
    'Resource not available for the requested time',
    'Insufficient information provided',
    'Other'
  ];

  const navigate = useNavigate();
  useEffect(() => {
            const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
            console.log("this is encryptedUserLevel", encryptedUserLevel);
            if (encryptedUserLevel !== '5' && encryptedUserLevel !== '6' && encryptedUserLevel !== '18') {
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

      let notification_message = '';
      
      if (isAccepted) {
        notification_message = 'Your reservation has been processed to GSD, waiting for the approval';
      } else {
        notification_message = `Your Reservation Has Been Declined. Reason: ${declineReason === 'Other' ? customReason : declineReason}`;
      }

      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'handleApproval',
        reservation_id: reservationId,
        is_accepted: isAccepted,
        user_id: SecureStorage.getSessionItem("user_id"),
        notification_message: notification_message,
        notification_user_id: selectedRequest.user_id // Adding the notification_user_id parameter
      });

      if (response.data.status === 'success') {
        alert(isAccepted ? 'Request approved successfully' : 'Request declined successfully');
        setSelectedRequest(null);
        setDeclineModalVisible(false);
        setDeclineReason('');
        setCustomReason('');
        await fetchApprovalRequests();
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

  const handleDeclineConfirm = () => {
    if (!declineReason || (declineReason === 'Other' && !customReason)) {
      alert('Please select a reason for declining');
      return;
    }
    handleApproval(selectedRequest?.reservation_id, false);
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
      venues: request.venues || [],
      vehicles: request.vehicles || [],
      equipment: request.equipment ? {
        equipment_ids: request.equipment.map(e => e.equipment_id),
        items: request.equipment
      } : null,
      passengers: request.passengers || [],
      user_id: request.reservation_user_id // Adding the reservation_user_id
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

  // Update the RequestDetailsModal component to handle decline properly
  const RequestDetailsModal = ({ request, visible, onClose, onApprove, onDecline }) => {
    if (!request) return null;
    
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
      <MuiModal
        open={visible}
        onClose={onClose}
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)'
          }
        }}
      >
        <Box sx={{
          position: 'relative',
          width: '95%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <MuiButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary',
              minWidth: 'auto',
              p: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <FiX size={24} />
          </MuiButton>
          {/* Left Panel - Request Information */}
          <Box sx={{
            width: { xs: '100%', md: '33%' },
            bgcolor: 'primary.light',
            p: 3,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto'
          }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Reservation Details
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar><FiUser /></Avatar>
                  <Box>
                    <Typography variant="subtitle1">{request.requester}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.department_name}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Request ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', p: 0.5, borderRadius: 1 }}>
                      {request.reservation_id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created On
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(request.reservation_created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiCalendar />
                  Schedule Information
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Start Date & Time
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(request.reservation_start_date)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      End Date & Time
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(request.reservation_end_date)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiInfo />
                  Request Information
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Title
                    </Typography>
                    <Typography variant="body2">
                      {request.title || 'No title provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      bgcolor: 'action.hover', 
                      p: 1, 
                      borderRadius: 1,
                      maxHeight: '100px',
                      overflow: 'auto'
                    }}>
                      {request.description || 'No description provided'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>

          {/* Right Panel - Resource Details */}
          <Box sx={{
            width: { xs: '100%', md: '67%' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Reserved Resources</Typography>
              <Typography variant="body2" color="text.secondary">
                Review all resources requested for this reservation
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              overflow: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              {/* Resource sections remain mostly unchanged as they use Ant Design components */}
              {request.venues && request.venues.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: "#52c41a20" }}>
                      <FiMapPin style={{ color: "#52c41a" }} />
                    </div>
                    <span className="text-base font-medium">Venues</span>
                  </div>
                  {request.venues.map((venue, index) => (
                    <Card key={venue.venue_id || index} className="shadow-sm hover:shadow-md transition-shadow border-0 mb-3" style={{ borderLeft: `4px solid #52c41a` }}>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Venue Name</div>
                        <div className="font-medium">{venue.venue_name}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Vehicle and Equipment sections remain similar */}
              {/* ... existing vehicle and equipment sections ... */}
            </Box>

            <Box sx={{ 
              p: 3, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'action.hover',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Alert
                severity="info"
                sx={{ flexGrow: 1, mr: 2, maxWidth: '65%' }}
              >
                <AlertTitle>Ready for Review</AlertTitle>
                Please review the details of this reservation request and take appropriate action.
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <MuiButton
                  variant="contained"
                  color="error"
                  startIcon={<FiX />}
                  onClick={() => onDecline(request.reservation_id)}
                >
                  Decline
                </MuiButton>
                <MuiButton
                  variant="contained"
                  color="success"
                  startIcon={<FiCheck />}
                  onClick={() => onApprove(request.reservation_id)}
                >
                  Approve
                </MuiButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </MuiModal>
    );
  };

  // Update the DeclineReasonModal to work as an overlay with fixed state handling
  const DeclineReasonModal = ({ visible, onClose }) => {
    // Move the handlers inside the modal component to maintain state
    const handleReasonChange = (event) => {
      setDeclineReason(event.target.value);
      if (event.target.value !== 'Other') {
        setCustomReason('');
      }
    };

    const handleCustomReasonChange = (event) => {
      setCustomReason(event.target.value);
    };

    const handleClose = () => {
      onClose();
      // Don't reset the states here to preserve input when reopening
    };

    if (!visible) return null;

    return (
      <MuiModal
        open={visible}
        onClose={handleClose}
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)'
          }
        }}
      >
        <Box sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          outline: 'none'
        }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Select Decline Reason
          </Typography>
          <RadioGroup
            value={declineReason}
            onChange={handleReasonChange}
            sx={{ mb: 3 }}
          >
            {declineReasons.map((reason) => (
              <FormControlLabel
                key={reason}
                value={reason}
                control={<MuiRadio />}
                label={reason}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>

          {declineReason === 'Other' && (
            <TextField
              value={customReason}
              onChange={handleCustomReasonChange}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              label="Please specify the reason"
              placeholder="Enter your reason here..."
              sx={{ mb: 3 }}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <MuiButton 
              onClick={handleClose}
              variant="outlined"
            >
              Cancel
            </MuiButton>
            <MuiButton 
              onClick={handleDeclineConfirm}
              variant="contained" 
              color="error"
              disabled={!declineReason || (declineReason === 'Other' && !customReason)}
            >
              Confirm Decline
            </MuiButton>
          </Box>
        </Box>
      </MuiModal>
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
            onClose={() => {
              handleCloseDetails();
              setDeclineModalVisible(false); // Also close decline modal if open
            }}
            onApprove={() => handleApproval(selectedRequest.reservation_id, true)}
            onDecline={() => setDeclineModalVisible(true)}
          />
        )}
      </AnimatePresence>

      <DeclineReasonModal
        visible={declineModalVisible}
        onClose={() => setDeclineModalVisible(false)}
      />
    </div>
  );
};

export default ViewApproval;