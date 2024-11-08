import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import Sidebar from '../pages/Sidebar';
import Sidebar1 from '../pages/sidebarpersonel';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaCar, FaTools, FaTimes, FaSearch, FaCheck, FaCheckCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Dialog, Transition } from '@headlessui/react'
import { motion } from 'framer-motion';
import { BsCalendarCheck, BsClock, BsPeople } from 'react-icons/bs';

const STEPS = {
  VENUE: 0,
  CALENDAR: 1,
  RESOURCES: 2,
  INFORMATION: 3,
  APPROVAL: 4,
  SUBMITTED: 5
};

const stepTitles = [
  'Choose Venue',
  'Select Dates',
  'Select Resources',
  'Fill Information',
  'Review & Submit',
  'Request Submitted'
];

// Add new animations to the existing CSS (you can add this at the top of your file)
const fadeInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const AddReservation = () => {
  const navigate = useNavigate();
  const [userLevel, setUserLevel] = useState(null);

  useEffect(() => {
    const level = localStorage.getItem('user_level_id');
    setUserLevel(level);
    if (level !== '3') {
      localStorage.clear();
      navigate('/gsd');
    }
  }, [navigate]);

  // Form state
  const [formData, setFormData] = useState({
    reservationName: '',
    eventTitle: '',
    description: '',
    message: '',
    venue: '',
    startDate: null,
    endDate: null,
    participants: '',
    customStartTime: '',
    customEndTime: ''
  });
  
  // Loading and selection states
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  
  // Selected items
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState({});
  
  // Modal visibility states
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentStep, setCurrentStep] = useState(STEPS.VENUE);

  // Update state variables
  const [timeSlotMode, setTimeSlotMode] = useState('preset'); // 'preset' or 'custom'
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchVenues(), fetchUsers(), fetchVehicles(), fetchEquipment()]);
      } catch (error) {
        toast.error("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await axios({
        method: 'post',
        url: 'http://localhost/coc/gsd/fetch2.php',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          operation: 'fetchVenue'
        })
      });

      if (response.data.status === 'success') {
        setVenues(response.data.data);
      } else {
        toast.error("Error fetching venues: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("An error occurred while fetching venues.");
    }
  };

  const fetchUsers = async () => {
  try {
    const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchUsers" }));
    if (response.data.status === 'success') {
      setUsers(response.data.data);
      setFilteredUsers(response.data.data); // Initialize filtered users with all users
    } else {
      toast.error("Error fetching users: " + response.data.message);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    toast.error("An error occurred while fetching users.");
  }
};

  const fetchVehicles = async () => {
    try {
      const response = await axios({
        method: 'post',
        url: 'http://localhost/coc/gsd/fetch2.php',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          operation: 'fetchVehicles'
        })
      });

      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      } else {
        toast.error("Error fetching vehicles: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("An error occurred while fetching vehicles.");
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchEquipments" }));
      if (response.data.status === 'success') {
        setEquipment(response.data.data);
      } else {
        toast.error("Error fetching equipment: " + response.data.message);
      }
    } catch {
      toast.error("An error occurred while fetching equipment.");
    }
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = [
      'reservationName',
      'eventTitle',
      'venue',
      'selectedUserId',
      'startDate',
      'endDate'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);

    // Adjust the date handling
    const adjustDate = (date) => {
      const d = new Date(date);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    };

    // Construct the payload
    const payload = {
      operation: 'completeReservation',
      reservation: {
        reservation_name: formData.reservationName,
        reservation_event_title: formData.eventTitle,
        reservation_description: formData.description || "",
        reservation_start_date: adjustDate(formData.startDate),
        reservation_end_date: adjustDate(formData.endDate),
        reservation_participants: parseInt(formData.participants) || 0,
      },
      equipments: Object.entries(selectedEquipment)
        .filter(([_, quantity]) => quantity > 0)
        .map(([equipId, quantity]) => ({
          equip_id: parseInt(equipId),
          quantity: parseInt(quantity),
        })),
      vehicles: selectedModels.map(vehicleId => ({ vehicle_id: parseInt(vehicleId) })),
      venues: [{ venue_id: parseInt(formData.venue) }],
    };

    try {
      const response = await axios.post(
        'http://localhost/coc/gsd/update_master.php',
        JSON.stringify(payload),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data.status === 'success') {
        toast.success('Reservation successfully added!');
        resetForm();
      } else {
        toast.error(response.data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      toast.error("Error adding reservation: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  

  const resetForm = () => {
    setFormData({
      reservationName: '',
      eventTitle: '',
      description: '',
      message: '',
      venue: '',
      startDate: null,
      endDate: null,
      participants: '',
      selectedUserId: '',
      selectedUserName: '',
      customStartTime: '',
      customEndTime: ''
    });
    setSelectedModels([]);
    setSelectedEquipment({});
    setCurrentStep(STEPS.VENUE);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleCheckboxChange = (vehicleId) => {
    setSelectedModels(prevSelected => 
      prevSelected.includes(vehicleId)
        ? prevSelected.filter(id => id !== vehicleId)
        : [...prevSelected, vehicleId]
    );
  };

  const handleEquipmentCheckboxChange = (equipId) => {
    setSelectedEquipment(prev => {
      const newSelected = { ...prev };
      if (newSelected[equipId]) {
        delete newSelected[equipId];
      } else {
        newSelected[equipId] = 1; // Default to 1 when selected
      }
      return newSelected;
    });
  };

  const handleEquipmentQuantityChange = (equipId, quantity) => {
    setSelectedEquipment(prev => ({
      ...prev,
      [equipId]: quantity
    }));
  };

  const handleUserSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = users.filter(user => 
      user.users_name.toLowerCase().includes(term) ||
      user.users_school_id.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const selectUser = (user) => {
    setFormData(prevState => ({
      ...prevState,
      selectedUserId: user.users_id,
      selectedUserName: user.users_name
    }));
    setShowUserModal(false);
  };

  const handleStartDateChange = (date) => {
    setFormData(prev => {
      const newEndDate = prev.endDate && new Date(prev.endDate) < date ? null : prev.endDate;
      return {
        ...prev,
        startDate: date,
        endDate: newEndDate
      };
    });
  };

  const handleEndDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      endDate: date
    }));
  };

  const ProgressIndicator = () => (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {stepTitles.map((title, index) => (
          <div
            key={index}
            className={`flex flex-col items-center relative z-10 transition-all duration-500 ${
              index <= currentStep ? 'text-green-600 scale-105' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 
              transition-all duration-500 ${
                index <= currentStep 
                  ? 'bg-green-100 border-2 border-green-500 shadow-lg transform scale-110' 
                  : 'bg-gray-100'
              }`}
            >
              {index < currentStep ? (
                <FaCheck className="text-green-600 animate-bounce" />
              ) : index === currentStep ? (
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium whitespace-nowrap transition-all duration-300">
              {title}
            </span>
          </div>
        ))}
        <div className="absolute top-6 left-0 h-[2px] bg-gray-200 w-full -z-0">
          <div
            className="h-full bg-green-500 transition-all duration-700 ease-in-out"
            style={{ 
              width: `${(currentStep / (stepTitles.length - 1)) * 100}%`,
              boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderVenues = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue) => (
        <motion.div
          key={`venue-${venue.ven_id}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setFormData(prev => ({
            ...prev,
            venue: venue.ven_id
          }))}
          className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer
            backdrop-blur-sm ${
              formData.venue === venue.ven_id 
                ? 'border-green-500 bg-green-50/90 shadow-lg' 
                : 'border-gray-200 hover:border-green-300 hover:shadow-lg bg-white/90'
            }`}
        >
          <div className="mb-4 h-40 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={venue.image_url || '/default-venue.jpg'} 
              alt={venue.ven_name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <h4 className="font-semibold text-lg mb-2">{venue.ven_name}</h4>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BsPeople />
              <span>Capacity: {venue.ven_occupancy}</span>
            </div>
            <div className="flex items-center gap-2">
              <BsClock />
              <span>Operating Hours: 8:00 AM - 5:00 PM</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium
              ${venue.status_availability_name === 'available' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
              }`}
            >
              {venue.status_availability_name.charAt(0).toUpperCase() + 
               venue.status_availability_name.slice(1)}
            </span>
          </div>

          {formData.venue === venue.ven_id && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-green-600 flex items-center"
            >
              <FaCheckCircle className="mr-2" />
              <span>Selected</span>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderResources = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Vehicles Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h4 className="text-lg font-semibold mb-4 flex items-center text-green-700">
          <FaCar className="mr-2" />
          Available Vehicles
        </h4>
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <div
              key={`vehicle-${vehicle.vehicle_id}`}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                selectedModels.includes(vehicle.vehicle_id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`vehicle-checkbox-${vehicle.vehicle_id}`}
                    checked={selectedModels.includes(vehicle.vehicle_id)}
                    onChange={() => handleCheckboxChange(vehicle.vehicle_id)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium">
                      {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>{vehicle.vehicle_category_name}</span>
                      <span className="mx-2">•</span>
                      <span>{vehicle.vehicle_license}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${vehicle.status_availability_name === 'available' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {vehicle.status_availability_name.charAt(0).toUpperCase() + 
                     vehicle.status_availability_name.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h4 className="text-lg font-semibold mb-4 flex items-center text-green-700">
          <FaTools className="mr-2" />
          Available Equipment
        </h4>
        <div className="space-y-3">
          {equipment.map((item) => (
            <div
              key={`equipment-${item.equip_id}`}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                selectedEquipment[item.equip_id]
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={!!selectedEquipment[item.equip_id]}
                    onChange={() => handleEquipmentCheckboxChange(item.equip_id)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium">{item.equip_name}</p>
                    <p className="text-sm text-gray-500">Available: {item.equip_quantity}</p>
                  </div>
                </div>
                {selectedEquipment[item.equip_id] && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max={item.equip_quantity}
                      value={selectedEquipment[item.equip_id]}
                      onChange={(e) => handleEquipmentQuantityChange(item.equip_id, e.target.value)}
                      className="w-16 p-1 border rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.VENUE:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-2xl text-green-700 mb-6">
              <FaMapMarkerAlt />
              <h3 className="font-semibold">Select Your Venue</h3>
            </div>
            {renderVenues()}
          </div>
        );

      case STEPS.CALENDAR:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-2xl text-green-700 mb-6">
              <FaCalendarAlt />
              <h3 className="font-semibold">Choose Your Dates</h3>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={handleStartDateChange}
                  dateFormat="MMMM d, yyyy"
                  minDate={new Date()}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={handleEndDateChange}
                  dateFormat="MMMM d, yyyy"
                  minDate={formData.startDate || new Date()}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Time Selection Mode Toggle */}
            {(formData.startDate && formData.endDate) && (
              <div className="space-y-6">
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={() => setTimeSlotMode('preset')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      timeSlotMode === 'preset'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Preset Time Slots
                  </button>
                  <button
                    onClick={() => setTimeSlotMode('custom')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      timeSlotMode === 'custom'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Custom Time
                  </button>
                </div>

                {timeSlotMode === 'preset' ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-700 text-center mb-4">Select Time Slot</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                      {[
                        { label: 'Morning', time: '08:00-12:00' },
                        { label: 'Afternoon', time: '13:00-17:00' },
                        { label: 'Full Day', time: '08:00-17:00' },
                        { label: 'Custom Slot', time: 'custom' }
                      ].map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => handleTimeSlotSelect(slot.time)}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            selectedTime === slot.time
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium">{slot.label}</div>
                            <div className="text-sm text-gray-500">{slot.time !== 'custom' ? slot.time : ''}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                          type="time"
                          value={formData.customStartTime || ''}
                          onChange={(e) => handleCustomTimeChange('customStartTime', e.target.value)}
                          min="08:00"
                          max="17:00"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                          type="time"
                          value={formData.customEndTime || ''}
                          onChange={(e) => handleCustomTimeChange('customEndTime', e.target.value)}
                          min={formData.customStartTime || '08:00'}
                          max="17:00"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    {(formData.customStartTime && formData.customEndTime) && (
                      <div className="text-center text-sm text-gray-600">
                        Selected time: {formatTime(formData.customStartTime)} - {formatTime(formData.customEndTime)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case STEPS.RESOURCES:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-2xl text-green-700 mb-6">
              <FaTools />
              <h3 className="font-semibold">Select Resources</h3>
            </div>
            {renderResources()}
          </div>
        );

      case STEPS.INFORMATION:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-2xl text-green-700 mb-6">
              <FaUser />
              <h3 className="font-semibold">Event Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
              <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reservation Name *
                    </label>
                    <input
                      type="text"
                      name="reservationName"
                      value={formData.reservationName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter reservation name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      name="eventTitle"
                      value={formData.eventTitle}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Participants *
                    </label>
                    <input
                      type="number"
                      name="participants"
                      value={formData.participants}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter number of participants"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Describe your event"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Any additional information or special requests"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case STEPS.APPROVAL:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-2xl text-green-700 mb-6">
              <FaCheckCircle />
              <h3 className="font-semibold">Review & Confirm</h3>
            </div>
            {renderReviewSection()}
          </div>
        );

      case STEPS.SUBMITTED:
        return renderSuccessState();

      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation checks
      const requiredFields = {
        'Reservation Name': formData.reservationName,
        'Event Title': formData.eventTitle,
        'Venue': formData.venue,
        'Start Date': formData.startDate,
        'End Date': formData.endDate,
        'Number of Participants': formData.participants,
        'Description': formData.description
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value && value !== 0)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Format dates for API
      const formatDateForAPI = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
      };

      // Prepare the payload to match the backend structure exactly
      const payload = {
        operation: "insertReservation",
        reservation_name: formData.reservationName,
        reservation_event_title: formData.eventTitle,
        reservation_description: formData.description,
        reservation_start_date: formatDateForAPI(formData.startDate),
        reservation_end_date: formatDateForAPI(formData.endDate),
        reservation_participants: formData.participants.toString(),
        reservations_users_id: localStorage.getItem('user_id'),
        equipments: Object.entries(selectedEquipment)
          .filter(([_, quantity]) => quantity > 0)
          .map(([equipId, quantity]) => ({
            equip_id: equipId.toString(),
            quantity: quantity.toString()
          })),
        vehicles: selectedModels.map(vehicleId => ({
          vehicle_id: vehicleId.toString()
        })),
        venues: [{ 
          venue_id: formData.venue.toString() 
        }]
      };

      console.log('Sending payload:', payload);

      const response = await axios.post(
        'http://localhost/coc/gsd/update_master.php',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Reservation submitted successfully!');
        setCurrentStep(STEPS.SUBMITTED);
      } else {
        throw new Error(response.data.message || 'Failed to submit reservation');
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      setLoading(false);
    }
  };

  // Update the resetForm function to properly reset all fields
  

  // Update the handleNext function to use handleSubmit when on the final step
  const handleNext = () => {
    if (currentStep < STEPS.APPROVAL) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(new Event('submit')); // Create a synthetic event
    }
  };  

  const handleBack = () => {
    if (currentStep > STEPS.VENUE) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add this function to render the review section
  const renderReviewSection = () => {
    // Debug logging
    console.log('Available venues:', venues);
    console.log('Selected venue ID:', formData.venue);
    console.log('Selected venue type:', typeof formData.venue);
    
    // Format date for display
    const formatDate = (date) => {
      if (!date) return 'Not selected';
      return new Date(date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    // Get selected venue details with string comparison
    const selectedVenue = venues.find(v => v.ven_id.toString() === formData.venue.toString());
    console.log('Found venue:', selectedVenue);
    
    // Get selected vehicles details
    const selectedVehicleDetails = vehicles.filter(v => 
      selectedModels.includes(v.vehicle_id)
    );

    // Get selected equipment details
    const selectedEquipmentDetails = equipment.filter(e => 
      selectedEquipment[e.equip_id]
    );

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-800">Reservation Summary</h3>
          </div>

          <div className="p-6 space-y-8">
            {/* Event Details Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <FaCalendarAlt className="text-green-600" />
                Event Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                <div>
                  <p className="text-sm text-gray-500">Reservation Name</p>
                  <p className="font-medium text-gray-900">{formData.reservationName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event Title</p>
                  <p className="font-medium text-gray-900">{formData.eventTitle || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Participants</p>
                  <p className="font-medium text-gray-900">{formData.participants || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-900">{formData.description || 'Not provided'}</p>
                </div>
                {formData.message && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Additional Message</p>
                    <p className="font-medium text-gray-900">{formData.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date & Venue Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <FaMapMarkerAlt className="text-green-600" />
                Date & Venue
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                <div>
                  <p className="text-sm text-gray-500">Start Date & Time</p>
                  <p className="font-medium text-gray-900">{formatDate(formData.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date & Time</p>
                  <p className="font-medium text-gray-900">{formatDate(formData.endDate)}</p>
                </div>
                {selectedVenue && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-2">Selected Venue</p>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="font-medium text-green-800">{selectedVenue.ven_name}</p>
                      <p className="text-sm text-green-600">Capacity: {selectedVenue.ven_occupancy}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resources Section */}
            {(selectedVehicleDetails.length > 0 || selectedEquipmentDetails.length > 0) && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                  <FaTools className="text-green-600" />
                  Selected Resources
                </h4>
                <div className="space-y-6 pl-6">
                  {/* Vehicles */}
                  {selectedVehicleDetails.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-500">Vehicles</p>
                      <div className="space-y-2">
                        {selectedVehicleDetails.map(vehicle => (
                          <div key={vehicle.vehicle_id} 
                               className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                              <p className="font-medium text-blue-800">
                                {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                              </p>
                              <p className="text-sm text-blue-600">{vehicle.vehicle_license}</p>
                            </div>
                            <span className="text-sm text-blue-600">{vehicle.vehicle_category_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equipment */}
                  {selectedEquipmentDetails.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-500">Equipment</p>
                      <div className="space-y-2">
                        {selectedEquipmentDetails.map(item => (
                          <div key={item.equip_id} 
                               className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="font-medium text-purple-800">{item.equip_name}</p>
                            <span className="text-sm text-purple-600">
                              Quantity: {selectedEquipment[item.equip_id]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add these helper functions
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTime(timeSlot);
    let startTime, endTime;

    switch (timeSlot) {
      case '08:00-12:00':
        startTime = '08:00';
        endTime = '12:00';
        break;
      case '13:00-17:00':
        startTime = '13:00';
        endTime = '17:00';
        break;
      case '08:00-17:00':
        startTime = '08:00';
        endTime = '17:00';
        break;
      case 'custom':
        setTimeSlotMode('custom');
        return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');
    
    startDate.setHours(parseInt(startHour), parseInt(startMinute));
    endDate.setHours(parseInt(endHour), parseInt(endMinute));

    setFormData(prev => ({
      ...prev,
      startDate,
      endDate,
      customStartTime: startTime,
      customEndTime: endTime
    }));
  };

  const handleCustomTimeChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'customStartTime') {
        const startDate = new Date(prev.startDate);
        const [hours, minutes] = value.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));
        newData.startDate = startDate;
      } else if (field === 'customEndTime') {
        const endDate = new Date(prev.endDate);
        const [hours, minutes] = value.split(':');
        endDate.setHours(parseInt(hours), parseInt(minutes));
        newData.endDate = endDate;
      }
      
      return newData;
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const renderSuccessState = () => (
    <div className="text-center py-12 space-y-8 animate-fadeIn">
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <FaCheckCircle className="text-5xl text-green-600" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">
          Request Submitted Successfully!
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Your reservation request has been submitted and is waiting for approval. 
          You will be notified once it's reviewed.
        </p>
      </div>

      <div className="flex justify-center gap-4 pt-6">
        <button
          onClick={() => {
            resetForm();
            setCurrentStep(STEPS.VENUE);
          }}
          className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg
            hover:bg-green-700 transition-colors duration-200"
        >
          Create New Request
        </button>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg
            hover:bg-gray-200 transition-colors duration-200"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  // Add new component for time slot visualization
  const TimeSlotVisualizer = ({ selectedStartTime, selectedEndTime }) => {
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM
    const startHour = parseInt(selectedStartTime?.split(':')[0]);
    const endHour = parseInt(selectedEndTime?.split(':')[0]);

    return (
      <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          {hours.map(hour => (
            <div
              key={hour}
              className={`flex-1 h-8 rounded-md transition-colors duration-200 ${
                hour >= startHour && hour < endHour
                  ? 'bg-green-200'
                  : 'bg-gray-100'
              }`}
            >
              <div className="text-xs text-center mt-2">
                {hour}:00
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add new component for conflict warning
  const ConflictWarning = ({ conflicts }) => {
    if (!conflicts?.length) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
      >
        <h5 className="font-medium text-yellow-800 mb-2">
          Potential Conflicts Found
        </h5>
        <ul className="list-disc list-inside text-sm text-yellow-700">
          {conflicts.map((conflict, index) => (
            <li key={index}>{conflict}</li>
          ))}
        </ul>
      </motion.div>
    );
  };

  // Add recurring reservation options
  const RecurringOptions = ({ onRecurringChange }) => (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-3">Recurring Reservation</h5>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="recurring"
            value="none"
            onChange={(e) => onRecurringChange(e.target.value)}
            defaultChecked
          />
          <span>One-time</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="recurring"
            value="weekly"
            onChange={(e) => onRecurringChange(e.target.value)}
          />
          <span>Weekly</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="recurring"
            value="monthly"
            onChange={(e) => onRecurringChange(e.target.value)}
          />
          <span>Monthly</span>
        </label>
      </div>
    </div>
  );

  // Update the calendar section to include new components
  const renderCalendarSection = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* ... existing calendar code ... */}
      
      <TimeSlotVisualizer 
        selectedStartTime={formData.customStartTime} 
        selectedEndTime={formData.customEndTime}
      />
      
      <ConflictWarning conflicts={[
        "Another event is scheduled from 10:00 AM to 11:00 AM",
        "The venue requires 30 minutes setup time between events"
      ]} />
      
      <RecurringOptions 
        onRecurringChange={(value) => {
          setFormData(prev => ({
            ...prev,
            recurringType: value
          }));
        }}
      />
    </div>
  );

  // Add a new component for resource availability timeline
  const ResourceTimeline = ({ resource, bookings }) => (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-3">{resource.name} Availability</h5>
      <div className="relative h-8 bg-gray-100 rounded-md">
        {bookings.map((booking, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${booking.startPercent}%`,
              width: `${booking.duration}%`,
              height: '100%',
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
            }}
            className="rounded-md"
          >
            <span className="text-xs">{booking.time}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {userLevel === '100' && <Sidebar />}
      {userLevel === '1' && <Sidebar1 />}
      <div className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <ProgressIndicator />
              <div className="mt-6">
                {renderStepContent()}
              </div>
              {currentStep !== STEPS.SUBMITTED && (
                <div className="mt-8 flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === STEPS.VENUE}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg
                      hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg
                      hover:bg-green-700 transition-colors duration-200"
                  >
                    {currentStep === STEPS.APPROVAL ? 'Submit Reservation' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
  );
};

export default AddReservation;
