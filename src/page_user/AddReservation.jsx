import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';
import Sidebar1 from '../pages/sidebarpersonel';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaCar, FaTools, FaTimes, FaSearch, FaCheck, FaCheckCircle } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { BsCalendarCheck, BsClock, BsPeople, BsFillGridFill, BsList } from 'react-icons/bs';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Calendar } from 'primereact/calendar'; // Add this import
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { UserOutlined, InfoCircleOutlined, TeamOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import { DatePicker, TimePicker, Form, Input, InputNumber, Select, Card, Typography, Row, Col, Divider, Radio, Result, Alert, Modal } from 'antd';
import moment from 'moment';
import { CalendarOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Dialog } from 'primereact/dialog';
import { InputNumber as PrimeInputNumber } from 'primereact/inputnumber';

const { RangePicker } = DatePicker;

const fadeInAnimation = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const DatePickerWithConflict = ({ value, onChange, ...props }) => {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      className="w-full"
      {...props}
    />
  );
};

const AddReservation = () => {
  const timeSlots = [
    { id: '08:00-10:00', label: 'Early Morning', time: '8:00 AM - 10:00 AM', start: 8, end: 10 },
    { id: '10:00-12:00', label: 'Mid Morning', time: '10:00 AM - 12:00 PM', start: 10, end: 12 },
    { id: '13:00-15:00', label: 'Early Afternoon', time: '1:00 PM - 3:00 PM', start: 13, end: 15 },
    { id: '15:00-17:00', label: 'Late Afternoon', time: '3:00 PM - 5:00 PM', start: 15, end: 17 },
    { id: '08:00-12:00', label: 'Morning', time: '8:00 AM - 12:00 PM', start: 8, end: 12 },
    { id: '13:00-17:00', label: 'Afternoon', time: '1:00 PM - 5:00 PM', start: 13, end: 17 },
    { id: '08:00-17:00', label: 'Full Day', time: '8:00 AM - 5:00 PM', start: 8, end: 17 },
  ];

  const navigate = useNavigate();
  const [userLevel] = useState(localStorage.getItem('user_level') || '');
  const userId = localStorage.getItem('user_id');
  const [loading, setLoading] = useState(false);
  
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [venues, setVenues] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState({});
  const [users, setUsers] = useState([]);

  const [timeSlotMode, setTimeSlotMode] = useState('preset');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [timeSlotAvailability, setTimeSlotAvailability] = useState({
    isChecking: false,
    isAvailable: false,
    conflicts: []
  });
  const [reservations, setReservations] = useState([]);

  const [resourceView, setResourceView] = useState('vehicles');
  const [currentStep, setCurrentStep] = useState(0);
  const [resourceStep, setResourceStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [resourceType, setResourceType] = useState(''); // 'vehicle' or 'venue'
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [dateAvailability, setDateAvailability] = useState(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedVenueEquipment, setSelectedVenueEquipment] = useState({});
  const [equipmentQuantities, setEquipmentQuantities] = useState({});

  const [formData, setFormData] = useState({
    resourceType: '',
    // Common fields
    startDate: null,
    endDate: null,
    selectedTime: null,
    // Venue specific fields
    eventTitle: '',
    description: '',
    participants: '',
    venue: '',
    // Vehicle specific fields
    purpose: '',
    destination: '',
    passengers: [], // Make sure this is initialized as an empty array
    driverName: '',
  });

  // Add this with other state declarations at the top
  const [viewMode, setViewMode] = useState('grid');

  // Add these new functions
const handleAddPassenger = () => {
  setFormData(prev => ({
    ...prev,
    passengers: [
      ...prev.passengers,
      { id: Date.now(), name: '' } // Using timestamp as a unique ID
    ]
  }));
};

const handleRemovePassenger = (passengerId) => {
  setFormData(prev => ({
    ...prev,
    passengers: prev.passengers.filter(p => p.id !== passengerId)
  }));
};

const handlePassengerChange = (passengerId, value) => {
  setFormData(prev => ({
    ...prev,
    passengers: prev.passengers.map(p =>
      p.id === passengerId ? { ...p, name: value } : p
    )
  }));
};

const handleEquipmentQuantityChange = (equipId, value) => {
  // Don't allow undefined, null, or negative values
  if (value === undefined || value === null || value < 0) return;
  
  const equip = equipment.find(e => e.equipment_id === equipId);
  if (!equip) return;

  // Check if quantity exceeds available amount
  if (value > equip.equipment_quantity) {
    toast.error(`Maximum available quantity is ${equip.equipment_quantity}`);
    return;
  }

  setEquipmentQuantities(prev => ({
    ...prev,
    [equipId]: value // Store the actual number value
  }));
};

const handleAddEquipment = () => {
  const newEquipment = {};
  Object.entries(equipmentQuantities).forEach(([equipId, quantity]) => {
    if (quantity > 0) {
      // Make sure to store as string consistently
      newEquipment[equipId.toString()] = quantity;
    }
  });
  
  setSelectedVenueEquipment(newEquipment);
  setShowEquipmentModal(false);

  // Add debug log
  console.log('Added Equipment:', newEquipment);
};

  useEffect(() => {
    const user_level_id = localStorage.getItem('user_level_id');
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user_level_id !== '3') {
          localStorage.clear();
          navigate('/gsd');
          return;
        }
        await Promise.all([fetchVenues(), fetchVehicles(), fetchEquipment()]);
      } catch (error) {
        toast.error("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);



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
      const response = await axios({
        method: 'post',
        url: 'http://localhost/coc/gsd/fetch2.php',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          operation: 'fetchEquipments'
        })
      });

      if (response.data.status === 'success') {
        const formattedEquipment = response.data.data.map(item => ({
          equipment_id: item.equip_id,
          equipment_name: item.equip_name,
          equipment_quantity: parseInt(item.equip_quantity),
          equipment_category: item.equipments_category_name,
          equipment_pic: item.equip_pic,
          status_availability_name: item.status_availability_name
        }));
        setEquipment(formattedEquipment);
      } else {
        toast.error("Error fetching equipment: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error("An error occurred while fetching equipment.");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const vehicleResponse = await axios.post(
          'http://localhost/coc/gsd/fetch2.php',
          new URLSearchParams({ operation: 'fetchVehicleCategories' })
        );
        if (vehicleResponse.data.status === 'success') {
          setVehicleCategories(vehicleResponse.data.data);
        }

        const equipResponse = await axios.post(
          'http://localhost/coc/gsd/fetch2.php',
          new URLSearchParams({ operation: 'fetchEquipmentCategories' })
        );
        if (equipResponse.data.status === 'success') {
          setEquipmentCategories(equipResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);



const handleNext = async (e) => {
  console.log('Current Form Data:', formData);
  console.log('Current Step:', currentStep);

  // Special case for resource type selection (first step)
  if (currentStep === 0) {
    if (!formData.resourceType) {
      toast.error('Please select a resource type (Venue or Vehicle)');
      return;
    }
    setCurrentStep(prev => prev + 1);
    return;
  }

  const valid = isStepValid();
  console.log('Is Step Valid:', valid);

  if (!valid) {
    const missing = getMissingFields();
    console.log('Missing Fields:', missing);
    const missingLabels = missing.map(field => {
      const labels = {
        eventTitle: 'Event Title',
        description: 'Description',
        startDate: 'Start Date',
        endDate: 'End Date',
        participants: 'Number of Participants',
        venue: 'Venue',
        selectedModels: 'Vehicle'
      };
      return labels[field] || field;
    });
    toast.error(`Please fill in all required fields: ${missingLabels.join(', ')}`);
    return;
  }

  if (currentStep === 3) {
    // Additional validation before submission
    const isValid = validateSubmission();
    if (!isValid) {
      return;
    }
    await handleAddReservation(e);
  } else {
    setCurrentStep(prev => prev + 1);
  }
};

const getMissingFields = () => {
  const vehicleRequiredFields = ['purpose', 'destination']; // removed reservationName
  const venueRequiredFields = ['eventTitle', 'description', 'participants', 'startDate', 'endDate']; // removed reservationName
  
  const currentRequiredFields = {
    0: ['resourceType'],
    1: formData.resourceType === 'vehicle' ? vehicleRequiredFields : venueRequiredFields,
    2: formData.resourceType === 'venue' ? ['venue'] : ['selectedModels'],
    3: [],
    4: []
  }[currentStep] || [];

  return currentRequiredFields.filter(field => {
    if (field === 'selectedModels') {
      return selectedModels.length === 0;
    }
    if (field === 'startDate' || field === 'endDate') {
      return !formData[field];
    }
    const value = formData[field];
    return value === undefined || value === null || 
           (typeof value === 'string' && !value.trim()) ||
           (Array.isArray(value) && value.length === 0);
  });
};

const isStepValid = () => {
  switch (currentStep) {
    case 0:
      return !!formData.resourceType;
    case 1:
      if (formData.resourceType === 'vehicle') {
        return !!(
          formData.purpose?.trim() && // removed reservationName check
          formData.destination?.trim()
        );
      } else {
        return !!(
          formData.eventTitle?.trim() && // removed reservationName check
          formData.description?.trim() &&
          formData.participants &&
          formData.startDate &&
          formData.endDate
        );
      }
    case 2:
      return formData.resourceType === 'venue' ? 
        !!formData.venue : 
        (Array.isArray(selectedModels) && selectedModels.length > 0);
    case 3:
      return true; // Review step
    case 4:
      return true; // Success step
    default:
      return false;
  }
};

// Add this function after isStepValid and before handleInputChange
const validateSubmission = () => {
  if (formData.resourceType === 'venue') {
    if (!formData.venue || !formData.eventTitle || !formData.description || 
        !formData.participants || !formData.startDate || !formData.endDate) {
      Modal.error({
        title: 'Validation Error',
        content: 'Please make sure all venue reservation fields are filled out properly.'
      });
      return false;
    }
  } else if (formData.resourceType === 'vehicle') {
    if (!selectedModels.length) {
      Modal.error({
        title: 'Validation Error',
        content: 'Please select at least one vehicle.'
      });
      return false;
    }
    if (!formData.purpose || !formData.destination || 
        !formData.startDate || !formData.endDate) { // removed reservationName check
      Modal.error({
        title: 'Validation Error',
        content: 'Please make sure all vehicle reservation fields are filled out properly.'
      });
      return false;
    }
    if (!formData.passengers || formData.passengers.length === 0) {
      Modal.error({
        title: 'Validation Error',
        content: 'Please add at least one passenger.'
      });
      return false;
    }
  }

  // Validate dates
  if (!formData.startDate || !formData.endDate) {
    Modal.error({
      title: 'Validation Error',
      content: 'Please select both start and end dates.'
    });
    return false;
  }

  return true;
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleCheckboxChange = (id, type) => {
  if (type === 'vehicle') {
    setSelectedModels(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(selectedId => selectedId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  }
};

const handleEquipmentCheckboxChange = (equipId, quantity = 1) => {
  setSelectedEquipment(prev => {
    const newSelected = { ...prev };
    if (newSelected[equipId]) {
      delete newSelected[equipId];
    } else {
      const equip = equipment.find(e => e.equipment_id === equipId);
      if (equip && quantity <= equip.equipment_quantity) {
        newSelected[equipId] = quantity;
      } else {
        toast.error(`Maximum available quantity is ${equip?.equipment_quantity}`);
        return prev;
      }
    }
    return newSelected;
  });
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
    selectedUserId: user.users_id
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

const renderVenues = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
  >
    {/* View toggle buttons */}
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-semibold">Select Venue</h3>
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === 'grid' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
          title="Grid View"
        >
          <BsFillGridFill size={20} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
          title="List View"
        >
          <BsList size={20} />
        </button>
      </div>
    </div>

    {/* Venues grid/list container */}
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-4'
      }
    `}>
      {venues.map((venue) => (
        <Card
          key={venue.ven_id}
          className={`
            ${viewMode === 'list' ? 'flex' : ''}
            transition-all duration-300 cursor-pointer hover:shadow-lg
            ${formData.venue === venue.ven_id ? 
              'ring-2 ring-green-500 shadow-lg bg-green-50' : 
              'hover:shadow-md hover:border-green-200'
            }
          `}
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              venue: venue.ven_id
            }));
          }}
        >
          <div className={`
            ${viewMode === 'list' ? 'flex items-center w-full' : ''}
          `}>
            {/* Image container */}
            <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
              <img
                src={venue.image_url || '/default-venue.jpg'}
                alt={venue.ven_name}
                className={`
                  object-cover rounded-t-lg
                  ${viewMode === 'grid' ? 'w-full h-48' : 'h-32 w-full'}
                `}
              />
            </div>

            {/* Content container */}
            <div className="p-4 flex-grow">
              <div className="flex justify-between items-start">
                <h3 className={`text-xl font-semibold ${
                  formData.venue === venue.ven_id ? 'text-green-700' : 'text-gray-800'
                }`}>
                  {venue.ven_name}
                </h3>
                <Tag
                  severity={venue.status_availability_name === 'available' ? 'success' : 'danger'}
                  value={venue.status_availability_name}
                />
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-2">
                  <i className="pi pi-users" />
                  <span>Capacity: {venue.ven_occupancy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="pi pi-clock" />
                  <span>8:00 AM - 5:00 PM</span>
                </div>
              </div>

              {formData.venue === venue.ven_id && (
                <div className="mt-3">
                  <Tag
                    severity="success"
                    icon="pi pi-check"
                    value="Selected"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Equipment selection button and modal */}
    {formData.venue && (
      <div className="mt-6">
        <Button
          icon="pi pi-plus"
          label="Add Equipment"
          className="p-button-outlined"
          onClick={() => setShowEquipmentModal(true)}
        />
        
        {Object.keys(selectedVenueEquipment).length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Selected Equipment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                const equip = equipment.find(e => e.equipment_id === parseInt(equipId));
                return equip && (
                  <Card key={equipId} className="shadow-sm">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={`http://localhost/coc/gsd/${equip.equipment_pic}`}
                          alt={equip.equipment_name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.src = '/default-equipment.jpg';
                            e.target.onerror = null;
                          }}
                        />
                        <div>
                          <h5 className="font-medium text-gray-800">{equip.equipment_name}</h5>
                          <p className="text-sm text-gray-600">Quantity: {quantity}</p>
                        </div>
                      </div>
                      <Button
                        icon="pi pi-times"
                        className="p-button-text p-button-danger p-button-rounded"
                        onClick={() => {
                          const newSelected = { ...selectedVenueEquipment };
                          delete newSelected[equipId];
                          setSelectedVenueEquipment(newSelected);
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Equipment Selection Modal */}
    <Dialog
      visible={showEquipmentModal}
      onHide={() => setShowEquipmentModal(false)}
      header="Select Equipment"
      style={{ width: '90%', maxWidth: '800px' }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setShowEquipmentModal(false)}
          />
          <Button
            label="Add Selected"
            icon="pi pi-check"
            onClick={handleAddEquipment}
            disabled={Object.keys(equipmentQuantities).length === 0}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {/* View toggle for equipment */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select Equipment</h3>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              title="Grid View"
            >
              <BsFillGridFill size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              title="List View"
            >
              <BsList size={20} />
            </button>
          </div>
        </div>

        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
            : 'space-y-4'
          }
        `}>
          {equipment.map((equip) => (
            <Card
              key={equip.equipment_id}
              className={`${
                equipmentQuantities[equip.equipment_id] ? 'border-2 border-green-500' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={`http://localhost/coc/gsd/${equip.equipment_pic}`}
                  alt={equip.equipment_name}
                  className="w-full h-48 object-cover rounded-t"
                  onError={(e) => {
                    e.target.src = '/default-equipment.jpg';
                    e.target.onerror = null;
                  }}
                />
                <Tag
                  severity={equip.status_availability_name === 'available' ? 'success' : 'danger'}
                  value={equip.status_availability_name}
                  className="absolute top-2 right-2"
                />
              </div>
              <div className="p-4">
                <h5 className="text-lg font-medium mb-2">{equip.equipment_name}</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Available: {equip.equipment_quantity}
                  <br />
                  Category: {equip.equipment_category}
                </p>
                <div className="flex items-center gap-2">
                  <PrimeInputNumber
                    value={equipmentQuantities[equip.equipment_id] || 0}
                    onValueChange={(e) => handleEquipmentQuantityChange(equip.equipment_id, e.value)}
                    min={0}
                    max={equip.equipment_quantity}
                    showButtons
                    size="small"
                    className="w-32"
                    disabled={equip.status_availability_name !== 'available'}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Dialog>
  </motion.div>
);

// Modify renderResources to only show vehicles without equipment options
const renderResources = () => (
  <div className="space-y-4">
    {/* View toggle buttons */}
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-semibold">
        {resourceView === 'vehicles' ? 'Select Vehicles' : 'Select Equipment'}
      </h3>
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === 'grid' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
          title="Grid View"
        >
          <BsFillGridFill size={20} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
          title="List View"
        >
          <BsList size={200} />
        </button>
      </div>
    </div>

    {/* Resource type and category filters */}
    <div className="flex flex-wrap gap-4 mb-6">
      <Dropdown
        value={selectedCategory}
        options={[
          { label: 'All Categories', value: 'all' },
          ...(resourceView === 'vehicles' 
            ? vehicleCategories.map(cat => ({ label: cat.name, value: cat.id }))
            : equipmentCategories.map(cat => ({ label: cat.name, value: cat.id })))
        ]}
        onChange={(e) => setSelectedCategory(e.value)}
        className="w-full sm:w-64"
        placeholder="Filter by category"
      />
    </div>

    {/* Resources grid/list container */}
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-4'
      }
    `}>
      {/* Map through resources */}
      {(resourceView === 'vehicles' ? vehicles : equipment)
        .filter(item => selectedCategory === 'all' || 
          (resourceView === 'vehicles' 
            ? item.vehicle_category_id === selectedCategory
            : item.equipment_category === selectedCategory)
        )
        .map(item => (
          <Card
            key={resourceView === 'vehicles' ? item.vehicle_id : item.equipment_id}
            className={`
              ${viewMode === 'list' ? 'flex' : ''}
              transition-all duration-300
              ${resourceView === 'vehicles' && selectedModels.includes(item.vehicle_id) 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg'
              }
            `}
          >
            <div className={`
              ${viewMode === 'list' ? 'flex items-center w-full' : ''}
            `}>
              {/* Image container */}
              <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                <img
                  src={resourceView === 'vehicles' 
                    ? `http://localhost/coc/gsd/${item.vehicle_pic}`
                    : `http://localhost/coc/gsd/${item.equipment_pic}`
                  }
                  alt={resourceView === 'vehicles' 
                    ? `${item.vehicle_make_name} ${item.vehicle_model_name}`
                    : item.equipment_name
                  }
                  className={`
                    object-cover rounded-t-lg
                    ${viewMode === 'grid' ? 'w-full h-48' : 'h-32 w-full'}
                  `}
                  onError={(e) => {
                    e.target.src = resourceView === 'vehicles' 
                      ? '/default-vehicle.jpg' 
                      : '/default-equipment.jpg';
                  }}
                />
              </div>

              {/* Content container */}
              <div className="p-4 flex-grow">
                {resourceView === 'vehicles' ? (
                  <>
                    <h4 className="font-medium text-lg">
                      {item.vehicle_make_name} {item.vehicle_model_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      License: {item.vehicle_license}
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-lg">
                      {item.equipment_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Available: {item.equipment_quantity}
                    </p>
                  </>
                )}
                
                <Tag
                  severity={item.status_availability_name === 'available' ? 'success' : 'danger'}
                  value={item.status_availability_name}
                  className="mt-2"
                />

                {/* Selection control */}
                {resourceView === 'vehicles' && (
                  <div className={`mt-3 ${viewMode === 'list' ? 'text-right' : ''}`}>
                    <Checkbox
                      checked={selectedModels.includes(item.vehicle_id)}
                      onChange={() => handleVehicleSelect(item.vehicle_id)}
                      disabled={item.status_availability_name !== 'available'}
                    />
                    <span className="ml-2">Select</span>
                  </div>
                )}

                {resourceView === 'equipment' && (
                  <div className="mt-3">
                    <PrimeInputNumber
                      value={equipmentQuantities[item.equipment_id] || 0}
                      onValueChange={(e) => handleEquipmentQuantityChange(item.equipment_id, e.value)}
                      min={0}
                      max={item.equipment_quantity}
                      showButtons
                      className="w-32"
                      disabled={item.status_availability_name !== 'available'}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
    </div>
  </div>
);

// Modify renderBasicInformation to include date selection button and modal
const renderBasicInformation = () => {
  const { Title, Paragraph } = Typography;
  const { TextArea } = Input;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 md:space-y-6"
    >
      <Card className="shadow-lg border-0">
        <div className="p-4 md:p-8">
          <Title level={4} className="mb-6">
            <InfoCircleOutlined className="mr-2" />
            {formData.resourceType === 'venue' ? 'Venue Reservation Details' : 'Vehicle Reservation Details'}
          </Title>

          <Form layout="vertical" className="space-y-4">
            {/* Common field */}

            {formData.resourceType === 'venue' ? (
              // Venue specific fields
              <>
                <Form.Item
                  label="Event Title"
                  required
                >
                  <Input
                    name="eventTitle"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    className="rounded-lg"
                    placeholder="Enter event title"
                  />
                </Form.Item>

                <Form.Item
                  label="Description"
                  required
                >
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="rounded-lg"
                    placeholder="Describe your event"
                  />
                </Form.Item>

                <Form.Item
                  label="Number of Participants"
                  required
                >
                  <InputNumber
                    min={1}
                    name="participants"
                    value={formData.participants}
                    onChange={(value) => handleInputChange({
                      target: { name: 'participants', value }
                    })}
                    className="w-full rounded-lg"
                  />
                </Form.Item>
              </>
            ) : (
              // Vehicle specific fields
              <>
                <Form.Item
                  label="Purpose"
                  required
                >
                  <TextArea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    rows={3}
                    className="rounded-lg"
                    placeholder="Explain the purpose of vehicle reservation"
                  />
                </Form.Item>

                <Form.Item
                  label="Destination"
                  required
                >
                  <Input
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="rounded-lg"
                    placeholder="Enter destination"
                  />
                </Form.Item>

                <Form.Item
                  label="Driver's Name (Optional)"
                >
                  <Input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleInputChange}
                    className="rounded-lg"
                    placeholder="Enter driver's name if known"
                  />
                </Form.Item>

                <Form.Item
                  label="Passengers"
                  required
                >
                  <div className="space-y-3">
                    {formData.passengers.map((passenger, index) => (
                      <div key={passenger.id} className="flex gap-2">
                        <Input
                          value={passenger.name}
                          onChange={(e) => handlePassengerChange(passenger.id, e.target.value)}
                          placeholder={`Passenger ${index + 1}`}
                          className="rounded-lg"
                        />
                        <Button
                          danger
                          onClick={() => handleRemovePassenger(passenger.id)}
                          icon={<FaTimes />}
                        />
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      onClick={handleAddPassenger}
                      icon={<BsPeople />}
                      className="w-full"
                    >
                      Add Passenger
                    </Button>
                  </div>
                </Form.Item>
              </>
            )}

            {/* Date selection section */}
            <Form.Item
              label="Event Date and Time"
              required
            >
              <Button
                type="default"
                icon={<CalendarOutlined />}
                onClick={() => setIsDateModalOpen(true)}
                className="w-full md:w-auto"
              >
                {formData.startDate && formData.endDate ? 
                  `${format(new Date(formData.startDate), 'MMM dd, yyyy')} - ${format(new Date(formData.endDate), 'MMM dd, yyyy')}` :
                  'Select Date and Time'
                }
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>

      {/* Date Selection Modal */}
      <Modal
        title="Select Date and Time"
        visible={isDateModalOpen}
        onCancel={() => setIsDateModalOpen(false)}
        footer={null}
        width={800}
      >
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <DatePicker
                value={formData.startDate ? moment(formData.startDate) : null}
                onChange={(date) => handleDateChange('start', date?.toDate())}
                className="w-full"
                disabledDate={(current) => current && current < moment().startOf('day')}
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <DatePicker
                value={formData.endDate ? moment(formData.endDate) : null}
                onChange={(date) => handleDateChange('end', date?.toDate())}
                className="w-full"
                disabledDate={(current) => {
                  if (!formData.startDate) return true;
                  return current && current < moment(formData.startDate).startOf('day');
                }}
              />
            </div>
          </div>

          <TimeSlotVisualizer
            selectedTime={selectedTime}
            unavailableSlots={unavailableSlots}
            isChecking={timeSlotAvailability.isChecking}
            conflicts={timeSlotAvailability.conflicts}
          />

          {timeSlotAvailability.conflicts.length > 0 && (
            <Alert
              type="warning"
              message="Scheduling Conflicts"
              description={
                <div className="space-y-2">
                  {timeSlotAvailability.conflicts.map((conflict, index) => (
                    <div key={index} className="text-sm">
                      Conflict with: {conflict.reservation_name} ({format(new Date(conflict.reservation_start_date), 'h:mm a')} - {format(new Date(conflict.reservation_end_date), 'h:mm a')})
                    </div>
                  ))}
                </div>
              }
            />
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsDateModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              disabled={!formData.startDate || !formData.endDate || !selectedTime}
              onClick={() => {
                setIsDateModalOpen(false);
                toast.success('Date and time selected successfully');
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

const renderResourceTypeSelection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card 
        className={`cursor-pointer transform transition-all duration-300 hover:scale-105
          ${resourceType === 'venue' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}`}
        onClick={() => {
          setResourceType('venue');
          setFormData(prev => ({ ...prev, resourceType: 'venue' }));
        }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <FaMapMarkerAlt className="text-2xl text-blue-600" />
          </div>
          <h4 className="text-xl font-semibold mb-2">Venue Reservation</h4>
          <p className="text-gray-600">Book a venue for your upcoming event</p>
        </div>
      </Card>

      <Card 
        className={`cursor-pointer transform transition-all duration-300 hover:scale-105
          ${resourceType === 'vehicle' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}`}
        onClick={() => {
          setResourceType('vehicle');
          setFormData(prev => ({ ...prev, resourceType: 'vehicle', venue: '' }));
        }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <FaCar className="text-2xl text-green-600" />
          </div>
          <h4 className="text-xl font-semibold mb-2">Vehicle Reservation</h4>
          <p className="text-gray-600">Reserve a vehicle for transportation</p>
        </div>
      </Card>
    </div>
  </motion.div>
);

// Modify handleAddReservation to handle vehicle-only or venue-only reservations
const handleAddReservation = async (e) => {
  e.preventDefault();

  try {
    const userId = localStorage.getItem('user_id');
    const deptId = localStorage.getItem('department_id');
    const storedName = localStorage.getItem('name'); // Get name from localStorage
    
    if (!userId || !deptId || !storedName) {
      toast.error('User session invalid. Please log in again.');
      return;
    }

    // Validate required fields based on resource type
    if (formData.resourceType === 'venue') {
      if (!formData.venue || !formData.eventTitle || !formData.description || 
          !formData.participants || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required venue reservation fields');
        return;
      }

      // Create the venue reservation payload
      const venuePayload = {
        operation: 'venueReservation',
        user_id: parseInt(userId),
        dept_id: parseInt(deptId),
        venue_id: parseInt(formData.venue),
        form_data: {
          name: storedName, // Use stored name instead of formData.reservationName
          event_title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          participants: formData.participants.toString(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: parseInt(equipId),
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0) // Only include equipment with quantity > 0
        }
      };

      console.log('Submitting venue payload:', venuePayload);

      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        venuePayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);

      if (response.data.status === 'success') {
        toast.success('Venue reservation submitted successfully!');
        setCurrentStep(4);
        resetForm();
      } else {
        throw new Error(response.data.message || 'Failed to submit venue reservation');
      }
    } else {
      // Handle vehicle reservation (existing vehicle code)
      if (!selectedModels || selectedModels.length === 0) {
        toast.error('Please select at least one vehicle');
        return;
      }
      if (!formData.purpose || !formData.destination || 
          !formData.startDate || !formData.endDate || 
          !formData.passengers || formData.passengers.length === 0) {
        toast.error('Please fill in all required vehicle reservation fields');
        return;
      }

      const payload = {
        operation: 'vehicleReservation',
        user_id: parseInt(userId),
        dept_id: parseInt(deptId),
        vehicles: selectedModels.map(id => id.toString()), // Convert to string array
        form_data: {
          name: storedName, // Use stored name instead of formData.reservationName
          purpose: formData.purpose,
          destination: formData.destination,
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          driver_id: formData.driverName || "1", // Default to "1" if not provided
          passengers: formData.passengers.map(p => p.name) // Extract just the names as strings
        }
      };

      console.log('Submitting payload:', payload);

      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);

      if (response.data.status === 'success') {
        toast.success('Reservation submitted successfully!');
        setCurrentStep(4);
        resetForm();
      } else {
        throw new Error(response.data.message || 'Failed to submit reservation');
      }
    }

  } catch (error) {
    console.error('Submission error:', error);
    toast.error(error.message || 'An error occurred while submitting the reservation');
  }
};

// Add this new validation helper function
const validatePayload = (payload) => {
  const missing = [];

  if (!payload.user_id) missing.push('User ID');
  if (!payload.dept_id) missing.push('Department ID');

  if (payload.operation === 'venueReservation') {
    if (!payload.venue_id) missing.push('Venue');
    if (!payload.form_data.name) missing.push('Reservation Name');
    if (!payload.form_data.event_title) missing.push('Event Title');
    if (!payload.form_data.description) missing.push('Description');
    if (!payload.form_data.participants) missing.push('Participants');
    if (!payload.form_data.start_date) missing.push('Start Date');
    if (!payload.form_data.end_date) missing.push('End Date');
    
    // Validate equipment quantities if equipment is present
    if (payload.form_data.equipment && payload.form_data.equipment.length > 0) {
      const invalidEquipment = payload.form_data.equipment.filter(
        item => !item.equipment_id || !item.quantity || item.quantity < 1
      );
      if (invalidEquipment.length > 0) missing.push('Valid Equipment Quantities');
    }
  } else {
    if (!payload.vehicles || payload.vehicles.length === 0) missing.push('Vehicles');
    if (!payload.form_data.name) missing.push('Reservation Name');
    if (!payload.form_data.purpose) missing.push('Purpose');
    if (!payload.form_data.destination) missing.push('Destination');
    if (!payload.form_data.start_date) missing.push('Start Date');
    if (!payload.form_data.end_date) missing.push('End Date');
    if (!payload.form_data.passengers || payload.form_data.passengers.length === 0) missing.push('Passengers');
  }

  return {
    valid: missing.length === 0,
    missing
  };
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
    selectedUserId: localStorage.getItem('user_id') || '',
    selectedUserName: '',
    customStartTime: '',
    customEndTime: ''
  });
  setSelectedModels([]);
  setSelectedEquipment({});
  setCurrentStep(0);
  setSelectedTime(null);
  setTimeSlotAvailability({
    isChecking: false,
    isAvailable: false,
    conflicts: []
  });
  setUnavailableSlots([]);
  setSelectedVenueEquipment({});
  setEquipmentQuantities({});
};

const handleBack = () => {
  if (currentStep > 1) {
    setCurrentStep(currentStep - 1);
  }
};

const renderReviewSection = () => {
  const selectedVenue = venues.find(v => v.ven_id.toString() === formData.venue.toString());
  const selectedVehicleDetails = vehicles.filter(v => selectedModels.includes(v.vehicle_id));
  const storedName = localStorage.getItem('name');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <FaCalendarAlt className="text-green-600" />
              Basic Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
              <div>
                <p className="text-sm text-gray-500">Reservation Name</p>
                <p className="font-medium text-gray-900">{storedName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Resource Type</p>
                <p className="font-medium text-gray-900 capitalize">{formData.resourceType}</p>
              </div>
            </div>
          </div>

          {/* Venue/Vehicle Details */}
          {formData.resourceType === 'venue' ? (
            <div className="space-y-6">
              {/* Venue Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700">Venue Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVenue && (
                      <div className="col-span-full">
                        <img
                          src={selectedVenue.image_url || '/default-venue.jpg'}
                          alt={selectedVenue.ven_name}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <h5 className="font-medium text-lg text-gray-900">{selectedVenue.ven_name}</h5>
                        <p className="text-sm text-gray-600">Capacity: {selectedVenue.ven_occupancy}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Event Title</p>
                      <p className="font-medium text-gray-900">{formData.eventTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Number of Participants</p>
                      <p className="font-medium text-gray-900">{formData.participants}</p>
                    </div>
                    <div className="col-span-full">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="font-medium text-gray-900">{formData.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Section */}
              {Object.keys(selectedVenueEquipment).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-700">Selected Equipment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                      const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
                      if (!equip) return null;
                      return (
                        <div key={equipId} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-4">
                            <img
                              src={`http://localhost/coc/gsd/${equip.equipment_pic}`}
                              alt={equip.equipment_name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.target.src = '/default-equipment.jpg';
                                e.target.onerror = null;
                              }}
                            />
                            <div>
                              <h6 className="font-medium">{equip.equipment_name}</h6>
                              <p className="text-sm text-gray-600">Quantity: {quantity}</p>
                              <p className="text-xs text-gray-500">{equip.equipment_category}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Updated Vehicle section
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700">Vehicle Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Trip Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Purpose</p>
                          <p className="font-medium text-gray-900">{formData.purpose}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Destination</p>
                          <p className="font-medium text-gray-900">{formData.destination}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Driver's Name</p>
                          <p className="font-medium text-gray-900">{formData.driverName || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Selected Vehicles */}
                    <div className="space-y-4">
                      <h5 className="text-md font-medium text-gray-700">Selected Vehicles</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedVehicleDetails.map(vehicle => (
                          <div key={vehicle.vehicle_id} className="bg-white rounded-lg border p-4">
                            <div className="space-y-3">
                              <img
                                src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'}
                                alt={`${vehicle.vehicle_make_name} ${vehicle.vehicle_model_name}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <div>
                                <h6 className="font-medium text-gray-900">
                                  {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                                </h6>
                                <p className="text-sm text-gray-600">License: {vehicle.vehicle_license}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Passengers List */}
                    <div className="space-y-4">
                      <h5 className="text-md font-medium text-gray-700">Passengers</h5>
                      <div className="bg-white rounded-lg border p-4">
                        {formData.passengers.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.passengers.map((passenger, index) => (
                              <div key={passenger.id} className="flex items-center space-x-2">
                                <span className="text-gray-500">{index + 1}.</span>
                                <span className="font-medium">{passenger.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No passengers added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <BsClock className="text-green-600" />
              Schedule Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
              <div>
                <p className="text-sm text-gray-500">Start Date & Time</p>
                <p className="font-medium text-gray-900">
                  {formData.startDate ? format(new Date(formData.startDate), 'PPpp') : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date & Time</p>
                <p className="font-medium text-gray-900">
                  {formData.endDate ? format(new Date(formData.endDate), 'PPpp') : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const handleVehicleSelect = (vehicleId) => {
  setSelectedModels(prevSelected => {
    if (prevSelected.includes(vehicleId)) {
      return prevSelected.filter(id => id !== vehicleId);
    } else {
      return [...prevSelected, vehicleId];
    }
  });
};

const handleEquipmentSelect = (equipId, quantity) => {
  setSelectedEquipment(prev => {
    const newSelected = { ...prev };
    if (quantity === 0 || !quantity) {
      delete newSelected[equipId];
    } else {
      newSelected[equipId] = quantity;
    }
    return newSelected;
  });
};

const handleTimeSlotSelect = (timeSlotId) => {
  if (unavailableSlots.includes(timeSlotId)) {
    toast.error('This time slot is not available');
    return;
  }

  setSelectedTime(timeSlotId);
  const selectedSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!selectedSlot) return;

  const startDate = new Date(formData.startDate);
  const endDate = new Date(formData.startDate); // Use same day for both

  // Set the correct hours
  startDate.setHours(selectedSlot.start, 0, 0, 0);
  endDate.setHours(selectedSlot.end, 0, 0, 0);

  setFormData(prev => ({
    ...prev,
    startDate,
    endDate,
    customStartTime: `${selectedSlot.start}:00`,
    customEndTime: `${selectedSlot.end}:00`
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
  <Result
    status="success"
    title="Successfully Submit Request!"
    subTitle="Your reservation request will be reviewed by GSD staff. You will receive a notification once the status has been updated."
    extra={[
      <Button
        type="primary"
        key="print"
        icon={<PrinterOutlined />}
        onClick={handlePrintRequest}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Print Request
      </Button>,
      <Button
        type="primary"
        key="dashboard"
        onClick={() => navigate('/dashboard')}
        className="bg-green-600 hover:bg-green-700"
      >
        Go Back To Dashboard
      </Button>,
      <Button
        key="create"
        onClick={() => {
          resetForm();
          setCurrentStep(0);
        }}
      >
        Request Again
      </Button>,
    ]}
  />
);

const TimeSlotVisualizer = ({ selectedTime, unavailableSlots, isChecking, conflicts }) => {
  return (
    <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-3 text-sm md:text-base">Select Time Slot</h5>
      {isChecking ? (
        <div className="text-center py-4">
          <i className="pi pi-spin pi-spinner mr-2" />
          <span className="text-gray-600 text-sm">Checking availability...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {timeSlots.map(slot => {
            const isConflicting = conflicts.some(conflict => {
              const conflictStart = new Date(conflict.reservation_start_date);
              const conflictEnd = new Date(conflict.reservation_end_date);
              const conflictStartHour = conflictStart.getHours();
              const conflictEndHour = conflictEnd.getHours();
              
              const [slotStart, slotEnd] = slot.id.split('-').map(time => parseInt(time));
              
              return (conflictStartHour < slotEnd && conflictEndHour > slotStart);
            });
            const isSelected = selectedTime === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => !isConflicting && handleTimeSlotSelect(slot.id)}
                disabled={isConflicting}
                className={`
                  p-4 rounded-lg border transition-all duration-200 relative
                  ${isSelected ? 'border-green-500 bg-green-50 text-green-700' : ''}
                  ${isConflicting 
                    ? 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed' 
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}
                `}
              >
                <div className="text-center">
                  <div className="font-medium">{slot.label}</div>
                  <div className="text-sm">{slot.time}</div>
                  {isConflicting && (
                    <div className="text-xs text-red-500 mt-1">
                      Unavailable
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

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

// Fix the renderCalendarSection
const renderCalendarSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <Card className="shadow-lg border-0">
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Start Date
            </label>
            <Calendar
              value={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(e) => handleDateChange('start', e.value)}
              showTime={false}
              dateFormat="dd/mm/yy"
              minDate={new Date()}
              className="w-full"
              panelClassName="date-panel"
              inline
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              End Date
            </label>
            <Calendar
              value={formData.endDate ? new Date(formData.endDate) : null}
              onChange={(e) => handleDateChange('end', e.value)}
              showTime={false}
              dateFormat="dd/mm/yy"
              minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
              className="w-full"
              panelClassName="date-panel"
              disabled={!formData.startDate}
              inline
            />
          </div>
        </div>

        <TimeSlotVisualizer
          selectedTime={selectedTime}
          unavailableSlots={unavailableSlots}
          isChecking={timeSlotAvailability.isChecking}
          conflicts={timeSlotAvailability.conflicts}
        />
      </div>
    </Card>
  </motion.div>
);

// Update your useEffect to fetch initial availability
useEffect(() => {
  if (formData.venue) {
    const today = new Date();
    fetchDateAvailability(today.getMonth(), today.getFullYear());
  }
}, [formData.venue]);

const fetchDateAvailability = async (month, year) => {
  setIsLoadingAvailability(true);
  try {
    const response = await axios.post(
      'http://localhost/coc/gsd/fetch_reserve.php',
      {
        operation: "fetchMonthlyAvailability",
        month: month + 1, // JavaScript months are 0-based
        year: year,
        venueId: formData.venue || null
      }
    );

    if (response.data.status === 'success') {
      const availability = {};
      response.data.data.forEach(day => {
        availability[day.date] = {
          status: day.slots_available === 0 ? 'full' : 
                 day.slots_available < day.total_slots ? 'partial' : 
                 'available',
          reservations: day.reservations || []
        };
      });
      setDateAvailability(availability);
    }
  } catch (error) {
    console.error('Error fetching availability:', error);
  } finally {
    setIsLoadingAvailability(false);
  }
};

// Add the isSameDay helper function
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Fix the ResourceTimeline component
const ResourceTimeline = ({ resource, bookings }) => {
  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-3">{resource.name}</h5>
      {/* Add your timeline content here */}
    </div>
  );
};

const checkTimeSlotAvailability = async (startDate, endDate) => {
  if (!startDate || !endDate || !formData.venue) return;
  
  setTimeSlotAvailability(prev => ({ ...prev, isChecking: true }));
  
  try {
    const formatDateForAPI = (date) => {
      const d = new Date(date);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    if (isSameDay(startDate, endDate)) {
      startDate.setHours(8, 0, 0);
      endDate.setHours(17, 0, 0);
    }

    const response = await axios.post(
      'http://localhost/coc/gsd/fetch_reserve.php',
      {
        operation: "checkTimeSlotAvailability",
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        venueId: parseInt(formData.venue)
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data) {
      const conflicts = response.data.conflicts || [];
      const unavailableTimeSlots = new Set();

      conflicts.forEach(conflict => {
        const conflictStart = new Date(conflict.reservation_start_date);
        const conflictEnd = new Date(conflict.reservation_end_date);
        
        if (isSameDay(conflictStart, startDate)) {
          const conflictStartHour = conflictStart.getHours();
          const conflictEndHour = conflictEnd.getHours();
          
          // Check individual time slots
          if (conflictStartHour < 10 && conflictEndHour > 8) {
            unavailableTimeSlots.add('08:00-10:00');
          }
          
          if (conflictStartHour < 12 && conflictEndHour > 10) {
            unavailableTimeSlots.add('10:00-12:00');
          }
          
          if (conflictStartHour < 15 && conflictEndHour > 13) {
            unavailableTimeSlots.add('13:00-15:00');
          }
          
          if (conflictStartHour < 17 && conflictEndHour > 15) {
            unavailableTimeSlots.add('15:00-17:00');
          }

          // Check morning slot (8:00-12:00)
          if ((conflictStartHour < 12 && conflictEndHour > 8) &&
              (unavailableTimeSlots.has('08:00-10:00') && unavailableTimeSlots.has('10:00-12:00'))) {
            unavailableTimeSlots.add('08:00-12:00');
          }
          
          // Check afternoon slot (13:00-17:00)
          if ((conflictStartHour < 17 && conflictEndHour > 13) &&
              (unavailableTimeSlots.has('13:00-15:00') && unavailableTimeSlots.has('15:00-17:00'))) {
            unavailableTimeSlots.add('13:00-17:00');
          }
          
          // Check full day slot (8:00-17:00)
          if ((unavailableTimeSlots.has('08:00-12:00') && unavailableTimeSlots.has('13:00-17:00')) ||
              (conflictStartHour <= 8 && conflictEndHour >= 17)) {
            unavailableTimeSlots.add('08:00-17:00');
          }
        }
      });

      setUnavailableSlots([...unavailableTimeSlots]);
      setTimeSlotAvailability({
        isChecking: false,
        isAvailable: response.data.available,
        conflicts: conflicts.filter(conflict => 
          isSameDay(new Date(conflict.reservation_start_date), startDate)
        )
      });
    }

  } catch (error) {
    console.error('Error checking time slot:', error);
    setTimeSlotAvailability({
      isChecking: false,
      isAvailable: false,
      conflicts: []
    });
    toast.error('Unable to verify time slot availability.');
  }
};



// Update the step content rendering to change the order
const renderStepContent = () => {
  const steps = {
    0: renderResourceTypeSelection,
    1: renderBasicInformation,
    2: () => resourceType === 'venue' ? renderVenues() : renderResources(),
    3: renderReviewSection,
    4: renderSuccessState
  };

  return (
    <div className="min-h-[400px]">
      {steps[currentStep] && steps[currentStep]()}
    </div>
  );
};

// Separate date selection into its own component
const renderDateSelection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    {renderCalendarSection()}
  </motion.div>
);

// Update handleDateChange function
const handleDateChange = (type, newDate) => {
  if (!newDate) return; // Guard against null values

  const value = newDate instanceof Date ? newDate : newDate.target?.value;
  
  if (type === 'start') {
    setFormData(prev => {
      const currentEndDate = prev.endDate ? new Date(prev.endDate) : null;
      const newStartDate = new Date(value);
      
      return {
        ...prev,
        startDate: newStartDate,
        // If end date exists and is before new start date, update it
        endDate: currentEndDate && currentEndDate < newStartDate ? newStartDate : currentEndDate
      };
    });

    // Only check availability if we have both dates
    if (value && formData.endDate) {
      checkTimeSlotAvailability(new Date(value), new Date(formData.endDate));
    }
  } else if (type === 'end') {
    setFormData(prev => ({
      ...prev,
      endDate: new Date(value)
    }));

    // Only check availability if we have both dates
    if (formData.startDate && value) {
      checkTimeSlotAvailability(new Date(formData.startDate), new Date(value));
    }
  }
};



const StepIndicator = ({ currentStep }) => (
  <div className="relative">
    <div className="flex justify-between items-center">
      {['Select Type', 'Enter Details', 'Choose Resource', 'Review', 'Complete'].map((step, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className={`
            w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center 
            text-xs md:text-sm font-semibold transition-all duration-300
            ${index === currentStep ? 'bg-blue-600 text-white' :
              index < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
          `}>
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span className="mt-2 text-[10px] md:text-xs text-gray-600 text-center hidden sm:block">
            {step}
          </span>
          {index < 4 && (
            <div className={`h-1 w-full mt-2 
              ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  </div>
);

const handlePrintRequest = () => {
  const printContent = document.createElement('div');
  printContent.innerHTML = `
    <div style="padding: 20px;">
      <h2 style="text-align: center; margin-bottom: 20px;">Reservation Request Details</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Basic Information</h3>
        <p><strong>Reservation Name:</strong> ${formData.reservationName}</p>
        <p><strong>Resource Type:</strong> ${formData.resourceType}</p>
        <p><strong>Date:</strong> ${format(new Date(formData.startDate), 'PPP')} - ${format(new Date(formData.endDate), 'PPP')}</p>
        <p><strong>Time:</strong> ${format(new Date(formData.startDate), 'p')} - ${format(new Date(formData.endDate), 'p')}</p>
      </div>

      ${formData.resourceType === 'venue' ? `
        <div style="margin-bottom: 20px;">
          <h3>Venue Details</h3>
          <p><strong>Event Title:</strong> ${formData.eventTitle}</p>
          <p><strong>Description:</strong> ${formData.description}</p>
          <p><strong>Participants:</strong> ${formData.participants}</p>
          <p><strong>Venue:</strong> ${venues.find(v => v.ven_id.toString() === formData.venue.toString())?.ven_name}</p>
        </div>
      ` : `
        <div style="margin-bottom: 20px;">
          <h3>Vehicle Details</h3>
          <p><strong>Purpose:</strong> ${formData.purpose}</p>
          <p><strong>Destination:</strong> ${formData.destination}</p>
          <p><strong>Driver:</strong> ${formData.driverName || 'Not specified'}</p>
          <p><strong>Passengers:</strong></p>
          <ul>
            ${formData.passengers.map(p => `<li>${p.name}</li>`).join('')}
          </ul>
        </div>
      `}
    </div>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Reservation Request</title>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

return (
  <div className="min-h-screen bg-gray-50">
    {/* Responsive sidebar handling */}
    <div className="hidden md:block">
      {userLevel === '100' && <Sidebar />}
      {userLevel === '1' && <Sidebar1 />}
    </div>

    {/* Main content area - Adjust margins and max-width */}
    <div className="w-full md:ml-50 p-4 transition-all duration-300">
      <div className="max-w-5xl mx-auto"> {/* Reduced max-width from 7xl to 5xl */}
        {/* Responsive header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create Reservation</h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">Fill in the details to make your reservation</p>
        </div>

        {/* Responsive step indicator - Adjust for mobile */}
        <div className="mb-6 overflow-x-auto md:overflow-visible">
          <div className="min-w-[500px] md:min-w-0"> {/* Reduced min-width */}
            <StepIndicator currentStep={currentStep} />
          </div>
        </div>

        {/* Main content card - Adjust padding and width */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-3 md:p-6"> {/* Reduced padding */}
            {/* Content grid - Adjust column layout */}
            <div className="grid grid-cols-1 gap-4">
              {renderStepContent()}
            </div>

            {/* Button layout - Keep at bottom */}
            {currentStep !== 4 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-100">
                <Button
                  label="Previous"
                  icon="pi pi-arrow-left"
                  className="p-button-outlined w-full sm:w-auto"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                />
                {currentStep === 3 ? (
                  <Button
                    label="Submit Request"
                    icon="pi pi-check"
                    className="p-button-success w-full sm:w-auto"
                    onClick={handleAddReservation}
                  />
                ) : (
                  <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    className="p-button-primary w-full sm:w-auto"
                    onClick={handleNext}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <Toaster 
      position="top-center"
      toastOptions={{
        className: 'text-sm md:text-base',
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
  </div>
);
};

export default AddReservation;

