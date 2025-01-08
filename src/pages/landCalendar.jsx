import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  addWeeks,
  subWeeks,
  setHours
} from 'date-fns';

// Add theme constants
const themeColors = {
  primary: '#2E7D32', // dark green
  secondary: '#4CAF50', // medium green
  light: '#E8F5E9', // light green
  white: '#FFFFFF',
  success: '#388E3C',
  warning: '#FFA000',
  error: '#D32F2F',
  text: '#2C3E50'
};

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showYearSelect, setShowYearSelect] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);
  const user_level_id = localStorage.getItem('user_level_id');
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState(null);

  // Status color mapping
  const statusColors = {
    Reserved: 'bg-blue-100 text-blue-800'
  };

  // Add venue and vehicle color mapping
  const resourceColors = {
    venue: 'bg-emerald-200 text-emerald-800',
    vehicle: 'bg-purple-200 text-purple-800'
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [user_level_id, navigate]);

  const fetchReservations = async () => {
    try {
      const response = await axios({
        method: 'POST',
        url: 'http://localhost/coc/gsd/records&reports.php',
        data: JSON.stringify({ operation: 'fetchRecord' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Raw API Response:', response);
      console.log('Response Data:', response.data);

      if (response.data.status === 'success') {
        // Parse dates before setting state
        const parsedReservations = response.data.data.map(reservation => {
          console.log('Processing reservation:', reservation);
          return {
            ...reservation,
            reservation_start_date: new Date(reservation.approval_created_at),
            // For end date, parse the time from details string or default to same day
            reservation_end_date: reservation.venue_details || reservation.vehicle_details
              ? new Date(new Date(reservation.approval_created_at).setHours(17, 0, 0))
              : new Date(reservation.approval_created_at)
          };
        });
        console.log('Parsed reservations:', parsedReservations);
        setReservations(parsedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const isDateInRange = (date, startDate, endDate) => {
    // Convert date to start of day for comparison
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    // Ensure we're comparing dates only
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    return compareDate >= start && compareDate <= end;
  };

  const getReservationForDate = (date) => {
    const reservationsForDate = reservations.filter(reservation => {
      const start = new Date(reservation.approval_created_at);
      // Create end date by adding hours based on the details string
      const end = new Date(reservation.approval_created_at);
      
      // Parse time from details
      const timeMatch = (reservation.venue_details || reservation.vehicle_details || '').match(/(\d{2}:\d{2}:\d{2}) to (\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        const [_, startTime, endTime] = timeMatch;
        const [startHour] = startTime.split(':');
        const [endHour] = endTime.split(':');
        
        start.setHours(parseInt(startHour), 0, 0);
        end.setHours(parseInt(endHour), 0, 0);
      }

      const isInRange = isDateInRange(date, start, end);
      return isInRange;
    });

    return reservationsForDate.map(reservation => ({
      ...reservation,
      formattedResources: [
        ...(reservation.venue_form_name ? [{
          type: 'venue',
          name: reservation.venue_form_name
        }] : []),
        ...(reservation.vehicle_form_name ? [{
          type: 'vehicle',
          name: reservation.vehicle_form_name
        }] : [])
      ]
    }));
  };

  const getStatusColor = (status) => {
    // Remove toLowerCase() since your API returns exact status names
    switch (status) {
      case 'pending': return statusColors.pending;
      case 'approved': return statusColors.accepted;
      case 'decline': return statusColors.declined;
      case 'expired': return statusColors.expired;
      case 'cancelled': return statusColors.cancelled;
      default: 
        console.log('Unknown status:', status);
        return '';
    }
  };

  // Generate array of years (current year ± 10 years)
  const years = Array.from({ length: 21 }, (_, i) => 
    new Date().getFullYear() - 10 + i
  );

  const handleDateNavigation = (direction) => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1));
        break;
    }
  };

  const handleYearSelect = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowYearSelect(false);
  };

  const renderYearModal = () => {
    const currentYear = currentDate.getFullYear();
    const yearsArray = Array.from({ length: 21 }, (_, i) => 
      currentYear - 10 + i
    );

    return (
      <Dialog
        open={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold mb-4">Select Year</Dialog.Title>
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {yearsArray.map(year => (
                <motion.button
                  key={year}
                  className={`p-3 rounded-lg ${
                    year === currentYear 
                      ? 'bg-blue-500 text-white' 
                      : 'hover:bg-blue-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleYearSelect(year);
                    setIsYearModalOpen(false);
                  }}
                >
                  {year}
                </motion.button>
              ))}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };

  const renderCalendarGrid = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    const days = eachDayOfInterval({ start, end });

    return (
      <motion.div 
        className="grid grid-cols-7 gap-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayReservations = getReservationForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <motion.div
              key={day.toString()}
              className={`
                min-h-[100px] p-2 border rounded-lg
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'}
                hover:shadow-lg transition-all duration-200
                ${isToday ? 'border-blue-500 border-2' : ''}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`
                text-base font-semibold
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isToday ? 'text-blue-500' : ''}
              `}>
                {format(day, 'd')}
              </span>
              {dayReservations.map((reservation, idx) => (
                <div
                  key={`${reservation.approval_id}-${idx}`}
                  className="mt-1 p-1 text-xs rounded cursor-pointer bg-blue-100 text-blue-800"
                  onClick={() => handleReservationClick(reservation)}
                >
                  <div className="font-medium mb-1">Reserved</div>
                  {reservation.formattedResources.map((resource, resourceIdx) => (
                    <div
                      key={resourceIdx}
                      className={`mt-1 p-1 text-xs rounded ${resourceColors[resource.type]}`}
                    >
                      {resource.name}
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const getEventStyles = (reservation) => {
    let startHour = 8; // default to 8 AM
    let endHour = 17; // default to 5 PM

    // Parse time from details
    const details = reservation.venue_details || reservation.vehicle_details || '';
    const timeMatch = details.match(/(\d{2}:\d{2}:\d{2}) to (\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      const [_, startTime, endTime] = timeMatch;
      startHour = parseInt(startTime.split(':')[0]);
      endHour = parseInt(endTime.split(':')[0]);
    }

    return {
      top: `${startHour * 8}rem`,
      height: `${(endHour - startHour) * 8}rem`,
      position: 'absolute',
      left: '0',
      right: '0',
      margin: '0 2px'
    };
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-auto max-h-[1000px] border rounded-lg">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r bg-gray-50">
            <div className="h-20 border-b"></div> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-32 border-b px-2 py-1">
                <span className="text-sm text-gray-600">
                  {format(setHours(new Date(), hour), 'ha')}
                </span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1 flex">
            {days.map(day => (
              <div key={day} className="flex-1 min-w-[120px]">
                {/* Day header */}
                <div className="h-16 border-b sticky top-0 bg-white flex flex-col items-center justify-center">
                  <div className="font-semibold text-gray-600">{format(day, 'EEE')}</div>
                  <div className={`text-lg ${isSameDay(day, new Date()) ? 'text-blue-500 font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Hour slots */}
                <div className="relative">
                  {hours.map(hour => (
                    <div
                      key={`${day}-${hour}`}
                      className="h-32 border-b border-r" // Changed from h-20 to h-24 (6rem)
                    />
                  ))}
                  
                  {/* Render reservations */}
                  {reservations
                    .filter(reservation => isSameDay(new Date(reservation.reservation_start_date), day))
                    .map((reservation, idx) => (
                      <div
                        key={reservation.reservation_id}
                        style={getEventStyles(
                          new Date(reservation.reservation_start_date),
                          new Date(reservation.reservation_end_date)
                        )}
                        className={`${getStatusColor(reservation.reservation_status_name)} 
                          rounded-lg p-2 text-sm overflow-hidden shadow-sm z-10`}
                        onClick={() => handleReservationClick(reservation)}
                      >
                        <div className="font-semibold">{reservation.reservation_event_title}</div>
                        <div className="text-xs">{reservation.venue_names}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-auto max-h-[1000px] border rounded-lg">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r bg-gray-50">
            <div className="h-20 border-b"></div> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-32 border-b px-2 py-1">
                <span className="text-sm text-gray-600">
                  {format(setHours(new Date(), hour), 'ha')}
                </span>
              </div>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-[200px]">
            {/* Day header */}
            <div className="h-16 border-b sticky top-0 bg-white flex items-center justify-center">
              <h3 className="text-xl font-semibold">
                {format(currentDate, 'EEEE, MMMM d')}
              </h3>
            </div>

            {/* Hour slots */}
            <div className="relative">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="h-32 border-b" // Keep h-24 (6rem) for consistency
                />
              ))}
              
              {/* Render reservations */}
              {reservations
                .filter(reservation => isSameDay(new Date(reservation.reservation_start_date), currentDate))
                .map((reservation, idx) => (
                  <div
                    key={reservation.reservation_id}
                    style={getEventStyles(
                      new Date(reservation.reservation_start_date),
                      new Date(reservation.reservation_end_date)
                    )}
                    className={`${getStatusColor(reservation.reservation_status_name)} 
                      rounded-lg p-2 text-sm overflow-hidden shadow-sm z-10`}
                    onClick={() => handleReservationClick(reservation)}
                  >
                    <div className="font-semibold">{reservation.reservation_event_title}</div>
                    <div className="text-xs">{reservation.venue_names}</div>
                    <div className="text-xs">
                      {format(new Date(reservation.reservation_start_date), 'h:mm a')} - 
                      {format(new Date(reservation.reservation_end_date), 'h:mm a')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleReservationClick = async (reservation) => {
    try {
      const response = await axios({
        method: 'POST',
        url: 'http://localhost/coc/gsd/records&reports.php',
        data: JSON.stringify({
          operation: 'getReservationDetailsById',
          json: {  // Add this nested json object
            approval_id: reservation.approval_id
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response from API:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        if (response.data.data.venue && Object.values(response.data.data.venue).some(v => v !== null)) {
          setVenueDetails(response.data.data.venue);
          setIsVenueModalOpen(true);
        }
        if (response.data.data.vehicle && Object.values(response.data.data.vehicle).some(v => v !== null)) {
          setVehicleDetails(response.data.data.vehicle);
          setIsVehicleModalOpen(true);
        }
        if (response.data.data.equipment && Object.values(response.data.data.equipment).some(v => v !== null)) {
          setEquipmentDetails(response.data.data.equipment);
        }
      } else {
        console.error('Invalid response format:', response.data);
        alert('Could not fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      alert('Error fetching reservation details');
    }
  };

  const VenueDetailsModal = () => (
    <Dialog
      open={isVenueModalOpen}
      onClose={() => setIsVenueModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-white shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Venue Reservation Details
              </Dialog.Title>
              {venueDetails && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Status: {venueDetails.status_request || 'Reserved'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsVenueModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {venueDetails && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Event Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Venue Name</p>
                    <p className="font-medium">{venueDetails.venue_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Title</p>
                    <p className="font-medium">{venueDetails.venue_form_event_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>{venueDetails.venue_form_description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p>{venueDetails.venue_participants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p>{new Date(venueDetails.venue_form_start_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p>{new Date(venueDetails.venue_form_end_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Reserved By</h3>
                <p>{venueDetails.venue_form_user_full_name}</p>
              </div>

              {equipmentDetails && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Equipment</h3>
                  <div className="flex items-center space-x-2">
                    <p>{equipmentDetails.equipment_name}</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Quantity: {equipmentDetails.reservation_equipment_quantity}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const VehicleDetailsModal = () => (
    <Dialog
      open={isVehicleModalOpen}
      onClose={() => setIsVehicleModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-white shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Vehicle Reservation Details
              </Dialog.Title>
              {vehicleDetails && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Status: {vehicleDetails.status_request || 'Reserved'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsVehicleModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {vehicleDetails && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium">{vehicleDetails.vehicle_license}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Make</p>
                    <p className="font-medium">{vehicleDetails.vehicle_make}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="font-medium">{vehicleDetails.vehicle_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{vehicleDetails.vehicle_category}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Trip Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p>{vehicleDetails.vehicle_form_purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p>{vehicleDetails.vehicle_form_destination}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p>{vehicleDetails.vehicle_form_start_date && new Date(vehicleDetails.vehicle_form_start_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p>{vehicleDetails.vehicle_form_end_date && new Date(vehicleDetails.vehicle_form_end_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Reserved By</h3>
                <p>{vehicleDetails.vehicle_form_user_full_name}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Passengers</h3>
                <div className="space-y-2">
                  {vehicleDetails.passengers && vehicleDetails.passengers.length > 0 ? (
                    vehicleDetails.passengers.map((passenger, index) => (
                      <div key={index} className="px-3 py-2 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-800">{passenger}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No passengers listed</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-4"> {/* decreased from p-8 */}
          <motion.div 
            className="rounded-xl shadow-2xl p-6" /* decreased from p-8 */
            style={{ backgroundColor: themeColors.white }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6"> {/* decreased from mb-10 */}
              <div className="flex items-center space-x-4"> {/* decreased from space-x-6 */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full hover:bg-gray-100"
                  style={{ color: themeColors.primary }}
                  onClick={() => handleDateNavigation('prev')}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="relative">
                  <h2 
                    className="text-2xl font-bold cursor-pointer hover:text-blue-500" 
                    style={{ color: themeColors.primary }}
                    onClick={() => setIsYearModalOpen(true)}
                  > 
                    {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full hover:bg-gray-100"
                  onClick={() => handleDateNavigation('next')}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
              
              <div className="flex space-x-2">
                {['month', 'week', 'day'].map((viewOption) => (
                  <motion.button
                    key={viewOption}
                    className={`px-4 py-2 rounded-lg`}
                    style={{
                      backgroundColor: view === viewOption ? themeColors.primary : themeColors.light,
                      color: view === viewOption ? themeColors.white : themeColors.text
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView(viewOption)}
                  >
                    {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {view === 'month' && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2"> {/* decreased gap and margin */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div 
                      key={day} 
                      className="text-center text-base font-semibold text-gray-600 py-1" /* decreased text and padding */
                      style={{ color: themeColors.primary }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {renderCalendarGrid()}
              </>
            )}
            
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
            {renderYearModal()}
            <VenueDetailsModal />
            <VehicleDetailsModal />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

       
export default Calendar;


