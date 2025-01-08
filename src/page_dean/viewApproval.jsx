import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null); // Will be fetched from localStorage
  const [requestType, setRequestType] = useState('vehicle'); // Default type
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-semibold text-center mb-6">Approval Requests</h1>

      {/* Filter Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium">Request Type:</label>
            <select
              value={requestType}
              onChange={handleRequestTypeChange}
              className="mt-1 p-2 border border-gray-300 rounded-md"
            >
              <option value="venue">Venue</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchApprovalRequests}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Fetch Requests'}
        </button>
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <p>No requests available</p>
        ) : (
          requests.map((request) => (
            <div
              key={request.approval_id}
              className="p-4 bg-gray-100 rounded-lg shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-medium">
                    Form Name: {request.vehicle.form_name || request.venue.form_name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {request.vehicle.license ? (
                      <>Driver: {request.vehicle.form_name}</>
                    ) : (
                      <>Event: {request.venue.event_title}</>
                    )}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  request.vehicle.license ? 
                  'bg-blue-100 text-blue-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {request.vehicle.license ? 'Vehicle Request' : 'Venue Request'}
                </span>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => handleViewDetails(request)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto shadow-xl">
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
                      <p><span className="font-medium">Driver:</span> {selectedRequest.vehicle.form_name}</p>
                      <p><span className="font-medium">Purpose:</span> {selectedRequest.vehicle.purpose}</p>
                      <p><span className="font-medium">Destination:</span> {selectedRequest.vehicle.destination}</p>
                      <p><span className="font-medium">Requestor:</span> {selectedRequest.vehicle.requester}</p>
                    </div>
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
            ) : null}

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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
