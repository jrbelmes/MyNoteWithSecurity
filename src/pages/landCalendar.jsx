import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import Sidebar from './Sidebar';
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

  // Status color mapping
  const statusColors = {
    pending: 'bg-yellow-200',
    accepted: 'bg-green-200',
    declined: 'bg-red-200',
    expired: 'bg-gray-200',
    cancelled: 'bg-blue-200'
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
      const formData = new URLSearchParams();
      formData.append('operation', 'fetchAllReservations'); // Changed from 'action' to 'operation'

      const response = await axios({
        method: 'POST',
        url: 'http://localhost/coc/gsd/fetch_reserve.php',
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Raw API Response:', response);
      console.log('Response Data:', response.data);
      console.log('Reservations Array:', response.data.data);

      if (response.data.status === 'success') {
        // Parse dates before setting state
        const parsedReservations = response.data.data.map(reservation => {
          console.log('Processing reservation:', reservation);
          return {
            ...reservation,
            reservation_start_date: new Date(reservation.reservation_start_date),
            reservation_end_date: new Date(reservation.reservation_end_date)
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
      const isInRange = isDateInRange(
        date,
        reservation.reservation_start_date,
        reservation.reservation_end_date
      );
      
      // Debug log for specific date
      if (isInRange) {
        console.log('Found reservation for date:', date, reservation);
      }
      
      return isInRange;
    });
    
    return reservationsForDate;
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
                  key={`${reservation.reservation_id}-${idx}`}
                  className={`
                    mt-1 p-1 text-xs rounded cursor-pointer
                    ${getStatusColor(reservation.reservation_status_name)}
                  `}
                  onClick={() => handleReservationClick(reservation)}
                  title={reservation.reservation_event_title}
                >
                  {reservation.reservation_event_title}
                </div>
              ))}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const getEventStyles = (startDate, endDate) => {
    const startHour = startDate.getHours() + (startDate.getMinutes() / 60);
    const endHour = endDate.getHours() + (endDate.getMinutes() / 60);
    const duration = endHour - startHour;
    
    // Increase from 6rem to 8rem per hour
    return {
      top: `${startHour * 8}rem`,
      height: `${duration * 8}rem`,
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
      console.log('Clicked reservation:', reservation);
      const formData = new URLSearchParams();
      formData.append('operation', 'getReservationDetailsById'); // Changed from 'getReservationDetails' to 'getReservationDetailsById'
      formData.append('reservation_id', reservation.reservation_id);

      console.log('Sending request with data:', formData.toString());

      const response = await axios({
        method: 'POST',
        url: 'http://localhost/coc/gsd/fetch_reserve.php',
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Response from API:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        setReservationDetails(response.data.data);
        setIsDetailsDialogOpen(true);
      } else {
        console.error('Invalid response format:', response.data);
        alert('Could not fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      alert('Error fetching reservation details');
    }
  };

  const ReservationDetailsDialog = () => (
    <Dialog
      open={isDetailsDialogOpen}
      onClose={() => setIsDetailsDialogOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-2xl bg-white shadow-2xl overflow-hidden">
          {reservationDetails ? (
            <>
              {/* Header Section */}
              <div className="relative h-40 bg-gradient-to-br from-blue-600 to-blue-800 p-6">
                <button
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="absolute bottom-6 left-6 space-y-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm 
                    ${getStatusColor(reservationDetails.reservation.status_master_name)} 
                    border border-white/20 font-medium`}>
                    {reservationDetails.reservation.status_master_name.toUpperCase()}
                  </span>
                  <h2 className="text-3xl font-bold text-white">
                    {reservationDetails.reservation.reservation_event_title}
                  </h2>
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-6 grid gap-6">
                {/* Main Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Event Details */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Event Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-500">Event Name</p>
                          <p className="text-gray-900 font-medium">{reservationDetails.reservation.reservation_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="text-gray-900">{reservationDetails.reservation.reservation_description || 'No description provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Schedule
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-500">Start Date & Time</p>
                          <p className="text-gray-900">{new Date(reservationDetails.reservation.reservation_start_date).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Date & Time</p>
                          <p className="text-gray-900">{new Date(reservationDetails.reservation.reservation_end_date).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Contact & Resources */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Contact Information
                      </h3>
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                          <img 
                            src={`http://localhost/coc/gsd/${reservationDetails.reservation.users_pic}`}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{reservationDetails.reservation.users_full_name}</p>
                          <p className="text-gray-500">{reservationDetails.reservation.users_contact_number}</p>
                          <p className="text-sm text-gray-500">Created: {new Date(reservationDetails.reservation.date_created).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Resources Section */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                      <h3 className="font-semibold text-gray-900">Reserved Resources</h3>
                      
                      {/* Venues */}
                      {reservationDetails.venues?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Venues
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {reservationDetails.venues.map(venue => (
                              <div key={venue.ven_id} className="bg-white rounded-lg p-2 text-sm border border-gray-200">
                                {venue.ven_name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Equipment - only show if there are items */}
                      {reservationDetails.equipment?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Equipment</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {reservationDetails.equipment.map(eq => (
                              <div key={eq.equip_id} className="bg-white rounded-lg p-2 text-sm border border-gray-200">
                                {eq.equip_name} (Qty: {eq.quantity})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vehicles - only show if there are items */}
                      {reservationDetails.vehicles?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Vehicles</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {reservationDetails.vehicles.map(vehicle => (
                              <div key={vehicle.vehicle_id} className="bg-white rounded-lg p-2 text-sm border border-gray-200">
                                {vehicle.vehicle_license}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading reservation details...</span>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto" style={{ backgroundColor: themeColors.light }}>
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
                    className="text-2xl font-bold cursor-pointer hover:text-blue-500" /* decreased from text-4xl */
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
            {ReservationDetailsDialog()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
