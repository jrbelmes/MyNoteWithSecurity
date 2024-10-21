import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import Sidebar from './Sidebar';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaCar, FaTools, FaTimes, FaSearch } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Dialog, Transition } from '@headlessui/react'

const AddReservation = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    reservationName: '',
    eventTitle: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    selectedUserId: '',
    selectedUserName: '',
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
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVenue" }));
      if (response.data.status === 'success') {
        setVenues(response.data.data);
      } else {
        toast.error("Error fetching venues: " + response.data.message);
      }
    } catch {
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
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVehicles" }));
      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      } else {
        toast.error("Error fetching vehicles: " + response.data.message);
      }
    } catch {
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
    const missingFields = [];
    const requiredFields = [
      'reservationName',
      'eventTitle',
      'venue',
      'selectedUserId',
      'startDate',
      'endDate'
    ];
  
    requiredFields.forEach(field => {
      if (!formData[field]) {
        missingFields.push(field);
      }
    });
  
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`, {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      return;
    }
  
    setLoading(true);
  
    // Construct the payload
    const payload = {
      operation: 'completeReservation',
      reservation: {
        reservation_name: formData.reservationName,
        reservation_event_title: formData.eventTitle,
        reservation_description: formData.description,
        reservation_start_date: `${formData.startDate} ${new Date().toLocaleTimeString()}`,
        reservation_end_date: `${formData.endDate} ${new Date().toLocaleTimeString()}`,
        reservations_users_id: formData.selectedUserId,
      },
      vehicles: selectedModels.map(vehicleId => ({ vehicle_id: vehicleId })),
      venues: [{ venue_id: formData.venue }],
      equipments: Object.entries(selectedEquipment).map(([equipId, quantity]) => ({
        equip_id: parseInt(equipId),
        quantity: quantity,
      })),
    };
  
    try {
      const response = await axios.post('http://localhost/coc/gsd/insertbyadmin.php', payload);
  
      console.log("API Response:", response.data);
  
      if (response.data.status === 'success') {
        toast.success('Reservation successfully added!', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        resetForm();
      } else {
        toast.error(response.data.message || "An error occurred. Please try again.", {
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error("Error adding reservation: " + (error.response?.data?.message || error.message), {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };
  

  const resetForm = () => {
    setFormData({
      reservationName: '',
      eventTitle: '',
      description: '',
      venue: '',
      startDate: '',
      endDate: '',
      selectedUserId: '',
      selectedUserName: '',
    });
    setSelectedModels([]);
    setSelectedEquipment({});
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

  return (
    <div className="flex bg-gradient-to-br from-green-50 to-white min-h-screen">
      <Sidebar />
      <div className="flex-grow p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-5 text-white">
            <h2 className="text-2xl font-bold">Add Reservation</h2>
          </div>
          <div className="p-6">
            <Form onSubmit={handleAddReservation}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Group controlId="reservationName">
                    <Form.Label className="block text-sm font-medium text-gray-700 mb-1">Reservation Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter reservation name"
                      name="reservationName"
                      value={formData.reservationName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </Form.Group>

                  <Form.Group controlId="eventTitle">
                    <Form.Label className="block text-sm font-medium text-gray-700 mb-1">Event Title</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter event title"
                      name="eventTitle"
                      value={formData.eventTitle}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </Form.Group>
                </div>

                <Form.Group controlId="description">
                  <Form.Label className="block text-sm font-medium text-gray-700 mb-1">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </Form.Group>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Group controlId="startDate">
                    <Form.Label className="block text-sm font-medium text-gray-700 mb-1">Start Date</Form.Label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={handleStartDateChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select start date"
                      required
                      minDate={new Date()}
                    />
                  </Form.Group>

                  <Form.Group controlId="endDate">
                    <Form.Label className="block text-sm font-medium text-gray-700 mb-1">End Date</Form.Label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={handleEndDateChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select end date"
                      required
                      minDate={formData.startDate || new Date()}
                    />
                  </Form.Group>
                </div>

                <Form.Group>
                  <Form.Label className="block text-sm font-medium text-gray-700 mb-1">Select User</Form.Label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      className="flex-grow focus:ring-green-500 focus:border-green-500 block w-full rounded-l-md sm:text-sm border-gray-300 py-2 px-3"
                      placeholder="Selected User"
                      value={formData.selectedUserName || ''}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserModal(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Choose User
                    </button>
                  </div>
                </Form.Group>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddVehicleModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaCar className="mr-2" /> Select Vehicles
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEquipmentModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaTools className="mr-2" /> Select Equipment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddVenueModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaMapMarkerAlt className="mr-2" /> Select Venue
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {loading ? 'Adding...' : 'Add Reservation'}
                  </button>
                </div>
              </div>
            </Form>
          </div>
        </div>

        {/* Vehicle Modal */}
        <Transition appear show={showAddVehicleModal} as={React.Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowAddVehicleModal(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                    >
                      Select Vehicles
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        onClick={() => setShowAddVehicleModal(false)}
                      >
                        <span className="sr-only">Close</span>
                        <FaTimes className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {vehicles.map(vehicle => (
                          <div key={vehicle.vehicle_id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300">
                            <h4 className="text-lg font-semibold mb-2">Vehicle ID: {vehicle.vehicle_id}</h4>
                            <p className="text-sm text-gray-600 mb-1"><strong>Make:</strong> {vehicle.vehicle_make_name}</p>
                            <p className="text-sm text-gray-600 mb-1"><strong>Category:</strong> {vehicle.vehicle_category_name}</p>
                            <p className="text-sm text-gray-600 mb-3"><strong>License:</strong> {vehicle.vehicle_license}</p>
                            <label className="inline-flex items-center mt-2">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-green-600"
                                checked={selectedModels.includes(vehicle.vehicle_id)}
                                onChange={() => handleCheckboxChange(vehicle.vehicle_id)}
                              />
                              <span className="ml-2 text-gray-700">Select</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        onClick={() => setShowAddVehicleModal(false)}
                      >
                        Done
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Equipment Modal */}
        <Transition appear show={showAddEquipmentModal} as={React.Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowAddEquipmentModal(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                    >
                      Select Equipment
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        onClick={() => setShowAddEquipmentModal(false)}
                      >
                        <span className="sr-only">Close</span>
                        <FaTimes className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {equipment.map(item => (
                          <div key={item.equip_id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300">
                            <h4 className="text-lg font-semibold mb-2">{item.equip_name}</h4>
                            <p className="text-sm text-gray-600 mb-1"><strong>Category:</strong> {item.equipments_category_name}</p>
                            <p className="text-sm text-gray-600 mb-3"><strong>Available:</strong> {item.equip_quantity}</p>
                            <label className="inline-flex items-center mt-2">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-green-600"
                                checked={selectedEquipment[item.equip_id] !== undefined}
                                onChange={() => handleEquipmentCheckboxChange(item.equip_id)}
                              />
                              <span className="ml-2 text-gray-700">Select</span>
                            </label>
                            {selectedEquipment[item.equip_id] !== undefined && (
                              <div className="mt-2">
                                <label htmlFor={`quantity-${item.equip_id}`} className="block text-sm font-medium text-gray-700">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  id={`quantity-${item.equip_id}`}
                                  min="1"
                                  max={item.equip_quantity}
                                  value={selectedEquipment[item.equip_id] || ''}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value > parseInt(item.equip_quantity)) {
                                      toast.error(`Quantity exceeds available amount (${item.equip_quantity})`);
                                      return;
                                    }
                                    handleEquipmentQuantityChange(item.equip_id, value);
                                  }}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        onClick={() => setShowAddEquipmentModal(false)}
                      >
                        Done
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Venue Modal */}
        <Transition appear show={showAddVenueModal} as={React.Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowAddVenueModal(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                    >
                      Select Venue
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        onClick={() => setShowAddVenueModal(false)}
                      >
                        <span className="sr-only">Close</span>
                        <FaTimes className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {venues.map(venue => (
                          <div key={venue.ven_id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300">
                            <h4 className="text-lg font-semibold mb-2">Venue ID: {venue.ven_id}</h4>
                            <p className="text-sm text-gray-600 mb-1"><strong>Name:</strong> {venue.ven_name}</p>
                            <label className="inline-flex items-center mt-2">
                              <input
                                type="radio"
                                className="form-radio h-5 w-5 text-green-600"
                                checked={formData.venue === venue.ven_id}
                                onChange={() => handleInputChange({ target: { name: 'venue', value: venue.ven_id } })}
                              />
                              <span className="ml-2 text-gray-700">Select</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        onClick={() => setShowAddVenueModal(false)}
                      >
                        Done
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* User Selection Modal */}
        <Transition appear show={showUserModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowUserModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                    >
                      Select User
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        onClick={() => setShowUserModal(false)}
                      >
                        <span className="sr-only">Close</span>
                        <FaTimes className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={handleUserSearch}
                        />
                        <FaSearch className="absolute right-3 top-3 text-gray-400" />
                      </div>
                      <div className="mt-4 max-h-60 overflow-y-auto">
                        {filteredUsers.map(user => (
                          <div
                            key={user.users_id}
                            className="p-3 hover:bg-gray-100 cursor-pointer rounded-lg transition duration-150 ease-in-out"
                            onClick={() => selectUser(user)}
                          >
                            <p className="text-sm font-medium text-gray-900">{user.users_name}</p>
                            <p className="text-xs text-gray-500">ID: {user.users_school_id}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Add this near the top of your JSX */}
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
  );
};

export default AddReservation;
