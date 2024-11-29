import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Steps } from 'primereact/steps';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Form, Input, InputNumber, Select, Card, Typography, Row, Col, Divider, Radio, Result } from 'antd';
import { UserOutlined, InfoCircleOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';

const THEME = {
  primary: {
    light: '#f0fdf4',
    main: '#22c55e',
    dark: '#15803d',
    contrast: '#ffffff'
  },
  secondary: {
    light: '#f1f5f9',
    main: '#64748b',
    dark: '#334155',
    contrast: '#ffffff'
  },
  error: {
    light: '#fef2f2',
    main: '#ef4444',
    dark: '#b91c1c',
    contrast: '#ffffff'
  }
};

const STEPS = {
  INFORMATION: 0,
  VENUE: 1,
  CALENDAR: 2,
  RESOURCES: 3,
  APPROVAL: 4,
  SUBMITTED: 5
};

const RESOURCE_STEPS = {
  VEHICLES: 0,
  EQUIPMENT: 1
};

const stepTitles = [
  'Fill Information',
  'Choose Venue',
  'Select Dates',
  'Select Resources',
  'Review & Submit',
  'Request Submitted'
];

const stepItems = [
  {
    label: 'Information',
    icon: 'pi pi-user',
    className: 'custom-step-indicator'
  },
  { label: 'Venue', icon: 'pi pi-map-marker' },
  { label: 'Calendar', icon: 'pi pi-calendar' },
  { label: 'Resources', icon: 'pi pi-box' },
  { label: 'Review', icon: 'pi pi-check' },
].map(step => ({
  ...step,
  style: {
    color: THEME.primary.main,
    borderColor: THEME.primary.main
  }
}));

const fadeInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const DatePickerWithConflict = ({ selected, onChange, hasEndDate, isConflicting, ...props }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      className={`w-full p-2 border rounded-md focus:ring-2 transition-colors duration: 200
        ${(hasEndDate && isConflicting) 
          ? 'border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500' 
          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
        }`}
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
  const [currentStep, setCurrentStep] = useState(STEPS.INFORMATION);
  const [resourceStep, setResourceStep] = useState(RESOURCE_STEPS.VEHICLES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [equipmentCategories, setEquipmentCategories] = useState([]);

  const [formData, setFormData] = useState({
    reservationName: '',
    eventTitle: '',
    description: '',
    venue: '',
    startDate: null,
    endDate: null,
    participants: '',
    selectedUserId: userId,
    customStartTime: '',
    customEndTime: ''
  });

  useEffect(() => {
    

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchVenues(), fetchVehicles(), fetchEquipment()]);
      } catch (error) {
        toast.error("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const user_level_id = localStorage.getItem('user_level_id');

    useEffect(() => {
        if (user_level_id !== '3' ) {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);



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

  const valid = isStepValid();
  console.log('Is Step Valid:', valid);

  if (!valid) {
    const missing = getMissingFields();
    console.log('Missing Fields:', missing);
    toast.error(`Please fill in all required fields: ${missing.join(', ')}`);
    return;
  }

  if (currentStep === STEPS.APPROVAL) {
    await handleAddReservation(e);
  } else {
    setCurrentStep(prev => prev + 1);
  }
};

const getMissingFields = () => {
  const currentRequiredFields = {
    [STEPS.INFORMATION]: ['reservationName', 'eventTitle', 'description', 'participants'],
    [STEPS.VENUE]: ['venue'],
    [STEPS.CALENDAR]: ['startDate', 'endDate'],
    [STEPS.RESOURCES]: [],
    [STEPS.APPROVAL]: []
  }[currentStep] || [];

  return currentRequiredFields.filter(field => {
    const value = formData[field];
    return !value || (typeof value === 'string' && !value.trim());
  });
};

const isStepValid = () => {
  switch (currentStep) {
    case STEPS.INFORMATION:
      return !!(
        formData.reservationName?.trim() &&
        formData.eventTitle?.trim() &&
        formData.description?.trim() &&
        formData.participants &&
        formData.participants > 0
      );
    case STEPS.VENUE:
      return !!formData.venue;
    case STEPS.CALENDAR:
      return !!(formData.startDate && formData.endDate);
    case STEPS.RESOURCES:
      return true;
    case STEPS.APPROVAL:
      return true;
    default:
      return false;
  }
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
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
      newSelected[equipId] = 1;
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
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  >
    {venues.map((venue) => (
      <Card
        key={venue.ven_id}
        className={`
          transition-all duration-300 cursor-pointer hover:shadow-lg
          ${formData.venue === venue.ven_id ? 
            'ring-2 ring-green-500 shadow-lg bg-green-50 transform scale-[1.02]' : 
            'hover:shadow-md hover:border-green-200'
          }
        `
        }
        onClick={() => {
          setFormData(prev => ({
            ...prev,
            venue: venue.ven_id
          }));
          
        }}
      >
        <div className="relative">
          <img
            src={venue.image_url || '/default-venue.jpg'}
            alt={venue.ven_name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 right-2">
            <Tag
              severity={venue.status_availability_name === 'available' ? 'success' : 'danger'}
              value={venue.status_availability_name}
            />
          </div>
          {formData.venue === venue.ven_id && (
            <div className="absolute top-2 left-2">
              <Tag
                severity="success"
                icon="pi pi-check"
                value="Selected"
              />
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <h3 className={`text-xl font-semibold ${formData.venue === venue.ven_id ? 'text-green-700' : 'text-gray-800'}`}>
            {venue.ven_name}
          </h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <i className="pi pi-users" />
              <span>Capacity: {venue.ven_occupancy}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="pi pi-clock" />
              <span>8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </motion.div>
);

const renderResources = () => {
  const renderVehiclesSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Available Vehicles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.vehicle_id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                selectedModels.includes(vehicle.vehicle_id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedModels.includes(vehicle.vehicle_id)}
                  onChange={() => handleVehicleSelect(vehicle.vehicle_id)}
                  disabled={vehicle.status_availability_name !== 'available'}
                />
                <div className="flex-grow">
                  <img 
                    src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'} 
                    alt={`${vehicle.vehicle_make_name} ${vehicle.vehicle_model_name}`}
                    className="w-full h-40 object-cover mb-4 rounded-lg"
                  />
                  <h4 className="font-medium">
                    {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    License: {vehicle.vehicle_license}
                  </p>
                  <Tag
                    severity={vehicle.status_availability_name === 'available' ? 'success' : 'danger'}
                    value={vehicle.status_availability_name}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button
          label="Skip"
          icon="pi pi-arrow-right"
          className="p-button-secondary"
          onClick={() => setResourceView('equipment')}
        />
        <Button
          label="Next: Equipment"
          icon="pi pi-arrow-right"
          onClick={() => setResourceView('equipment')}
          severity="success"
        />
      </div>
    </div>
  );

  const renderEquipmentSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Available Equipment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.map((item) => (
            <div
              key={item.equip_id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                selectedEquipment[item.equip_id]
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={!!selectedEquipment[item.equip_id]}
                    onChange={() => 
                      handleEquipmentSelect(
                        item.equip_id, 
                        selectedEquipment[item.equip_id] ? 0 : 1
                      )
                    }
                    disabled={item.status_availability_name !== 'available'}
                  />
                  <div>
                    <h4 className="font-medium">{item.equip_name}</h4>
                    <p className="text-sm text-gray-600">
                      Available: {item.equip_quantity} units
                    </p>
                    <Tag
                      severity={item.status_availability_name === 'available' ? 'success' : 'danger'}
                      value={item.status_availability_name}
                      className="mt-2"
                    />
                  </div>
                </div>
                {selectedEquipment[item.equip_id] && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Quantity:</label>
                    <InputNumber
                      value={selectedEquipment[item.equip_id]}
                      onChange={(e) => handleEquipmentSelect(item.equip_id, e.value)}
                      min={1}
                      max={parseInt(item.equip_quantity)}
                      size="small"
                      className="w-20"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button
          label="Back to Vehicles"
          icon="pi pi-arrow-left"
          className="p-button-secondary"
          onClick={() => setResourceView('vehicles')}
        />
        <Button
          label="Continue to Review"
          icon="pi pi-arrow-right"
          onClick={() => setCurrentStep(prev => prev + 1)}
          severity="success"
        />
      </div>
    </div>
  );

  return resourceView === 'vehicles' ? renderVehiclesSection() : renderEquipmentSection();
};

const renderInformationSection = () => {
  const { Title, Paragraph } = Typography;
  const { TextArea } = Input;

  const formItemLayout = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="reservation-info-card">
        <Title level={4} className="mb-6">
          <InfoCircleOutlined className="mr-2" />
          Reservation Information
        </Title>

        <Form layout="vertical" {...formItemLayout}>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Reservation Name"
                required
                tooltip="This will be the main identifier for your reservation"
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Enter reservation name"
                  name="reservationName"
                  value={formData.reservationName}
                  onChange={handleInputChange}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Event Title"
                required
                tooltip="The title of your event"
              >
                <Input
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  placeholder="Enter event title"
                  name="eventTitle"
                  value={formData.eventTitle}
                  onChange={handleInputChange}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="my-4" />

          <Row gutter={[24, 16]}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Event Description"
                required
                tooltip="Provide details about your event"
              >
                <TextArea
                  placeholder="Describe your event and its purpose"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="rounded-lg"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Number of Participants"
                required
                tooltip="Expected number of attendees"
              >
                <InputNumber
                  prefix={<TeamOutlined className="text-gray-400" />}
                  placeholder="Enter number"
                  name="participants"
                  value={formData.participants}
                  onChange={(value) => handleInputChange({
                    target: { name: 'participants', value }
                  })}
                  className="w-full rounded-lg"
                  min={1}
                  max={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col xs={24}>
              <Form.Item
                label="Additional Notes"
                tooltip="Any special requirements or additional information"
              >
                <TextArea
                  placeholder="Enter any additional notes or requirements"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <Paragraph className="text-blue-600 mb-0">
            <InfoCircleOutlined className="mr-2" />
            All fields marked with an asterisk (*) are required. Please ensure your event
            details are accurate as they will be reviewed by the administrators.
          </Paragraph>
        </div>
      </Card>
    </motion.div>
  );
};

const handleAddReservation = async (e) => {
  e.preventDefault();

  console.log('Submitting form data:', formData);

  const payload = {
    operation: 'insertReservation',
    reservation_name: formData.reservationName,
    reservation_event_title: formData.eventTitle,
    reservation_description: formData.description,
    reservation_start_date: formatDateForAPI(formData.startDate),
    reservation_end_date: formatDateForAPI(formData.endDate),
    reservations_users_id: formData.selectedUserId,
    reservation_participants: formData.participants.toString(),
    equipments: Object.entries(selectedEquipment)
      .filter(([_, quantity]) => quantity > 0)
      .map(([equipId, quantity]) => ({
        equip_id: equipId,
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

  try {
    const response = await axios.post(
      'http://localhost/coc/gsd/update_master.php',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', response.data);

    if (response.data.status === 'success') {
      toast.success('Reservation successfully added!');
      setCurrentStep(STEPS.SUBMITTED);
      resetForm();
    } else {
      toast.error(response.data.message || "An error occurred. Please try again.");
    }
  } catch (error) {
    console.error('API Error:', error);
    toast.error("Error adding reservation: " + (error.response?.data?.message || error.message));
  }
};

const formatDateForAPI = (date) => {
  if (!date) return null;
  const d = new Date(date);
  
  // Ensure we're using the correct timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
  setCurrentStep(STEPS.INFORMATION);
  setSelectedTime(null);
  setTimeSlotAvailability({
    isChecking: false,
    isAvailable: false,
    conflicts: []
  });
  setUnavailableSlots([]);
};

const handleBack = () => {
  if (currentStep > STEPS.VENUE) {
    setCurrentStep(currentStep - 1);
  }
};

const renderReviewSection = () => {
  console.group('Reservation Review Details');
  console.log('Form Data:', formData);
  console.log('Selected Venue:', venues.find(v => v.ven_id.toString() === formData.venue.toString()));
  console.log('Selected Vehicles:', vehicles.filter(v => selectedModels.includes(v.vehicle_id)));
  console.log('Selected Equipment:', equipment.filter(e => selectedEquipment[e.equip_id]));
  console.log('Date Range:', {
    start: formData.startDate,
    end: formData.endDate,
    startTime: formData.customStartTime,
    endTime: formData.customEndTime
  });
  console.groupEnd();

  console.log('Available venues:', venues);
  console.log('Selected venue ID:', formData.venue);
  console.log('Selected venue type:', typeof formData.venue);
  
  const formatReviewDate = (date) => {
    if (!date) return 'Not selected';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedVenue = venues.find(v => v.ven_id.toString() === formData.venue.toString());
  console.log('Found venue:', selectedVenue);
  
  const selectedVehicleDetails = vehicles.filter(v => 
    selectedModels.includes(v.vehicle_id)
  );

  const selectedEquipmentDetails = equipment.filter(e => 
    selectedEquipment[e.equip_id]
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800">Reservation Summary</h3>
        </div>

        <div className="p-6 space-y-8">
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

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <FaMapMarkerAlt className="text-green-600" />
              Date & Venue
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
              <div>
                <p className="text-sm text-gray-500">Start Date & Time</p>
                <p className="font-medium text-gray-900">{formatReviewDate(formData.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date & Time</p>
                <p className="font-medium text-gray-900">{formatReviewDate(formData.endDate)}</p>
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

          {(selectedVehicleDetails.length > 0 || selectedEquipmentDetails.length > 0) && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <FaTools className="text-green-600" />
                Selected Resources
              </h4>
              <div className="space-y-6 pl-6">
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
          setCurrentStep(STEPS.INFORMATION);
        }}
      >
        Request Again
      </Button>,
    ]}
  />
);

const TimeSlotVisualizer = ({ selectedTime, unavailableSlots, isChecking, conflicts }) => {
  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-4">Select Time Slot</h5>
      {isChecking ? (
        <div className="text-center py-4">
          <i className="pi pi-spin pi-spinner mr-2" />
          <span className="text-gray-600">Checking availability...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={formData.startDate}
              onChange={(e) => handleDateChange('start', e.value)}
              showTime={false}
              dateFormat="dd/mm/yy"
              minDate={new Date()}
              className="w-full"
              panelClassName="date-panel"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              End Date
            </label>
            <Calendar
              value={formData.endDate}
              onChange={(e) => handleDateChange('end', e.value)}
              showTime={false}
              dateFormat="dd/mm/yy"
              minDate={formData.startDate || new Date()}
              className="w-full"
              panelClassName="date-panel"
            />
          </div>
        </div>

        {formData.startDate && formData.endDate && (
          <TimeSlotVisualizer
            selectedTime={selectedTime}
            unavailableSlots={unavailableSlots}
            isChecking={timeSlotAvailability.isChecking}
            conflicts={timeSlotAvailability.conflicts}
          />
        )}
      </div>
    </Card>
  </motion.div>
);

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

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
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

const handleDateChange = async (type, date) => {
  if (!date) return;

  const newDate = new Date(date);
  
  newDate.setHours(8, 0, 0, 0);
  
  setFormData(prev => {
    let updatedData = { ...prev };
    
    if (type === 'start') {
      updatedData.startDate = newDate;
      if (prev.endDate && prev.endDate < newDate) {
        updatedData.endDate = newDate;
      }
    } else {
      updatedData.endDate = newDate;
    }
    
    updatedData.customStartTime = '';
    updatedData.customEndTime = '';
    
    return updatedData;
  });

  if (formData.venue && type === 'end' && formData.startDate) {
    setTimeSlotAvailability(prev => ({ ...prev, isChecking: true }));
    await checkTimeSlotAvailability(formData.startDate, newDate);
  }
};

const stepDescriptions = {
  [STEPS.INFORMATION]: 'Enter the basic details about your reservation',
  [STEPS.VENUE]: 'Select a venue for your event',
  [STEPS.CALENDAR]: 'Choose your preferred date and time',
  [STEPS.RESOURCES]: 'Select any additional resources you need',
  [STEPS.APPROVAL]: 'Review your reservation details',
};

const renderStepContent = () => {
  const renderContent = {
    [STEPS.INFORMATION]: () => (
      <motion.div
        {...fadeInAnimation}
        className="max-w-4xl mx-auto"
      >
        {renderInformationSection()}
      </motion.div>
    ),
    [STEPS.VENUE]: () => (
      <motion.div
        {...fadeInAnimation}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-6">
          <Input.Search
            placeholder="Search venues..."
            allowClear
            enterButton="Search"
            size="large"
            className="max-w-md"
            // Add search handler here if needed
          />
        </div>
        {renderVenues()}
      </motion.div>
    ),
    [STEPS.CALENDAR]: () => (
      <motion.div
        {...fadeInAnimation}
        className="max-w-4xl mx-auto"
      >
        {renderCalendarSection()}
      </motion.div>
    ),
    [STEPS.RESOURCES]: () => (
      <motion.div
        {...fadeInAnimation}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-6">
          <Radio.Group 
            value={resourceView}
            onChange={e => setResourceView(e.target.value)}
            buttonStyle="solid"
            className="mb-4"
          >
            <Radio.Button value="vehicles">Vehicles</Radio.Button>
            <Radio.Button value="equipment">Equipment</Radio.Button>
          </Radio.Group>
          
          {resourceView === 'vehicles' && (
            <Select
              placeholder="Filter by vehicle category"
              className="w-48 mr-4"
              allowClear
              onChange={value => setSelectedCategory(value || 'all')}
            >
              <Select.Option value="all">All Categories</Select.Option>
              {vehicleCategories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          )}
          
          {resourceView === 'equipment' && (
            <Select
              placeholder="Filter by equipment type"
              className="w-48"
              allowClear
              onChange={value => setSelectedCategory(value || 'all')}
            >
              <Select.Option value="all">All Types</Select.Option>
              {equipmentCategories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
        {renderResources()}
      </motion.div>
    ),
    [STEPS.APPROVAL]: () => (
      <motion.div
        {...fadeInAnimation}
        className="max-w-4xl mx-auto"
      >
        {renderReviewSection()}
      </motion.div>
    ),
    [STEPS.SUBMITTED]: () => (
      <motion.div
        {...fadeInAnimation}
        className="max-w-3xl mx-auto"
      >
        {renderSuccessState()}
      </motion.div>
    )
  };

  return (
    <div className="min-h-[400px]">
      {renderContent[currentStep] ? renderContent[currentStep]() : (
        <div className="text-center py-8 text-gray-500">
          <InfoCircleOutlined className="text-4xl mb-4" />
          <p>This step is not yet implemented.</p>
        </div>
      )}
    </div>
  );
};

return (
  <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    {userLevel === '100' && <Sidebar />}
    {userLevel === '1' && <Sidebar1 />}
    
    <div className="flex-grow p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Button
            icon="pi pi-arrow-left"
            label="Back"
            className="p-button-text"
            onClick={() => window.history.back()}
          />
          <h1 className="text-2xl font-bold text-gray-800">
            Create Reservation
          </h1>
        </div>

        <Card className="shadow-xl border-0">
          <div className="p-8">
            <Steps
              model={stepItems}
              activeIndex={currentStep}
              className="mb-8 custom-steps"
            />

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {stepItems[currentStep]?.label}
              </h2>
              <p className="text-gray-600">
                {stepDescriptions[currentStep]}
              </p>
            </div>

            <div className="mt-8">
              {renderStepContent()}
            </div>

            {currentStep !== STEPS.SUBMITTED && (
              <div className="mt-8 flex justify-between pt-6 border-t">
                <Button
                  label="Back"
                  icon="pi pi-arrow-left"
                  className="p-button-secondary"
                  onClick={handleBack}
                  disabled={currentStep === STEPS.INFORMATION}
                />
                <Button
                  label={currentStep === STEPS.APPROVAL ? 'Submit Reservation' : 'Continue'}
                  icon={currentStep === STEPS.APPROVAL ? 'pi pi-check' : 'pi pi-arrow-right'}
                  className="p-button-success"
                  onClick={handleNext}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
    <Toaster position="top-center" reverseOrder={false} />
  </div>
);
};

export default AddReservation;

