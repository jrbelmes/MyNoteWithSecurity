import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaCar, FaTools, FaTimes, FaSearch, FaCheck, FaCheckCircle, FaInfoCircle, FaQuestion } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';
import { BsCalendarCheck, BsClock, BsPeople, BsFillGridFill, BsList, BsExclamationCircle } from 'react-icons/bs';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { UserOutlined, InfoCircleOutlined, TeamOutlined, FileTextOutlined, PrinterOutlined, DashboardOutlined, PlusOutlined, TagOutlined, BankOutlined, CarOutlined, FormOutlined, FileSearchOutlined, CheckCircleOutlined, CheckCircleFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { DatePicker, TimePicker, Form, Input, InputNumber, Select, Card, Typography, Row, Col, Divider, Radio, Result, Alert, Modal, Empty, Steps, Spin, Tooltip, Badge, Skeleton, Image } from 'antd';
import moment from 'moment';
import { CalendarOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Dialog } from 'primereact/dialog';
import { InputNumber as PrimeInputNumber } from 'primereact/inputnumber';
import ReservationCalendar from './component/reservation_calendar';
import { Button as AntButton } from 'antd';
import { SecureStorage } from '../utils/encryption';

import './StepIndicator.css';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: "easeInOut" }
};

const slideInAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Improved responsive design breakpoints
const mobileBreakpoint = '576px';
const tabletBreakpoint = '768px';

// Enhanced container styles with better spacing
const containerStyles = {
  mobile: {
    padding: '16px',
    margin: '0',
    width: '100%'
  },
  tablet: {
    padding: '20px',
    margin: '0 auto',
    maxWidth: '100%'
  },
  desktop: {
    padding: '32px',
    maxWidth: '1280px',
    margin: '0 auto'
  }
};

// Improved card styles with subtle shadows and rounded corners
const cardStyles = {
  mobile: {
    padding: '16px',
    margin: '12px 0',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
  },
  tablet: {
    padding: '20px',
    margin: '16px 0',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
  },
  desktop: {
    padding: '24px',
    margin: '20px 0',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
  }
};

// New color scheme for a more professional look
const colors = {
  primary: '#1890ff',
  secondary: '#722ed1',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  background: {
    light: '#f5f8fa',
    card: '#ffffff'
  },
  text: {
    primary: '#262626',
    secondary: '#595959',
    muted: '#8c8c8c'
  }
};

// Add common image handling function to be used across the component
const ImageWithFallback = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  const fallbackSrc = "/no-image-placeholder.png";
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {hasError ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded-lg">
          <FaQuestion className="text-gray-400 text-2xl mb-2" />
          <span className="text-xs text-gray-500">Image not available</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
          onError={() => setHasError(true)}
          preview={!hasError}
          fallback={fallbackSrc}
        />
      )}
    </div>
  );
};

const AddReservation = () => {
  const [deptId] = useState(localStorage.getItem('dept_id') || '');
  const [storedName] = useState(localStorage.getItem('name') || '');
  const [driverType, setDriverType] = useState('default'); // Add state for driver type

  // Helper function for formatting date ranges
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Not specified';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date) => {
      return format(date, 'MMM dd, yyyy');
    };
    
    const formatTime = (date) => {
      return format(date, 'h:mm a');
    };
    
    if (formatDate(start) === formatDate(end)) {
      // Same day
      return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
    } else {
      // Different days
      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    }
  };

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
  
  // Add this state declaration for driver department selection
  const [selectedDriverDept, setSelectedDriverDept] = useState('current');

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
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
    passengers: [], 
    driverType: 'default', // Add driver type to form data
    driverName: '',
    tripTicketDriver: null, // Add trip ticket driver field
  });



  const [viewMode, setViewMode] = useState('grid');

  // Add these two new state declarations
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Add this state declaration
  const [showUserModal, setShowUserModal] = useState(false);

  // Add responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 375);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add these new functions
const handleAddPassenger = (passengerName) => {
  setFormData(prev => ({
    ...prev,
    passengers: [
      ...prev.passengers,
      { id: Date.now(), name: passengerName }
    ]
  }));
};

const handleRemovePassenger = (passengerId) => {
  setFormData(prev => ({
    ...prev,
    passengers: prev.passengers.filter(p => p.id !== passengerId)
  }));
};


const handleEquipmentQuantityChange = (equipId, value) => {
  const numericValue = parseInt(value) || 0;
  
  const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
  if (!equip) {
    toast.error('Equipment not found');
    return;
  }

  const availableQuantity = parseInt(equip.available_quantity) || 0;



  if (numericValue > availableQuantity) {
    toast.error(`Only ${availableQuantity} units available for this equipment`);
    return;
  }

  // Update equipment quantities
  setEquipmentQuantities(prev => ({
    ...prev,
    [equipId]: numericValue
  }));

  // Automatically update selected equipment
  // If quantity is 0 or empty, remove from selection
  // If quantity is > 0, add/update selection
  setSelectedVenueEquipment(prev => {
    const newSelection = { ...prev };
    if (numericValue <= 0) {
      delete newSelection[equipId];
    } else {
      newSelection[equipId] = numericValue;
    }
    return newSelection;
  });
};

// No need for separate handleAddEquipment since selection is handled in handleEquipmentQuantityChange
const handleAddEquipment = () => {
  setShowEquipmentModal(false);
};

const fetchAllEquipments = async () => {
  try {
    const response = await axios.post(
      'http://localhost/coc/gsd/fetch2.php',
      {
        operation: 'fetchEquipments'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status === 'success') {
      const formattedEquipment = response.data.data.map(item => {
        // Parse quantities properly
        const totalQuantity = parseInt(item.equip_quantity) || 0;
        const reservedQuantity = parseInt(item.reserved_quantity) || 0;
        // Calculate available quantity properly
        const availableQuantity = Math.max(0, totalQuantity - reservedQuantity);
        
        return {
          equipment_id: item.equip_id,
          equipment_name: item.equip_name,
          equipment_quantity: totalQuantity,
          equipment_category: item.equipments_category_name || 'Uncategorized',
          equipment_category_id: item.equipments_category_id,
          equipment_pic: item.equip_pic,
          status_availability_name: availableQuantity > 0 ? 'available' : 'unavailable',
          reserved_quantity: reservedQuantity,
          equip_quantity: totalQuantity,
          available_quantity: availableQuantity
        };
      });

      setEquipment(formattedEquipment);
    } else {
      toast.error("Error fetching all equipment: " + response.data.message);
    }
  } catch (error) {
    console.error("Error fetching all equipment:", error);
    toast.error("An error occurred while fetching all equipment.");
  }
};
useEffect(() => {
  if (resourceType === 'equipment') {
    fetchAllEquipments();
  }
}, [resourceType]);

  useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (encryptedUserLevel !== '3' && encryptedUserLevel !== '15') {
              localStorage.clear();
              navigate('/gsd');
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
          'Content-Type': 'application/json'
        },
        data: {
          operation: 'fetchVenue'
        }
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
        'Content-Type': 'application/json'
      },
      data: {
        operation: 'fetchVehicles'
      }
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
  // Only fetch equipment if we have both start and end dates
  if (!formData.startDate || !formData.endDate) return;

  try {
    // Convert dates to required format
    const startDateTime = format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss');
    const endDateTime = format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss');

    // Log the request payload for debugging
    console.log('Equipment fetch payload:', {
      operation: 'fetchEquipments',
      startDateTime,
      endDateTime
    });

   const response = await axios({
      method: 'post',
      url: 'http://localhost/coc/gsd/fetch2.php',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        operation: 'fetchEquipments',
        startDateTime: startDateTime,
        endDateTime: endDateTime
      }
    });

    // Log the response for debugging
    console.log('Equipment fetch response:', response.data);

    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      const formattedEquipment = response.data.data.map(item => ({
        equipment_id: item.equip_id,
        equipment_name: item.equip_name,
        equipment_quantity: parseInt(item.equip_quantity) || 0,
        equipment_category: item.equipments_category_name || 'Uncategorized',
        equipment_pic: item.equip_pic,
        status_availability_name: item.status_availability_name || 'unavailable',
        reserved_quantity: parseInt(item.reserved_quantity || 0),
        available_quantity: parseInt(item.equip_quantity || 0) - parseInt(item.reserved_quantity || 0)
      }));
      
      setEquipment(formattedEquipment);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error("Error fetching equipment:", error);
    toast.error("An error occurred while fetching equipment.");
  }
};
  
  // Update useEffect to call fetchEquipment when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      fetchEquipment();
    }
  }, [formData.startDate, formData.endDate]);
  

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



const handleNext = async () => {
  if (!validateCurrentStep()) {
    return;
  }

  // For equipment selection, ensure the state is updated before moving to review
  if (currentStep === 3 && formData.resourceType === 'venue') {
    // First update the equipment state
    const newEquipment = {};
    Object.entries(equipmentQuantities).forEach(([equipId, quantity]) => {
      if (quantity > 0) {
        newEquipment[equipId.toString()] = quantity;
      }
    });
    
    // Update the selected equipment state
    setSelectedVenueEquipment(newEquipment);
    
    // Use a callback to ensure state is updated before moving to next step
    setTimeout(() => {
      setCurrentStep(4);
    }, 0);
    return;
  }

  if (currentStep === 4) { // Review step
    const success = await handleAddReservation();
    if (success) {
      setCurrentStep(5); // Move to success state
      resetForm(); // Optional: reset form after successful submission
    }
    return;
  }

  setCurrentStep(prev => prev + 1);
};

// Update validateCurrentStep to check for complete date/time selection
const validateCurrentStep = () => {
  switch (currentStep) {
    case 0:
      if (!formData.resourceType) {
        toast.error('Please select a resource type (Venue, Vehicle, or Equipment)');
        return false;
      }
      return true;

    case 1:
      if (formData.resourceType === 'venue' && !formData.venue) {
        toast.error('Please select a venue');
        return false;
      }
      if (formData.resourceType === 'vehicle' && selectedModels.length === 0) {
        toast.error('Please select at least one vehicle');
        return false;
      }
      if (formData.resourceType === 'equipment' && Object.keys(equipmentQuantities).length === 0) {
        toast.error('Please select at least one equipment item');
        return false;
      }
      return true;

    case 2: // Calendar step
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please select both start and end date/time');
        return false;
      }
      
      // Validate business hours (8 AM - 5 PM)
      const startHour = formData.startDate.getHours();
      const endHour = formData.endDate.getHours();
      if (startHour < 5 || startHour > 20 || endHour < 5 || endHour > 20) {
        toast.error('Please select times between 8 AM and 5 PM');
        return false;
      }

      // Validate that end time is after start time
      if (formData.endDate <= formData.startDate) {
        toast.error('End time must be after start time');
        return false;
      }
      
      return true;

    case 3:
      if (formData.resourceType === 'venue') {
        if (!formData.eventTitle || !formData.eventTitle.trim()) {
          toast.error('Please enter an event title');
          return false;
        }
        if (!formData.description || !formData.description.trim()) {
          toast.error('Please enter a description');
          return false;
        }
        return true;
      } else if (formData.resourceType === 'equipment') {
        if (!formData.eventTitle || !formData.eventTitle.trim()) {
          toast.error('Please enter a title for your equipment request');
          return false;
        }
        if (!formData.description || !formData.description.trim()) {
          toast.error('Please enter a description for your equipment request');
          return false;
        }
        return true;
      } else { // Vehicle validation
        if (!formData.purpose || !formData.purpose.trim()) {
          toast.error('Please enter a purpose');
          return false;
        }
        if (!formData.destination || !formData.destination.trim()) {
          toast.error('Please enter a destination');
          return false;
        }
        
        if (!formData.passengers || formData.passengers.length === 0) {
          toast.error('Please add at least one passenger');
          return false;
        }
        return true;
      }

    default:
      return true;
  }
};

const handleBack = () => {
  if (currentStep > 0) {
    setCurrentStep(prev => prev - 1);
  }
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
    className="space-y-2"
  >
    {/* Compact header */}
    <div className="flex justify-between items-center px-2 mb-2">
      <h3 className="font-medium text-sm sm:text-base truncate flex-1">
        {formData.venue 
          ? venues.find(v => v.ven_id === formData.venue)?.ven_name
          : 'Select Venue'}
      </h3>
      <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-md ml-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1 rounded ${
            viewMode === 'grid' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600'
          }`}
        >
          <BsFillGridFill size={14} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1 rounded ${
            viewMode === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600'
          }`}
        >
          <BsList size={14} />
        </button>
      </div>
    </div>

    {/* Responsive grid/list container */}
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        : 'space-y-2'
      }
    `}>
      {venues.map((venue) => (
        <Card
          key={venue.ven_id}
          className={`
            cursor-pointer
            ${viewMode === 'list' ? 'flex' : ''}
            ${formData.venue === venue.ven_id ? 'ring-1 ring-green-500' : ''}
            p-1.5 hover:shadow-md transition-shadow
          `}
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              venue: venue.ven_id
            }));
          }}
        >
          <div className={`
            ${viewMode === 'list' ? 'flex items-center gap-2' : ''}
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {/* Optimized image size */}
            <div className={viewMode === 'list' ? 'w-16 flex-shrink-0' : ''}>
              <img
                src={venue.ven_pic ? `http://localhost/coc/gsd/${venue.ven_pic}` : '/default-venue.jpg'}
                alt={venue.ven_name}
                className={`
                  object-cover rounded
                  ${viewMode === 'grid' ? 'w-full h-20 sm:h-24' : 'h-16 w-16'}
                `}
                onError={(e) => {
                  e.target.src = '/default-venue.jpg';
                  e.target.onerror = null;
                }}
              />
            </div>

            {/* Compact content */}
            <div className={`
              ${viewMode === 'list' ? 'flex-1 min-w-0' : 'mt-1.5'}
              ${isMobile ? 'space-y-0.5' : 'space-y-1'}
            `}>
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-medium text-gray-800 truncate flex-1 text-xs sm:text-sm">
                  {venue.ven_name}
                </h3>
                <Tag
                  severity={venue.status_availability_name === 'available' ? 'success' : 'danger'}
                  value={venue.status_availability_name}
                  className="text-[10px] px-1 py-0.5"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-gray-600">
                <div className="flex items-center gap-0.5">
                  <i className="pi pi-users text-[10px]" />
                  <span>{venue.ven_occupancy}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <i className="pi pi-clock text-[10px]" />
                  <span>8-5</span>
                </div>
              </div>

              {formData.venue === venue.ven_id && (
                <div className="flex items-center gap-0.5 text-green-600 text-[10px]">
                  <i className="pi pi-check" />
                  <span>Selected</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  </motion.div>
);


// Modify renderResources to only show vehicles without equipment options
const renderResources = () => (
  <div className="space-y-4">
    {/* Header section with responsive controls */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-2 sm:p-4 rounded-lg shadow-sm">
      {/* Title with responsive font size */}
      <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
        {selectedModels.length > 0 ? `Vehicles (${selectedModels.length})` : 'Select Vehicle'}
      </h3>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Category filter - Full width on mobile */}
        <Dropdown
          value={selectedCategory}
          options={[
            { label: 'All Categories', value: 'all' },
            ...vehicleCategories.map(cat => ({ 
              label: cat.name, 
              value: cat.id 
            }))
          ]}
          onChange={(e) => setSelectedCategory(e.value)}
          className="w-full sm:w-[200px]"
          placeholder="Category"
        />

        {/* Compact view toggle */}
        <div className="flex bg-gray-100 p-0.5 rounded-md ml-auto sm:ml-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-md ${
              viewMode === 'grid' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            <BsFillGridFill size={12} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded-md ${
              viewMode === 'list' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            <BsList size={12} />
          </button>
        </div>
      </div>
    </div>

    {/* Vehicles grid/list with responsive layout */}
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'
        : 'space-y-2'}
    `}>
      {vehicles
        .filter(vehicle => selectedCategory === 'all' || vehicle.vehicle_category_id === selectedCategory)
        .map((vehicle) => (
          <Card
            key={vehicle.vehicle_id}
            className={`
              ${viewMode === 'list' ? 'flex' : ''}
              transition-all duration-200
              cursor-pointer
              ${selectedModels.includes(vehicle.vehicle_id) 
                ? 'ring-1 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md hover:border-blue-200'}
              p-2
            `}
            onClick={() => handleVehicleSelect(vehicle.vehicle_id)}
          >
            <div className={`
              ${viewMode === 'list' ? 'flex items-center w-full gap-2' : ''}
            `}>
              {/* Responsive image container */}
              <div className={viewMode === 'list' ? 'w-20 sm:w-32 flex-shrink-0' : ''}>
                <img
                  src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'}
                  alt={`${vehicle.vehicle_make_name} ${vehicle.vehicle_model_name}`}
                  className={`
                    object-cover rounded-lg
                    ${viewMode === 'grid' 
                      ? 'w-full h-20 sm:h-32' 
                      : 'h-16 sm:h-24 w-full'}
                  `}
                  onError={(e) => {
                    e.target.src = '/default-vehicle.jpg';
                    e.target.onerror = null;
                  }}
                />
              </div>

              {/* Content with minimized info on mobile */}
              <div className={`
                ${viewMode === 'list' 
                  ? 'flex-grow flex justify-between items-start' 
                  : 'mt-2'}
                p-1
              `}>
                <div className="space-y-1 w-full">
                  {/* Vehicle title - Truncated on mobile */}
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">
                    {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                  </h3>
                  
                  {/* License and availability status */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <CarOutlined className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-600 truncate">
                        {vehicle.vehicle_license}
                      </span>
                    </div>
                    <Tag
                      severity={vehicle.status_availability_name === 'available' ? 'success' : 'danger'}
                      value={vehicle.status_availability_name}
                      className="text-[10px] px-1 py-0"
                    />
                  </div>

                  {/* Capacity - Hidden on mobile grid view */}
                  <div className={`
                    flex items-center gap-1
                    ${viewMode === 'grid' && window.innerWidth <= 375 ? 'hidden' : 'block'}
                  `}>
                    <BsPeople className="text-gray-400 text-xs" />
                    <span className="text-xs text-gray-600">
                      {vehicle.vehicle_capacity || 'N/A'}
                    </span>
                  </div>

                  {/* Selection indicator - Minimal on mobile */}
                  {selectedModels.includes(vehicle.vehicle_id) && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <CheckCircleOutlined className="text-xs" />
                      <span className="text-xs">Selected</span>
                    </div>
                  )}
                </div>

                {/* Checkbox - Only in list view */}
                {viewMode === 'list' && (
                  <Checkbox
                    checked={selectedModels.includes(vehicle.vehicle_id)}
                    onChange={() => {}}
                    className="ml-2"
                    disabled={vehicle.status_availability_name !== 'available'}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
    </div>

    {/* Empty state - Compact on mobile */}
    {vehicles.filter(vehicle => 
      selectedCategory === 'all' || vehicle.vehicle_category_id === selectedCategory
    ).length === 0 && (
      <Empty
        description={
          <span className="text-xs sm:text-sm text-gray-500">No vehicles found</span>
        }
        className="bg-white p-3 sm:p-6 rounded-lg"
      />
    )}
  </div>
);

// Modify renderBasicInformation to include date selection button and modal
const renderBasicInformation = () => {
  const { TextArea } = Input;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Card className="shadow-sm border-0">
        <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
          {/* Compact Header */}
          <Title level={isMobile ? 5 : 4} className="mb-4 flex items-center gap-2">
            <InfoCircleOutlined />
            <span className="truncate">
              {formData.resourceType === 'venue' ? 'Venue Details' : 
               formData.resourceType === 'vehicle' ? 'Vehicle Details' : 
               'Equipment Details'}
            </span>
          </Title>

          <Form layout="vertical" className="space-y-3">
            {formData.resourceType === 'venue' ? (
              // Venue Fields
              <>
                <Form.Item
                  label={<span className="text-sm">Event Title <span className="text-red-500">*</span></span>}
                  required
                >
                  <Input
                    name="eventTitle"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Event title"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Description <span className="text-red-500">*</span></span>}
                  required
                >
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={isMobile ? 3 : 4}
                    className="rounded"
                    placeholder="Event description"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Number of Participants</span>}
                >
                  <Input
                    name="participants"
                    value={formData.participants}
                    onChange={handleInputChange}
                    type="number"
                    min="0"
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Enter number of participants (optional)"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Equipment</span>
                      <Button
                        type="text"
                        onClick={() => setShowEquipmentModal(true)}
                        icon={<FaTools />}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Add Equipment
                      </Button>
                    </div>
                  }
                >
                  {Object.keys(selectedVenueEquipment).length > 0 ? (
                    <div className="border rounded-lg divide-y">
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
                        if (!equip) return null;
                        return (
                          <div key={equipId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <FaTools className="text-gray-400" />
                              <span>{equip.equipment_name}</span>
                              <span className="text-gray-500">x{quantity}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-500">
                          No equipment added yet. Click "Add Equipment" to begin.
                        </span>
                      }
                    />
                  )}
                </Form.Item>
              </>
            ) : formData.resourceType === 'vehicle' ? (
                // Vehicle Fields
                <>
                <Form.Item
                  label={<span className="text-sm">Purpose <span className="text-red-500">*</span></span>}
                  required
                >
                  <TextArea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    rows={isMobile ? 2 : 3}
                    className="rounded"
                    placeholder="Trip purpose"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Destination <span className="text-red-500">*</span></span>}
                  required
                >
                  <Input
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Trip destination"
                  />
                </Form.Item>

                {renderDriverDropdown()}

                <Form.Item
                  label={
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Passengers <span className="text-red-500">*</span></span>
                      <Button
                        type="text"
                        onClick={() => setShowPassengerModal(true)}
                        icon={<PlusOutlined />}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Add Passenger
                      </Button>
                    </div>
                  }
                  required
                >
                  {formData.passengers.length > 0 ? (
                    <div className="border rounded-lg divide-y">
                      {formData.passengers.map((passenger, index) => (
                        <div key={passenger.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{index + 1}.</span>
                            <UserOutlined className="text-gray-400" />
                            <span>{passenger.name}</span>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<FaTimes />}
                            onClick={() => handleRemovePassenger(passenger.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-500">
                          No passengers added yet. Click "Add Passenger" to begin.
                        </span>
                      }
                    />
                  )}
                </Form.Item>

                {/* Add Equipment Button for Vehicle */}
                <Form.Item
                  label={
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Equipment</span>
                      <Button
                        type="text"
                        onClick={() => setShowEquipmentModal(true)}
                        icon={<FaTools />}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Add Equipment
                      </Button>
                    </div>
                  }
                >
                  {Object.keys(selectedVenueEquipment).length > 0 ? (
                    <div className="border rounded-lg divide-y">
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment.find(e => e.equipment_id.toString() === equipId);
                        if (!equip) return null;
                        return (
                          <div key={equipId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <FaTools className="text-gray-400" />
                              <span>{equip.equipment_name}</span>
                              <span className="text-gray-500">x{quantity}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-500">
                          No equipment added yet. Click "Add Equipment" to begin.
                        </span>
                      }
                    />
                  )}
                </Form.Item>
                </>
              ) : (
              // Equipment Fields - Only title and description
              <>
                <Form.Item
                  label={<span className="text-sm">Title <span className="text-red-500">*</span></span>}
                  required
                >
                  <Input
                    name="eventTitle"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Purpose of equipment request"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Description <span className="text-red-500">*</span></span>}
                  required
                >
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={isMobile ? 3 : 4}
                    className="rounded"
                    placeholder="Describe how you will use the equipment"
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </div>
      </Card>
      {(formData.resourceType === 'venue' || formData.resourceType === 'vehicle') && <EquipmentSelectionModal />}
    </motion.div>
  );
};

// Enhanced resource type selection with better visuals
const renderResourceTypeSelection = () => (
  <motion.div
    {...fadeInAnimation}
    className="py-4"
  >
    <Card className="shadow-sm rounded-xl border-0">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">What would you like to reserve?</h2>
        <p className="text-gray-500">Select the type of resource you need for your reservation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {[
          { 
            value: 'venue', 
            title: 'Venue', 
            icon: <BankOutlined className="text-4xl mb-3" />,
            description: 'Conference rooms, halls, or other spaces for events and meetings',
            color: '#1890ff'
          },
          { 
            value: 'vehicle', 
            title: 'Vehicle', 
            icon: <CarOutlined className="text-4xl mb-3" />,
            description: 'Cars, vans, or other transportation for official travel',
            color: '#722ed1'
          },
          { 
            value: 'equipment', 
            title: 'Equipment', 
            icon: <FaTools className="text-4xl mb-3" />,
            description: 'Projectors, laptops, audio systems, and other equipment',
            color: '#13c2c2'
          }
        ].map(option => (
          <Card
            key={option.value}
            className={`
              hover:shadow-md transition-all duration-200 text-center cursor-pointer
              ${resourceType === option.value ? 'border-2 border-blue-500 shadow-sm' : 'border border-gray-100'}
            `}
            onClick={() => {
              setResourceType(option.value);
              setFormData(prev => ({ ...prev, resourceType: option.value }));
            }}
            style={{ borderRadius: '12px' }}
          >
            <div 
              className="flex flex-col items-center justify-center h-full p-6"
              style={{ 
                color: resourceType === option.value ? option.color : 'inherit',
              }}
            >
              {option.icon}
              <h3 className="text-lg font-medium mb-2">{option.title}</h3>
              <p className="text-gray-500 text-sm">{option.description}</p>
              
              {resourceType === option.value && (
                <Tag color="blue" className="mt-3">
                  <div className="flex items-center gap-1">
                    <FaCheckCircle />
                    <span>Selected</span>
                  </div>
                </Tag>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <BsExclamationCircle className="inline mr-2" />
        Your selection will determine the next steps in the reservation process
      </div>
    </Card>
  </motion.div>
);

const validateEquipmentQuantities = (equipment) => {
  if (!equipment || equipment.length === 0) return false;
  return equipment.every(item => item.quantity > 0);
};

const handleAddReservation = async () => {
  try {
    setLoading(true);
    const userId = SecureStorage.getSessionItem('user_id');

    // Common validation for dates
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return false;
    }

    // Resource type specific validation and submission
    if (formData.resourceType === 'venue') {
      if (!formData.eventTitle || !formData.description || !formData.venue) {
        toast.error('Please fill in all required venue reservation fields');
        return false;
      }

      const venuePayload = {
        operation: 'venuereservation',
        form_data: {
          title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          participants: formData.participants ? formData.participants.toString() : "0",
          user_id: userId,
          venues: [formData.venue],
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0)
        }
      };

      // Proceed with venue reservation
      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        venuePayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Venue reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit venue reservation');
      }

    } else if (formData.resourceType === 'vehicle') {
      if (!selectedModels || selectedModels.length === 0) {
        toast.error('Please select at least one vehicle');
        return false;
      }
      if (!formData.purpose || !formData.destination) {
        toast.error('Please fill in both purpose and destination');
        return false;
      }
      if (!formData.passengers || formData.passengers.length === 0) {
        toast.error('Please add at least one passenger');
        return false;
      }

      const vehiclePayload = {
        operation: 'vehiclereservation',
        form_data: {
          destination: formData.destination.trim(),
          purpose: formData.purpose.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          vehicles: selectedModels,
          passengers: formData.passengers.map(p => p.name.trim()),
          driver_id: formData.driverName || null,
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0)
        }
      };

      // Proceed with vehicle reservation
      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        vehiclePayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Vehicle reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit vehicle reservation');
      }

    } else if (formData.resourceType === 'equipment') {
      // Equipment specific validation
      if (!formData.eventTitle || !formData.description) {
        toast.error('Please fill in all required equipment reservation fields');
        return false;
      }

      // Check if any equipment is selected for equipment reservation
      if (Object.keys(selectedVenueEquipment).length === 0) {
        toast.error('Please select at least one equipment item');
        return false;
      }

      const equipmentPayload = {
        operation: 'equipmentreservation',
        form_data: {
          title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: equipId,
            quantity: parseInt(quantity)
          })).filter(item => item.quantity > 0)
        }
      };

      // Proceed with equipment reservation
      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        equipmentPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Equipment reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit equipment reservation');
      }
    }
  } catch (error) {
    console.error('Submission error:', error);
    toast.error(error.message || 'An error occurred while submitting the reservation');
    return false;
  } finally {
    setLoading(false);
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
    resourceType: '',
    startDate: null,
    endDate: null,
    selectedTime: null,
    eventTitle: '',
    description: '',
    participants: '',
    venue: '',
    purpose: '',
    destination: '',
    passengers: [], // Reset passengers to empty array
    driverName: '',
    driverType: 'default', // Reset driver type to default
    tripTicketDriver: null, // Reset trip ticket driver
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



const renderReviewSection = () => {
  const selectedVenues = venues.filter(v => formData.venue.includes(v.ven_id));
  const selectedVehicleDetails = vehicles.filter(v => selectedModels.includes(v.vehicle_id));
  const storedName = localStorage.getItem('name');
  const selectedDriver = drivers.find(d => d.driver_id.toString() === formData.driverName?.toString());

  return (
    <motion.div
      {...fadeInAnimation}
      className="space-y-6"
    >
      <Alert
        message="Review Your Reservation"
        description="Please review all details carefully before submitting. You won't be able to modify them after submission."
        type="info"
        showIcon
        className="mb-6"
      />
      
      <Card className="rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0">Reservation Summary</Title>
          <AntButton 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrintRequest}
            className="bg-blue-500"
          >
            Print Preview
          </AntButton>
        </div>
        
        <Divider className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Resource Type */}
          <div>
            <div className="text-gray-500 text-sm mb-1">Resource Type</div>
            <div className="font-medium flex items-center">
              {formData.resourceType === 'venue' ? (
                <><BankOutlined className="mr-2" /> Venue</>
              ) : formData.resourceType === 'vehicle' ? (
                <><CarOutlined className="mr-2" /> Vehicle</>
              ) : (
                <><FaTools className="mr-2" /> Equipment</>
              )}
            </div>
          </div>
          
          {/* Date/Time */}
          <div>
            <div className="text-gray-500 text-sm mb-1">Date & Time</div>
            <div className="font-medium">
              {formatDateRange(formData.startDate, formData.endDate)}
            </div>
          </div>
          
          {/* Resource specific details */}
          {formData.resourceType === 'venue' ? (
            // Venue Details - Minimized for mobile
            <div className="space-y-4">
              <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700`}>
                Selected Venues ({selectedVenues.length})
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {selectedVenues.map(venue => (
                    <div key={venue.ven_id} className="bg-white rounded-lg p-3">
                      <div className="space-y-3">
                        <img
                          src={venue.image_url || '/default-venue.jpg'}
                          alt={venue.ven_name}
                          className={`w-full ${isMobile ? 'h-32' : 'h-48'} object-cover rounded-lg`}
                        />
                        <div className={isMobile ? 'text-sm' : ''}>
                          <h5 className="font-medium">{venue.ven_name}</h5>
                          <p className="text-xs text-gray-600">Capacity: {venue.ven_occupancy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} mt-3`}>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Event</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {formData.eventTitle}
                    </p>
                  </div>
                  {!isMobile && (
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="font-medium">{formData.participants}</p>
                    </div>
                  )}
                </div>

                {/* Equipment Section - Collapsed on mobile */}
                {Object.keys(selectedVenueEquipment).length > 0 && (
                  <div className="mt-4">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Equipment</p>
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
                        if (!equip) return null;
                        return (
                          <div key={equipId} className="flex items-center gap-2 bg-white p-2 rounded">
                            <img
                              src={`http://localhost/coc/gsd/${equip.equipment_pic}`}
                              alt={equip.equipment_name}
                              className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} object-cover rounded`}
                              onError={(e) => { e.target.src = '/default-equipment.jpg'; }}
                            />
                            <div className={isMobile ? 'text-xs' : 'text-sm'}>
                              <p className="font-medium truncate">{equip.equipment_name}</p>
                              <p className="text-gray-500">Qty: {quantity}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : formData.resourceType === 'vehicle' ? (
            // Vehicle Details - Minimized for mobile
            <div className="space-y-4">
              <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700`}>
                Vehicle Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                {/* Trip Info - Minimized */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Purpose</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {formData.purpose}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {availableDrivers.find(d => d.driver_id === formData.driverName)?.driver_full_name || '-'}
                    </p>
                  </div>
                </div>

                {/* Vehicles - Compact grid */}
                <div className="mt-4">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Vehicles</p>
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                    {selectedVehicleDetails.map(vehicle => (
                      <div key={vehicle.vehicle_id} className="bg-white rounded p-2 flex gap-2">
                        <img
                          src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'}
                          alt={vehicle.vehicle_model_name}
                          className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover rounded`}
                        />
                        <div className={isMobile ? 'text-xs' : 'text-sm'}>
                          <p className="font-medium">{vehicle.vehicle_model_name}</p>
                          <p className="text-gray-500">{vehicle.vehicle_license}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passengers - Compact list */}
                <div className="mt-4">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>
                    Passengers ({formData.passengers.length})
                  </p>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} bg-white rounded p-2`}>
                    {formData.passengers.length > 0 ? (
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                        {formData.passengers.map((passenger, index) => (
                          <div key={passenger.id} className="flex items-center gap-1">
                            <span className="text-gray-500">{index + 1}.</span>
                            <span className="truncate">{passenger.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No passengers</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Equipment Details
            <div className="space-y-4">
              <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700`}>
                Selected Equipment Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                {/* Equipment Info */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Purpose</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {formData.eventTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {formData.description}
                    </p>
                  </div>
                </div>

                {/* Selected Equipment List */}
                <div className="mt-4">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Equipment List</p>
                  {Object.keys(selectedVenueEquipment).length > 0 ? (
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment.find(e => e.equipment_id.toString() === equipId);
                        if (!equip) return null;
                        return (
                          <div key={equipId} className="bg-white rounded p-2 flex gap-2">
                            <img
                              src={equip.equipment_pic ? `http://localhost/coc/gsd/${equip.equipment_pic}` : '/default-equipment.jpg'}
                              alt={equip.equipment_name}
                              className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover rounded`}
                              onError={(e) => { e.target.src = '/default-equipment.jpg'; }}
                            />
                            <div className={isMobile ? 'text-xs' : 'text-sm'}>
                              <p className="font-medium">{equip.equipment_name}</p>
                              <p className="text-gray-500">Quantity: {quantity}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white rounded-lg">
                      <FaTools className="mx-auto text-gray-400 text-2xl mb-2" />
                      <p className="text-gray-500">No equipment has been selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Divider className="my-4" />
        
        <div className="flex justify-between mt-4">
          <AntButton 
            onClick={handleBack}
            icon={<FaTimes className="mr-1" />}
          >
            Back
          </AntButton>
          <AntButton 
            type="primary" 
            onClick={handleAddReservation}
            loading={loading}
            icon={<FaCheckCircle className="mr-1" />}
            className="bg-blue-500"
          >
            Confirm Reservation
          </AntButton>
        </div>
      </Card>
    </motion.div>
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

// Enhanced success state with better visuals
const renderSuccessState = () => (
  <motion.div
    {...fadeInAnimation}
    className="min-h-[400px] flex items-center justify-center"
  >
    <Result
      status="success"
      title="Reservation Successfully Created!"
      subTitle="Your reservation has been submitted and is pending approval. You'll receive a notification once it's approved."
      extra={[
        <AntButton 
          type="primary" 
          key="dashboard"
          onClick={() => navigate('/dean/reservation')}
          icon={<DashboardOutlined />}
          className="bg-blue-500"
        >
          View All Reservations
        </AntButton>,
        <AntButton 
          key="new" 
          onClick={resetForm}
          icon={<PlusOutlined />}
        >
          Create Another Reservation
        </AntButton>,
      ]}
    />
  </motion.div>
);



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

// Enhanced calendar section with improved date handling
const renderCalendarSection = () => (
  <Card 
    className="rounded-xl shadow-sm"
    title={
      <div className="flex items-center gap-2">
        <CalendarOutlined className="text-blue-500" />
        <span className="font-medium">Select Date & Time</span>
      </div>
    }
  >
    <Alert
      message="Scheduling Guidelines"
      description="Select the exact date and time for your reservation. The system will check availability in real-time."
      type="info"
      showIcon
      className="mb-4"
    />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Form.Item 
          label={
            <div className="flex items-center">
              <span className="text-sm">Date Range <span className="text-red-500">*</span></span>
              <GuidelineTooltip 
                title="Date Selection"
                content="Choose the start and end dates for your reservation. For single-day reservations, select the same date for both."
              />
            </div>
          }
          required
        >
          <RangePicker
            className="w-full rounded-md"
            value={[
              formData.startDate ? moment(formData.startDate) : null,
              formData.endDate ? moment(formData.endDate) : null
            ]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                handleDateChange('start', dates[0].toDate());
                handleDateChange('end', dates[1].toDate());
              } else {
                setFormData(prev => ({
                  ...prev,
                  startDate: null,
                  endDate: null
                }));
              }
            }}
            disabledDate={(current) => {
              // Can't select days before today
              return current && current < moment().startOf('day');
            }}
            format="MMMM D, YYYY"
            placeholder={['Start Date', 'End Date']}
            size={isMobile ? 'middle' : 'large'}
          />
        </Form.Item>
        
        <Form.Item
          label={
            <div className="flex items-center">
              <span className="text-sm">Time Selection</span>
              <GuidelineTooltip 
                title="Time Selection"
                content="Choose from preset time slots or specify custom times for your reservation."
              />
            </div>
          }
        >
          <Radio.Group 
            value={timeSlotMode} 
            onChange={(e) => setTimeSlotMode(e.target.value)}
            buttonStyle="solid"
            className="mb-4"
          >
            <Radio.Button value="preset">Preset Times</Radio.Button>
            <Radio.Button value="custom">Custom Time</Radio.Button>
          </Radio.Group>
          
          {timeSlotMode === 'preset' ? (
            <div className="space-y-2">
              {timeSlots.map(slot => (
                <div 
                  key={slot.id}
                  className={`
                    border p-3 rounded-md cursor-pointer transition-all duration-200
                    ${selectedTime === slot.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                  onClick={() => handleTimeSlotSelect(slot.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{slot.label}</div>
                      <div className="text-xs text-gray-500">{slot.time}</div>
                    </div>
                    {selectedTime === slot.id && <FaCheckCircle className="text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item 
                label="Start Time" 
                className="mb-0"
              >
                <TimePicker
                  use12Hours
                  format="h:mm A"
                  className="w-full"
                  placeholder="Select start time"
                  value={formData.startDate ? moment(formData.startDate) : null}
                  onChange={(time) => handleCustomTimeChange('start', time)}
                />
              </Form.Item>
              <Form.Item 
                label="End Time"
                className="mb-0"
              >
                <TimePicker
                  use12Hours
                  format="h:mm A"
                  className="w-full"
                  placeholder="Select end time"
                  value={formData.endDate ? moment(formData.endDate) : null}
                  onChange={(time) => handleCustomTimeChange('end', time)}
                />
              </Form.Item>
            </div>
          )}
        </Form.Item>
      </div>
      
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium">Availability Preview</h4>
          <Tag color={timeSlotAvailability.isAvailable ? 'success' : 'warning'}>
            {timeSlotAvailability.isChecking ? 'Checking...' : 
             timeSlotAvailability.isAvailable ? 'Available' : 'Checking Availability'}
          </Tag>
        </div>
        
        {formData.startDate && formData.endDate ? (
          <TimeSlotVisualizer
            selectedTime={selectedTime}
            unavailableSlots={unavailableSlots}
            isChecking={timeSlotAvailability.isChecking}
            conflicts={timeSlotAvailability.conflicts}
          />
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <CalendarOutlined className="text-gray-400 text-3xl mb-2" />
            <p className="text-gray-500">Select dates to view availability</p>
          </div>
        )}
      </div>
    </div>
  </Card>
);

// Enhanced TimeSlotVisualizer component
const TimeSlotVisualizer = ({ selectedTime, unavailableSlots, isChecking, conflicts }) => {
  // Hours displayed in the timeline (8 AM to 5 PM)
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  
  const getSelectedTimeRange = () => {
    if (!selectedTime) return null;
    
    const slot = timeSlots.find(s => s.id === selectedTime);
    if (!slot) return null;
    
    return {
      start: slot.start,
      end: slot.end
    };
  };
  
  const selectedRange = getSelectedTimeRange();
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      {isChecking ? (
        <div className="flex justify-center py-6">
          <Spin tip="Checking availability..." />
        </div>
      ) : conflicts && conflicts.length > 0 ? (
        <div className="space-y-4">
          <Alert
            message="Scheduling Conflicts Detected"
            description="The selected time overlaps with existing reservations."
            type="warning"
            showIcon
          />
          <div className="max-h-40 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div key={index} className="border-b border-gray-100 py-2">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">{conflict.resource_name}</span> is already reserved from{' '}
                  <span className="font-medium">{format(new Date(conflict.start_time), 'h:mm a')}</span> to{' '}
                  <span className="font-medium">{format(new Date(conflict.end_time), 'h:mm a')}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <div className="w-16">Hour</div>
            <div className="flex-1 grid grid-cols-4">
              {['Morning', 'Noon', 'Afternoon', 'Evening'].map((label, i) => (
                <div key={i} className="text-center">{label}</div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            {hours.map(hour => (
              <div key={hour} className="flex items-center">
                <div className="w-16 text-xs">{hour > 12 ? `${hour-12} PM` : `${hour} AM`}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded relative">
                  {/* Render selected time range */}
                  {selectedRange && hour >= selectedRange.start && hour < selectedRange.end && (
                    <div
                      className="absolute h-full bg-blue-500 opacity-70"
                      style={{
                        left: `${(hour - selectedRange.start) / (selectedRange.end - selectedRange.start) * 100}%`,
                        width: `${1 / (selectedRange.end - selectedRange.start) * 100}%`
                      }}
                    />
                  )}
                  
                  {/* Render unavailable time blocks */}
                  {unavailableSlots.map((slot, index) => {
                    const slotStart = new Date(slot.start_time).getHours();
                    const slotEnd = new Date(slot.end_time).getHours();
                    
                    if (hour >= slotStart && hour < slotEnd) {
                      return (
                        <div
                          key={index}
                          className="absolute h-full bg-red-500 opacity-50"
                          style={{
                            left: `${(hour - slotStart) / (slotEnd - slotStart) * 100}%`,
                            width: `${1 / (slotEnd - slotStart) * 100}%`
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center text-xs space-x-4 mt-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 opacity-70 rounded mr-1"></div>
              <span>Your Selection</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 opacity-50 rounded mr-1"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    1: () => {
      if (resourceType === 'venue') {
        return renderVenues();
      } else if (resourceType === 'vehicle') {
        return renderResources();
      } else if (resourceType === 'equipment') {
        return renderEquipmentSelection();
      }
    },
    2: () => (
      <ReservationCalendar
        onDateSelect={(startDate, endDate) => {
          setFormData((prev) => ({
            ...prev,
            startDate: startDate,
            endDate: endDate,
          }));
        }}
        selectedResource={{
          type: formData.resourceType,
          id: formData.resourceType === 'equipment' 
            ? Object.entries(equipmentQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({
                  id: parseInt(id),
                  quantity: qty // Add the quantity here
                }))
            : formData.resourceType === 'venue' 
              ? formData.venue 
              : selectedModels,
        }}
      />
    ),
    3: renderBasicInformation,
    4: renderReviewSection,
    5: renderSuccessState,
  };

  return (
    <div className="min-h-[400px]">
      {steps[currentStep] && steps[currentStep]()}
    </div>
  );
};

const renderEquipmentSelection = () => (
  <motion.div 
    {...fadeInAnimation}
    className="space-y-4"
  >
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-gray-800">Select Equipment</h3>
      <Tooltip title="Select the equipment you need for your reservation">
        <InfoCircleOutlined className="text-gray-400 text-lg cursor-pointer" />
      </Tooltip>
    </div>
    
    <Alert
      message="Equipment Availability"
      description="Equipment availability is calculated based on existing reservations. The available quantity shown is what you can reserve for your selected time period."
      type="info"
      showIcon
      className="mb-4"
    />
    
    {equipment.length === 0 ? (
      <Skeleton active paragraph={{ rows: 6 }} />
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipment.map(item => (
          <Card
            key={item.equipment_id}
            className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
            hoverable
          >
            <ImageWithFallback
              src={`http://localhost/coc/gsd/${item.equipment_pic}`}
              alt={item.equipment_name}
              className="w-full h-40 mb-4"
            />
            <h4 className="text-base font-medium text-gray-800">{item.equipment_name}</h4>
            <div className="flex items-center my-2">
              <Tag className="mr-2 bg-blue-50 text-blue-600 border-blue-100">{item.equipment_category}</Tag>
              <Badge 
                count={item.available_quantity} 
                showZero 
                color={item.available_quantity > 0 ? 'green' : 'red'} 
                overflowCount={99} 
              />
            </div>
            
            <Divider className="my-2" />
            
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Total Quantity:</span>
              <span>{item.equipment_quantity}</span>
            </div>
            <div className="flex justify-between text-xs mb-3">
              <span className="text-gray-500">Available:</span>
              <span className={item.available_quantity > 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                {item.available_quantity}
              </span>
            </div>
            
            <div className="mt-3">
              <Form.Item label="Quantity" className="mb-0">
                <InputNumber
                  min={0}
                  max={item.available_quantity}
                  value={equipmentQuantities[item.equipment_id] || 0}
                  onChange={(value) => handleEquipmentQuantityChange(item.equipment_id, value)}
                  placeholder="Qty"
                  className="w-full"
                  disabled={item.available_quantity === 0}
                />
              </Form.Item>
              {item.available_quantity === 0 && (
                <Alert 
                  message="Not available" 
                  type="warning" 
                  showIcon 
                  className="mt-2" 
                  style={{ padding: '2px 8px' }}
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    )}
  </motion.div>
);


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



const StepIndicator = ({ currentStep, resourceType, isMobile }) => {
  const steps = [
    { 
      title: 'Select Type',
      icon: <TagOutlined />,
      description: 'Choose resource type'
    },
    { 
      title: 'Select Resource',
      icon: resourceType === 'venue' ? 
        <BankOutlined /> : 
        resourceType === 'vehicle' ? 
          <CarOutlined /> : 
          <FaTools className="text-sm" />,
      description: `Choose ${resourceType || 'resource'}`
    },
    { 
      title: 'Schedule',
      icon: <CalendarOutlined />,
      description: 'Pick dates & times' 
    },
    { 
      title: 'Details',
      icon: <FormOutlined />,
      description: 'Fill required info'
    },
    { 
      title: 'Review',
      icon: <FileSearchOutlined />,
      description: 'Check details'
    },
    { 
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      description: 'Confirmation'
    }
  ];

  return (
    <div className="step-indicator-container">
      <Steps
        current={currentStep}
        className={`custom-steps ${isMobile ? 'mobile-steps' : ''}`}
        size={isMobile ? "small" : "default"}
        responsive={!isMobile}
        progressDot={(dot, { status, index }) => (
          <Tooltip
            title={steps[index].description}
            placement="top"
            overlayClassName="step-tooltip"
          >
            {status === 'finish' ? (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md">
                <CheckCircleFilled className="text-white text-lg" />
              </div>
            ) : status === 'process' ? (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md border-2 border-white transition-all duration-300 pulse-animation">
                {steps[index].icon}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors duration-200">
                {steps[index].icon}
              </div>
            )}
          </Tooltip>
        )}
      >
        {steps.map((step, index) => (
          <Steps.Step
            key={index}
            title={
              <span className={`
                font-medium transition-colors duration-200
                ${currentStep === index ? 'text-blue-600' : ''}
                ${currentStep > index ? 'text-green-600' : ''}
                ${isMobile ? 'text-xs' : 'text-sm'}
                ${isMobile ? 'hidden sm:block' : ''}
              `}>
                {step.title}
              </span>
            }
            description={
              <span className={`
                text-xs transition-colors duration-200
                ${currentStep === index ? 'text-blue-500' : 'text-gray-500'}
                ${isMobile ? 'hidden sm:block' : ''}
              `}>
                {step.description}
              </span>
            }
            style={{ 
              textAlign: 'center',
              margin: '0 auto'
            }}
          />
        ))}
      </Steps>
      
      {/* Mobile step labels (only shown on mobile) */}
      {isMobile && (
        <div className="mt-2 text-center">
          <h4 className="font-medium text-blue-600">{steps[currentStep].title}</h4>
          <p className="text-xs text-gray-500">{steps[currentStep].description}</p>
        </div>
      )}
    </div>
  );
};

const handlePrintRequest = () => {
  // Find the selected driver using formData.driverName
  const selectedDriver = drivers.find(d => d.driver_id.toString() === formData.driverName?.toString());
  
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
        // ...existing venue details code...
      ` : `
        <div style="margin-bottom: 20px;">
          <h3>Vehicle Details</h3>
          <p><strong>Purpose:</strong> ${formData.purpose}</p>
          <p><strong>Destination:</strong> ${formData.destination}</p>
          <p><strong>Driver:</strong> ${selectedDriver?.driver_full_name || 'Not specified'}</p>
          <p><strong>Passengers:</strong></p>
          <ul>
            ${formData.passengers.map(p => `<li>${p.name}</li>`).join('')}
          </ul>
        </div>
      `}
    </div>
  `;

  // ...rest of the print function code...
};

// Add new state for drivers
const [drivers, setDrivers] = useState([]);
const [showPassengerModal, setShowPassengerModal] = useState(false);
const [newPassenger, setNewPassenger] = useState('');

// Add fetchDrivers function
const fetchDrivers = async (startDate, endDate) => {
  setIsLoadingDrivers(true);

  try {
    const response = await axios.post('http://localhost/coc/gsd/user.php', {
      operation: 'fetchDriver',
      startDateTime: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
      endDateTime: format(endDate, 'yyyy-MM-dd HH:mm:ss')
    });

    console.log('Driver response:', response.data); // Debugging line

    if (response.data.status === 'success') {
      const driversData = response.data.data.map(driver => ({
        ...driver,
        displayName: `${driver.driver_full_name} (${driver.departments_name || 'Department Driver'})`
      }));
      setAvailableDrivers(driversData);
    } else {
      setAvailableDrivers([]);
    }

  } catch (error) {
    console.error('Error fetching drivers:', error);
    setAvailableDrivers([]);
    toast.error('Failed to fetch available drivers');
  } finally {
    setIsLoadingDrivers(false);
  }
};

// Add useEffect to fetch drivers
useEffect(() => {
  if (formData.startDate && formData.endDate && formData.resourceType === 'vehicle') {
    fetchDrivers(formData.startDate, formData.endDate);
  }
}, [formData.startDate, formData.endDate, formData.resourceType]); // Add selectedDriverDept

// Add PassengerModal component
const PassengerModal = ({ visible, onHide }) => {
  const [newPassengerName, setNewPassengerName] = useState('');
  const [passengerError, setPassengerError] = useState('');

  const resetModal = () => {
    setNewPassengerName('');
    setPassengerError('');
  };

  const handleSubmit = () => {
    if (!newPassengerName.trim()) {
      setPassengerError('Passenger name cannot be empty');
      return;
    }
    
    // Check if passenger name already exists
    if (formData.passengers.some(p => p.name.toLowerCase() === newPassengerName.trim().toLowerCase())) {
      setPassengerError('This passenger is already in the list');
      return;
    }
    
    handleAddPassenger(newPassengerName.trim());
    resetModal();
    onHide();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <TeamOutlined />
          <span>Add Passenger</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        resetModal();
        onHide();
      }}
      footer={[
        <Button key="cancel" onClick={onHide}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
        >
          Add Passenger
        </Button>
      ]}
    >
      <div className="mb-4">
        <Alert
          message="Passenger Guidelines"
          description="Add each passenger who will be traveling in the vehicle. Make sure to include all passengers for accurate capacity planning."
          type="info"
          showIcon
          className="mb-4"
        />
        
        <Form layout="vertical">
          <Form.Item 
            label="Passenger Name" 
            required
            validateStatus={passengerError ? "error" : ""}
            help={passengerError}
          >
            <Input
              placeholder="Enter passenger's full name"
              value={newPassengerName}
              onChange={e => {
                setNewPassengerName(e.target.value);
                if (passengerError) setPassengerError('');
              }}
              onPressEnter={handleSubmit}
              suffix={
                <GuidelineTooltip 
                  title="Passenger Name"
                  content="Enter the full name of the passenger. This information will be used for the travel manifest."
                />
              }
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

// Enhanced Equipment Selection Modal with search, filtering and better UI
const EquipmentSelectionModal = () => {
  const [localEquipmentQuantities, setLocalEquipmentQuantities] = useState({...equipmentQuantities});
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 375);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Reset local state when modal opens
  useEffect(() => {
    setLocalEquipmentQuantities({...equipmentQuantities});
  }, [showEquipmentModal, equipmentQuantities]);
  
  const handleLocalQuantityChange = (equipId, value) => {
    const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
    if (!equip) return;
    
    const numericValue = Number(value) || 0;
    const maxAvailable = parseInt(equip.available_quantity);
    
    // Ensure quantity doesn't exceed available amount
    const constrainedValue = Math.min(numericValue, maxAvailable);
    
    setLocalEquipmentQuantities(prev => ({
      ...prev,
      [equipId]: constrainedValue
    }));
  };
  
  const handleConfirm = () => {
    setEquipmentQuantities(localEquipmentQuantities);
    
    if (formData.resourceType === 'venue') {
      setSelectedVenueEquipment(localEquipmentQuantities);
    }
    
    setShowEquipmentModal(false);
  };
  
  const getAvailableQuantity = (item) => {
    return parseInt(item.available_quantity);
  };
  
  // Filter equipment by search term and category
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.equipment_name.toLowerCase().includes(equipmentSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.equipment_category_id.toString() === selectedCategory.toString();
    return matchesSearch && matchesCategory;
  });
  
  // Group equipment by category for better organization
  const groupedEquipment = filteredEquipment.reduce((acc, item) => {
    const category = item.equipment_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
  
  const renderEquipmentCard = (item) => (
    <Card 
      key={item.equipment_id}
      className={`
        overflow-hidden rounded-lg shadow-sm transition-all duration-200
        ${localEquipmentQuantities[item.equipment_id] > 0 ? 'border-blue-200 shadow-blue-50' : 'border-gray-100'}
      `}
      hoverable
    >
      <div className="flex flex-col h-full">
        <div className="relative">
          <ImageWithFallback
            src={`http://localhost/coc/gsd/${item.equipment_pic}`}
            alt={item.equipment_name}
            className="w-full h-32"
          />
          
          {localEquipmentQuantities[item.equipment_id] > 0 && (
            <div className="absolute top-2 right-2">
              <Badge count={localEquipmentQuantities[item.equipment_id]} color="blue" />
            </div>
          )}
          
          {getAvailableQuantity(item) === 0 && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
              <Tag color="red" className="text-sm">Not Available</Tag>
            </div>
          )}
        </div>
        
        <div className="p-3 flex-1 flex flex-col">
          <div className="mb-1 text-base font-medium text-gray-800">{item.equipment_name}</div>
          <div className="flex flex-col text-xs text-gray-500 mb-3">
            <div className="flex justify-between">
              <span>Total Quantity:</span>
              <span className="font-medium">{item.equipment_quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Available:</span>
              <span className={`font-medium ${getAvailableQuantity(item) === 0 ? 'text-red-500' : 'text-green-500'}`}>
                {getAvailableQuantity(item)}
              </span>
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <InputNumber
                min={0}
                max={getAvailableQuantity(item)}
                value={localEquipmentQuantities[item.equipment_id] || 0}
                onChange={(value) => handleLocalQuantityChange(item.equipment_id, value)}
                disabled={getAvailableQuantity(item) === 0}
                className="w-20"
                size="small"
              />
              
              {localEquipmentQuantities[item.equipment_id] > 0 ? (
                <Button
                  type="text"
                  danger
                  icon={<FaTimes />}
                  onClick={() => handleLocalQuantityChange(item.equipment_id, 0)}
                  size="small"
                />
              ) : (
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => handleLocalQuantityChange(item.equipment_id, 1)}
                  disabled={getAvailableQuantity(item) === 0}
                  size="small"
                  className="text-blue-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
  
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FaTools />
          <span>Select Equipment</span>
        </div>
      }
      open={showEquipmentModal}
      onCancel={() => setShowEquipmentModal(false)}
      width={900}
      footer={[
        <AntButton key="cancel" onClick={() => setShowEquipmentModal(false)}>
          Cancel
        </AntButton>,
        <AntButton
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          className="bg-blue-500"
        >
          Confirm Selection
        </AntButton>
      ]}
    >
      <div className="space-y-4">
        <Alert
          message="Equipment Selection Guidelines"
          description="Select the equipment you need for your event. Only available items can be reserved, and quantities are limited."
          type="info"
          showIcon
          className="mb-4"
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input.Search
            placeholder="Search equipment..."
            value={equipmentSearch}
            onChange={e => setEquipmentSearch(e.target.value)}
            className="sm:w-60"
            allowClear
          />
          
          <Select
            placeholder="Filter by category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            className="w-full sm:w-60"
            options={[
              { value: 'all', label: 'All Categories' },
              ...equipmentCategories.map(cat => ({
                value: cat.equipment_category_id.toString(),
                label: cat.equipment_category_name
              }))
            ]}
          />
        </div>
        
        <div className="mt-4 max-h-[400px] overflow-y-auto p-1">
          {filteredEquipment.length === 0 ? (
            <Empty
              description={
                <span className="text-gray-500">
                  {equipmentSearch
                    ? `No equipment matching "${equipmentSearch}"`
                    : "No equipment available"}
                </span>
              }
            />
          ) : (
            <div>
              {selectedCategory === 'all' ? (
                // Group by category when showing all
                Object.entries(groupedEquipment).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-medium mb-3 text-gray-700">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(renderEquipmentCard)}
                    </div>
                  </div>
                ))
              ) : (
                // Simple grid when filtered by category
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEquipment.map(renderEquipmentCard)}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="text-sm font-medium">
            Selected Items: <span className="text-blue-500">
              {Object.values(localEquipmentQuantities).filter(qty => qty > 0).length}
            </span>
          </div>
          <div className="text-sm font-medium">
            Total Quantity: <span className="text-blue-500">
              {Object.values(localEquipmentQuantities).reduce((sum, qty) => sum + qty, 0)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Add this with other function declarations
const renderDriverDropdown = () => {
  return (
    <Form.Item
      label={<span className="text-sm">Driver Information <span className="text-red-500">*</span></span>}
      required
    >
      <div className="space-y-3">
        <Radio.Group
          value={formData.driverType}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              driverType: e.target.value,
              driverName: e.target.value === 'trip_ticket' ? null : '', // Set null for trip ticket
              tripTicketDriver: null
            }));
          }}
          className="mb-4"
        >
          <Radio value="default">Default Driver</Radio>
          <Radio value="trip_ticket">Trip Ticket Driver</Radio>
        </Radio.Group>

        {formData.driverType === 'default' ? (
          isLoadingDrivers ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Spin size="small" />
              <span className="text-gray-500">Loading available drivers...</span>
            </div>
          ) : (
            <>
              <Select
                value={formData.driverName}
                onChange={(value) => {
                  setFormData(prevState => ({
                    ...prevState,
                    driverName: value,
                    tripTicketDriver: null
                  }));
                }}
                placeholder="Select a default driver"
                className="w-full"
                disabled={availableDrivers.length === 0}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {availableDrivers.map(driver => (
                  <Select.Option 
                    key={driver.users_id} 
                    value={driver.driver_id}
                  >
                    {driver.driver_full_name}
                  </Select.Option>
                ))}
              </Select>

              {formData.driverName && (
                <Card className="bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <UserOutlined className="text-xl text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-blue-700">
                        {availableDrivers.find(d => d.driver_id === formData.driverName)?.driver_full_name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {availableDrivers.find(d => d.driver_id === formData.driverName)?.departments_name || 'Driver'}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Trip ticket driver will be assigned later
            </div>
          </div>
        )}
      </div>
    </Form.Item>
  );
};

// Add a new guidelines component that can be reused across the form
const GuidelineTooltip = ({ title, content }) => (
  <Tooltip
    title={
      <div className="p-1">
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-xs">{content}</p>
      </div>
    }
    color="#fff"
    overlayInnerStyle={{ 
      color: '#555', 
      boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
      border: '1px solid #eee'
    }}
  >
    <QuestionCircleOutlined className="ml-1 text-gray-400 cursor-help" />
  </Tooltip>
);



return (
  <div className="min-h-screen bg-gradient-to-br">
    <div className="hidden md:block">
      {userLevel === '100' && <Sidebar />}
    </div>
    <div className={`w-full p-6 transition-all duration-300 ${isMobile ? 'px-3 py-4' : 'p-6'}`}>
      <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
        <div className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 ${isMobile ? 'mb-3' : 'mb-6'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
            <Button
              onClick={() => navigate('/dashboard')}
              className="p-button-text flex items-center gap-2 hover:bg-blue-50 transition-colors"
              icon={<i className="pi pi-arrow-left text-blue-500" />}
            >
              <span className="font-medium text-blue-600">Back to Dashboard</span>
            </Button>
          </div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
            Create Reservation
          </h1>
          <p className="text-gray-600">
            Complete the steps below to make your reservation
          </p>
        </div>

        {/* Enhanced steps indicator */}
        <div className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 ${isMobile ? 'mb-3 p-2' : 'mb-6 p-4'}`}>
          <StepIndicator 
            currentStep={currentStep} 
            resourceType={formData.resourceType} 
            isMobile={isMobile}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`px-6 py-4 bg-gray-50 border-b border-gray-100 ${isMobile ? 'p-3' : 'px-6 py-4'}`}>
            <h2 className={`text-xl font-semibold text-gray-800 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {currentStep === 0 && "Select Resource Type"}
              {currentStep === 1 && `Select ${formData.resourceType === 'venue' ? 'Venue' : 'Vehicle'}`}
              {currentStep === 2 && "Choose Date & Time"}
              {currentStep === 3 && "Enter Details"}
              {currentStep === 4 && "Review Reservation"}
              {currentStep === 5 && "Reservation Complete"}
            </h2>
          </div>
          <div className={isMobile ? 'p-3' : 'p-6'}>
            <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
              {renderStepContent()}
            </div>
          </div>
          {currentStep !== 5 && (
            <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${isMobile ? 'p-3' : 'px-6 py-4'}`}>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
               
                
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <AntButton
                    type="default"
                    icon={<i className="pi pi-arrow-left" />}
                    onClick={handleBack}
                    size="large"
                    className={`p-button-outlined ${isMobile ? 'w-full' : ''}`}
                    disabled={currentStep === 0}
                  >
                    {isMobile ? 'Back' : 'Previous'}
                  </AntButton>
                  {currentStep === 4 ? (
                    <AntButton
                      type="primary"
                      icon={loading ? <Spin className="mr-2" /> : <CheckCircleOutlined />}
                      onClick={handleAddReservation}
                      size="large"
                      className={`${isMobile ? 'w-full' : ''} p-button-success`}
                      disabled={loading} // Disable button when loading
                    >
                      {loading ? 'Submitting...' : 'Submit'}
                  </AntButton>
                  ) : (
                    <AntButton
                      type="primary"
                      icon={<i className="pi pi-arrow-right" />}
                      onClick={handleNext}
                      size="large"
                      className={`${isMobile ? 'w-full' : ''} p-button-primary`}
                    >
                      Next
                    </AntButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Enhanced toast styling */}
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'text-sm',
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
      }}
    />

    {/* Enhanced modal styling */}
    <PassengerModal
      visible={showPassengerModal}
      onHide={() => {
        setShowPassengerModal(false);
        setNewPassenger('');
      }}
    />
    <EquipmentSelectionModal />
  </div>
);
};



export default AddReservation;



