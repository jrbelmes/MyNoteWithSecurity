import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';  // Update this line - import Dialog directly
import axios from 'axios';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-toastify';
import { DatePicker, TimePicker, Spin, Space } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
const { RangePicker } = DatePicker;

const themeColors = {
  primary: {
    light: '#E3F2FD',
    main: '#2196F3',
    dark: '#1976D2',
    contrastText: '#FFFFFF'
  },
  secondary: {
    light: '#E8F5E9',
    main: '#4CAF50',
    dark: '#2E7D32',
    contrastText: '#FFFFFF'
  },
  error: {
    light: '#FFEBEE',
    main: '#F44336',
    dark: '#C62828',
    contrastText: '#FFFFFF'
  },
  success: {
    light: '#E8F5E9',
    main: '#4CAF50',
    dark: '#2E7D32',
    contrastText: '#FFFFFF'
  }
};

// Update the availabilityStatus object to include partial state
const availabilityStatus = {
  available: {
    className: 'bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
    hoverClass: 'hover:shadow-md hover:scale-[1.02]',
    textClass: 'text-green-800'
  },
  partial: {
    className: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
    hoverClass: 'hover:shadow-md hover:scale-[1.02]',
    textClass: 'text-yellow-800'
  },
  reserved: {
    className: 'bg-gradient-to-r from-red-50 to-red-100',
    hoverClass: 'cursor-not-allowed',
    textClass: 'text-red-800'
  },
  full: {  
    className: 'bg-gradient-to-r from-red-50 to-red-100',
    hoverClass: 'cursor-not-allowed',
    textClass: 'text-red-800'
  }
};

const ReservationCalendar = ({ onDateSelect, selectedResource }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [view, setView] = useState('month');
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState({
    startTime: null,
    endTime: null,
    startMinute: null,
    endMinute: null
  });
  const [dateRange, setDateRange] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [dateTimeValidation, setDateTimeValidation] = useState({
    isValid: true,
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const [isSelectionComplete, setIsSelectionComplete] = useState(false);

  const [conflictDetails, setConflictDetails] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [selectedResource]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        'http://localhost/coc/gsd/user.php',
        {
          operation: 'fetchAvailability',
          itemType: selectedResource.type,
          itemId: selectedResource.type === 'venue' 
            ? selectedResource.id 
            : selectedResource.id  // Now this will be an array for vehicles
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.status === 'success') {
        // Format reservations data, now grouping by vehicle
        const formattedReservations = response.data.data.map(res => ({
          id: res.reservation_form_venue_id || res.reservation_form_vehicle_id,
          startDate: new Date(res.reservation_form_start_date),
          endDate: new Date(res.reservation_form_end_date),
          vehicleId: res.vehicle_id, // Add vehicle ID
          vehicleLicense: res.vehicle_license, // Add vehicle license
          status: res.reservation_status_status_reservation_id,
          isReserved: res.reservation_status_status_reservation_id === '3'
        }));
        setReservations(formattedReservations);
      }
    } catch (error) {
      toast.error('Failed to fetch reservations');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateReserved = (date) => {
    return reservations.some(res => {
      const start = new Date(res.startDate);
      const end = new Date(res.endDate);
      const current = new Date(date);
      return current >= start && current <= end && res.isReserved;
    });
  };

  const getReservationForDate = (date) => {
    return reservations.filter(reservation => {
      const start = new Date(reservation.reservation_start_date);
      const end = new Date(reservation.reservation_end_date);
      return date >= start && date <= end;
    }).map(reservation => ({
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

  const handleDateClick = (date) => {
    if (isDateReserved(date)) {
      toast.error('This date is already fully reserved');
      return;
    }

    if (!selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (!selectedEndDate && date > selectedStartDate) {
      setSelectedEndDate(date);
      setTimeModalOpen(true);
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setSelectedTimes({ startTime: null, endTime: null, startMinute: null, endMinute: null });
    }
  };

  const handleDateNavigation = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else if (view === 'week') {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const handleReservationClick = (reservation) => {
    // Implement if needed
    console.log('Reservation clicked:', reservation);
  };

// First, update the getAvailabilityStatus function to always return one of our defined statuses
const getAvailabilityStatus = (date, allReservations) => {
  const businessStart = new Date(date);
  businessStart.setHours(8, 0, 0, 0);
  const businessEnd = new Date(date);
  businessEnd.setHours(17, 0, 0, 0);

  // Check for full day reservation first (8AM-5PM)
  const hasFullDayReservation = allReservations.some(res => 
    isSameDay(new Date(res.startDate), date) &&
    new Date(res.startDate).getHours() <= 8 &&
    new Date(res.endDate).getHours() >= 17 &&
    res.isReserved
  );

  if (hasFullDayReservation) {
    return 'full';
  }

  if (selectedResource.type === 'vehicle') {
    // Count reservations for each selected vehicle
    const vehicleReservations = {};
    selectedResource.id.forEach(vehicleId => {
      vehicleReservations[vehicleId] = allReservations.filter(res => 
        res.vehicleId === vehicleId.toString() &&
        res.isReserved && 
        isSameDay(date, new Date(res.startDate))
      );
    });

    // Check if all vehicles are fully reserved for the entire day
    const allVehiclesFullyReserved = selectedResource.id.every(vehicleId => 
      vehicleReservations[vehicleId].some(res => {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        return resStart.getHours() <= 8 && resEnd.getHours() >= 17;
      })
    );

    if (allVehiclesFullyReserved) {
      return 'full';
    }

    // Check if any vehicle has any reservation
    const anyVehicleReserved = selectedResource.id.some(vehicleId => 
      vehicleReservations[vehicleId].length > 0
    );

    return anyVehicleReserved ? 'partial' : 'available';
  } else {
    // Venue logic
    const dayReservations = allReservations.filter(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return (
        res.isReserved && 
        isSameDay(date, new Date(res.startDate))
      );
    });

    if (dayReservations.length === 0) return 'available';

    // Check if any reservation spans the entire business day
    const hasFullDayVenueReservation = dayReservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return resStart.getHours() <= 8 && resEnd.getHours() >= 17;
    });

    return hasFullDayVenueReservation ? 'full' : 'partial';
  }
};

// Then update the renderCalendarGrid function to handle the status more safely
const renderCalendarGrid = () => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const days = [];
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  
  // Add previous month's days
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
    days.unshift(prevDate);
  }
  
  // Add current month's days
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }
  
  // Add next month's days to complete the grid
  const remainingDays = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
  }

  return (
    <motion.div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const status = getAvailabilityStatus(day, reservations);
        const statusStyle = availabilityStatus[status];

        return (
          <motion.div
            key={day.toISOString()}
            className={`
              min-h-[100px] p-2 border rounded-lg
              ${isCurrentMonth ? statusStyle.className : 'bg-gray-100 text-gray-400'}
              ${statusStyle.hoverClass}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isCurrentMonth ? statusStyle.textClass : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Update getTimeSlotAvailability for better multiple vehicle handling
const getTimeSlotAvailability = (date, hour, allReservations) => {
  if (hour < 8 || hour >= 17) return 'outside';

  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0);
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  if (selectedResource.type === 'vehicle') {
    // Check if all vehicles are reserved for this time slot
    const allVehiclesReserved = selectedResource.id.every(vehicleId => {
      const vehicleReservations = allReservations.filter(res => 
        res.vehicleId === vehicleId.toString() &&
        res.isReserved &&
        isSameDay(date, new Date(res.startDate))
      );

      return vehicleReservations.some(res => {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        return (
          (slotStart >= resStart && slotStart < resEnd) ||
          (slotEnd > resStart && slotEnd <= resEnd) ||
          (slotStart <= resStart && slotEnd >= resEnd)
        );
      });
    });

    if (allVehiclesReserved) {
      return 'full';
    }

    // Check if any vehicle is reserved
    const anyVehicleReserved = selectedResource.id.some(vehicleId => {
      const vehicleReservations = allReservations.filter(res => 
        res.vehicleId === vehicleId.toString() &&
        res.isReserved &&
        isSameDay(date, new Date(res.startDate))
      );

      return vehicleReservations.some(res => {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        return (
          (slotStart >= resStart && slotStart < resEnd) ||
          (slotEnd > resStart && slotEnd <= resEnd) ||
          (slotStart <= resStart && slotEnd >= resEnd)
        );
      });
    });

    return anyVehicleReserved ? 'partial' : 'available';
  } else {
    // Existing venue logic remains the same
    const dayReservations = allReservations.filter(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return isSameDay(date, resStart) && res.isReserved;
    });

    // Check for full-day reservation first (8AM-5PM)
    const hasFullDayReservation = dayReservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return resStart.getHours() === 8 && 
             resStart.getMinutes() === 0 && 
             resEnd.getHours() === 17 && 
             resEnd.getMinutes() === 0;
    });

    if (hasFullDayReservation) {
      return 'full';
    }

    // Check if this specific time slot is within any reservation
    const isReserved = dayReservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      return slotStart >= resStart && slotStart < resEnd;
    });

    return isReserved ? 'reserved' : 'available';
  }
};

// Update the color classes for better visibility
// Update getTimeSlotClass to use red instead of yellow
const getTimeSlotClass = (date, hour, reservations) => {
  const status = getTimeSlotAvailability(date, hour, reservations);
  
  switch (status) {
    case 'outside':
      return 'bg-gray-100';
    case 'full':
    case 'partial':
    case 'reserved':
      return 'bg-red-200 cursor-not-allowed';
    case 'available':
      return 'bg-green-100 hover:bg-green-200';
    default:
      return 'bg-gray-100';
  }
};

// Update the date availability class for consistency
// Update getDateAvailabilityClass to use red instead of yellow
const getDateAvailabilityClass = (date, reservations) => {
  const status = getAvailabilityStatus(date, reservations);
  switch (status) {
    case 'full':
    case 'partial':
    case 'reserved':
      return 'bg-red-100 hover:bg-red-200';
    case 'available':
      return 'bg-green-50 hover:bg-green-100';
    default:
      return 'bg-gray-50';
  }
};

// Update renderWeekView with enhanced full-day indication
const renderWeekView = () => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM inclusive

  return (
    <motion.div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header row */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
          <div className="p-4 font-medium text-gray-500">Time</div>
          {days.map((day) => {
            const hasFullDay = reservations.some(res => 
              isSameDay(new Date(res.startDate), day) &&
              new Date(res.startDate).getHours() === 8 &&
              new Date(res.startDate).getMinutes() === 0 &&
              new Date(res.endDate).getHours() === 17 &&
              new Date(res.endDate).getMinutes() === 0 &&
              res.isReserved
            );

            return (
              <div key={day.toISOString()} 
                className={`p-4 text-center border-l ${
                  hasFullDay ? 'bg-red-100' : 'bg-white'
                }`}
              >
                <div className={`font-medium ${hasFullDay ? 'text-red-800' : 'text-gray-800'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className="text-sm text-gray-500">
                  {format(day, 'MMM d')}
                </div>
                {hasFullDay && (
                  <div className="text-xs text-red-600 mt-1">
                    Fully Reserved
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
            <div className="p-4 font-medium text-gray-500">
              {format(new Date().setHours(hour), 'ha')} {/* Changed to 'ha' format */}
            </div>
            {days.map((day) => {
              const statusClass = getTimeSlotClass(day, hour, reservations);
              const status = getTimeSlotAvailability(day, hour, reservations);

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={`
                    p-2 border-l min-h-[80px] relative
                    ${statusClass}
                  `}
                >
                  
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Update renderDayView with enhanced full-day indication
const renderDayView = () => {
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  
  const hasFullDayReservation = reservations.some(res => 
    isSameDay(new Date(res.startDate), currentDate) &&
    new Date(res.startDate).getHours() === 8 &&
    new Date(res.startDate).getMinutes() === 0 &&
    new Date(res.endDate).getHours() === 17 &&
    new Date(res.endDate).getMinutes() === 0 &&
    res.isReserved
  );

  return (
    <motion.div className="border rounded-lg">
      <div className={`text-center p-4 border-b ${
        hasFullDayReservation ? 'bg-red-100' : 'bg-white'
      }`}>
        <span className={`text-xl font-medium ${
          hasFullDayReservation ? 'text-red-800' : 'text-gray-800'
        }`}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </span>
        {hasFullDayReservation && (
          <div className="text-sm text-red-600 mt-1">
            Fully Reserved Today
          </div>
        )}
      </div>
      <div className="divide-y">
        {hours.map((hour) => {
          const status = getTimeSlotAvailability(currentDate, hour, reservations);
          const statusClass = getTimeSlotClass(currentDate, hour, reservations);

          return (
            <div
              key={hour}
              className={`
                flex p-4 min-h-[80px]
                ${statusClass}
              `}
            >
              <div className="w-32 font-medium text-gray-500">
                {format(new Date().setHours(hour), 'ha')} {/* Changed to 'ha' format */}
              </div>
             
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

  // Available time slots (8 AM to 5 PM)
  const timeSlots = Array.from({ length: 10 }, (_, i) => (i + 8));

  // Function to check if a time slot is available
  const isTimeSlotAvailable = (date, hour) => {
    return !reservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      return (
        slotStart >= resStart && slotStart < resEnd ||
        slotEnd > resStart && slotEnd <= resEnd
      ) && res.isReserved;
    });
  };

  const generateAvailableTimeSlots = (selectedDate) => {
    const slots = [];
    const workStart = 8; // 8 AM
    const workEnd = 17;  // 5 PM
  
    // Get all reservations for the selected date
    const dayReservations = reservations.filter(res => 
      isSameDay(new Date(res.startDate), selectedDate)
    );
  
    // Create array of blocked time ranges
    const blockedRanges = dayReservations
      .filter(res => res.isReserved)
      .map(res => ({
        start: new Date(res.startDate).getHours(),
        end: new Date(res.endDate).getHours()
      }));
  
    // Generate available time slots
    for (let hour = workStart; hour <= workEnd; hour++) {
      // Check if this hour is within any blocked range
      const isBlocked = blockedRanges.some(range => 
        hour >= range.start && hour < range.end
      );
  
      if (!isBlocked) {
        // Add available hours with minutes
        for (let minute = 0; minute < 60; minute++) {
          slots.push({
            hour,
            minute,
            label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
          });
        }
      }
    }
  
    return slots;
  };

  const handleTimeSelection = () => {
    if (!selectedTimes.startTime || !selectedTimes.endTime) {
      toast.error('Please select both start and end times');
      return;
    }
  
    // Validate business hours (8 AM - 5 PM)
    if (selectedTimes.startTime < 8 || selectedTimes.startTime > 17 ||
        selectedTimes.endTime < 8 || selectedTimes.endTime > 17) {
      toast.error('Please select times between 8 AM and 5 PM');
      return;
    }
  
    // Validate time range
    if (selectedTimes.endTime <= selectedTimes.startTime) {
      toast.error('End time must be after start time');
      return;
    }
  
    const startDateTime = new Date(selectedStartDate);
    startDateTime.setHours(
      selectedTimes.startTime, 
      selectedTimes.startMinute || 0, 
      0, 
      0
    );
  
    const endDateTime = new Date(selectedEndDate || selectedStartDate);
    endDateTime.setHours(
      selectedTimes.endTime, 
      selectedTimes.endMinute || 0, 
      0, 
      0
    );
  
    // Check if there are any conflicts
    const hasConflict = reservations.some(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return (
        (startDateTime >= resStart && startDateTime < resEnd) ||
        (endDateTime > resStart && endDateTime <= resEnd) ||
        (startDateTime <= resStart && endDateTime >= resEnd)
      );
    });
  
    if (hasConflict) {
      toast.error('Selected time conflicts with existing reservations');
      return;
    }
  
    onDateSelect(startDateTime, endDateTime);
    setTimeModalOpen(false);
  };

  const renderTimeSelectionModal = () => (
    <Dialog
      open={timeModalOpen}
      onClose={() => setTimeModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <Dialog.Title className="text-lg font-medium mb-4">Select Time</Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={selectedTimes.startTime ? 
                  `${selectedTimes.startTime}:${selectedTimes.startMinute || '00'}` : 
                  ''
                }
                onChange={(e) => {
                  const [hour, minute] = e.target.value.split(':').map(Number);
                  setSelectedTimes(prev => ({
                    ...prev,
                    startTime: hour,
                    startMinute: minute
                  }));
                }}
              >
                <option value="">Select time</option>
                {generateAvailableTimeSlots(selectedStartDate).map(slot => (
                  <option
                    key={`${slot.hour}:${slot.minute}`}
                    value={`${slot.hour}:${slot.minute}`}
                  >
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedTimes.startTime != null && (
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={selectedTimes.endTime ? 
                    `${selectedTimes.endTime}:${selectedTimes.endMinute || '00'}` : 
                    ''
                  }
                  onChange={(e) => {
                    const [hour, minute] = e.target.value.split(':').map(Number);
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: hour,
                      endMinute: minute
                    }));
                  }}
                >
                  <option value="">Select time</option>
                  {generateAvailableTimeSlots(selectedEndDate || selectedStartDate)
                    .filter(slot => {
                      // Only show times after the start time
                      if (slot.hour < selectedTimes.startTime) return false;
                      if (slot.hour === selectedTimes.startTime) {
                        return slot.minute > (selectedTimes.startMinute || 0);
                      }
                      return true;
                    })
                    .map(slot => (
                      <option
                        key={`${slot.hour}:${slot.minute}`}
                        value={`${slot.hour}:${slot.minute}`}
                      >
                        {slot.label}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setTimeModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleTimeSelection}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const validateDateTime = (dates, times) => {
    if (!dates || !times) return true;

    const [startDate, endDate] = dates;
    const [startTime, endTime] = times;
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startTime.hour(), startTime.minute());
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endTime.hour(), endTime.minute());

    // Check if selected time range conflicts with existing reservations
    const hasConflict = reservations.some(reservation => {
      const resStart = new Date(reservation.startDate);
      const resEnd = new Date(reservation.endDate);
      
      return (
        (startDateTime >= resStart && startDateTime < resEnd) ||
        (endDateTime > resStart && endDateTime <= resEnd) ||
        (startDateTime <= resStart && endDateTime >= resEnd)
      );
    });

    if (hasConflict) {
      setDateTimeValidation({
        isValid: false,
        message: 'Selected time slot conflicts with existing reservations'
      });
      return false;
    }

    setDateTimeValidation({
      isValid: true,
      message: ''
    });
    return true;
  };

  const getDisabledTime = (date) => {
    if (!date) return {};

    const disabledRanges = reservations
      .filter(res => isSameDay(new Date(res.startDate), date))
      .map(res => ({
        start: new Date(res.startDate).getHours(),
        end: new Date(res.endDate).getHours()
      }));

    const disabledHours = () => {
      const hours = [];
      disabledRanges.forEach(range => {
        for (let i = range.start; i < range.end; i++) {
          hours.push(i);
        }
      });
      return hours;
    };

    return {
      disabledHours
    };
  };

  // Enhanced date-time selection handler
  

  // Add this new function to check for conflicts
  const checkScheduleConflicts = (startDateTime, endDateTime) => {
    const conflicts = reservations.filter(res => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      return (
        (startDateTime >= resStart && startDateTime < resEnd) ||
        (endDateTime > resStart && endDateTime <= resEnd) ||
        (startDateTime <= resStart && endDateTime >= resEnd)
      ) && res.isReserved;
    });

    return conflicts;
  };

  // Update handleDateTimeSelection with enhanced conflict checking
  const handleDateTimeSelection = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      setIsSelectionComplete(false);
      return;
    }

    const startDateTime = dates[0];
    const endDateTime = dates[1];
    
    // Validate business hours
    const startHour = startDateTime.hour();
    const endHour = endDateTime.hour();
    const startMinute = startDateTime.minute();
    const endMinute = endDateTime.minute();
    
    // Business hours validation
    if (startHour < 8 || startHour > 16 || 
        endHour < 9 || endHour > 17 ||
        (startHour === 17 && startMinute > 0) ||
        (endHour === 17 && endMinute > 0)) {
      toast.error('Please select times between 8:00 AM and 5:00 PM');
      setIsSelectionComplete(false);
      return;
    }

    // Validate minimum booking duration
    const duration = endDateTime.diff(startDateTime, 'hours', true);
    if (duration < 1) {
      toast.error('Minimum booking duration is 1 hour');
      setIsSelectionComplete(false);
      return;
    }

    // Check for conflicts
    const conflicts = checkScheduleConflicts(startDateTime.toDate(), endDateTime.toDate());
    
    if (conflicts.length > 0) {
      setConflictDetails({
        conflicts,
        attemptedBooking: {
          start: startDateTime.format('YYYY-MM-DD HH:mm'),
          end: endDateTime.format('YYYY-MM-DD HH:mm')
        }
      });
      setShowConflictModal(true);
      setIsSelectionComplete(false);
      return;
    }

    // If no conflicts, proceed with selection
    setIsSelectionComplete(true);
    setDateRange(dates);
    onDateSelect(startDateTime.toDate(), endDateTime.toDate());
  };

  // Add this new component for conflict modal
  const renderConflictModal = () => (
    <Dialog
      open={showConflictModal}
      onClose={() => setShowConflictModal(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <Dialog.Title className="text-lg font-medium text-red-700">
                Scheduling Conflict Detected
              </Dialog.Title>
            </div>
            
            <p className="text-gray-600 mb-4">
              Your selected time slot conflicts with existing reservations:
            </p>

            {conflictDetails && (
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="font-medium text-red-800 mb-2">Your attempted booking:</p>
                <p className="text-red-600">
                  From: {conflictDetails.attemptedBooking.start}<br/>
                  To: {conflictDetails.attemptedBooking.end}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="font-medium text-yellow-800 mb-2">Existing reservations:</p>
              <ul className="space-y-2">
                {conflictDetails?.conflicts.map((conflict, index) => (
                  <li key={index} className="text-yellow-700">
                    {format(new Date(conflict.startDate), 'MMM dd, yyyy HH:mm')} - 
                    {format(new Date(conflict.endDate), 'HH:mm')}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                setShowConflictModal(false);
                setDateRange(null); // Reset date selection
              }}
            >
              Choose Different Time
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  // Update the RangePicker in renderEnhancedDateTimeSelection
  const renderEnhancedDateTimeSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <Space direction="vertical" size="large" className="w-full">
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-gray-800">
            Select Date and Time Range
          </h4>
          <p className="text-sm text-gray-600">
            {isSelectionComplete 
              ? "✓ Date and time selection complete" 
              : "Please select both start and end date/time"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Date Range <span className="text-red-500">*</span>
            </label>
            <RangePicker
              className="w-full rounded-lg border-gray-200"
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                handleDateTimeSelection(dates);
              }}
              disabledDate={(current) => {
                return current && current < moment().startOf('day');
              }}
              showTime={{
                hideDisabledOptions: true,
                defaultValue: [
                  moment('08:00:00', 'HH:mm:ss'),
                  moment('17:00:00', 'HH:mm:ss')
                ],
                format: 'HH:mm',
                minuteStep: 30
              }}
              format="YYYY-MM-DD HH:mm"
              disabledTime={() => ({
                disabledHours: () => [...Array(8).keys(), ...Array(7).keys().map(i => i + 18)], // Changed from 17 to 18 to include 17:00
                disabledMinutes: () => []
              })}
              placeholder={['Start Date & Time', 'End Date & Time']}
            />
            <div className="text-xs text-gray-500 mt-1">
              Business hours: 8:00 AM - 5:00 PM
            </div>
          </div>

          {/* Remove the separate TimePicker since time selection is now integrated in RangePicker */}
        </div>

        {/* Selection status indicator */}
        <div className={`mt-4 p-3 rounded-lg ${
          isSelectionComplete ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          <div className="flex items-center gap-2">
            {isSelectionComplete ? (
              <>
                <CheckCircleOutlined />
                <span>Date and time selection complete</span>
              </>
            ) : (
              <>
                <InfoCircleOutlined />
                <span>Please complete your selection</span>
              </>
            )}
          </div>
        </div>
      </Space>
      {renderConflictModal()}
    </motion.div>
  );

  // Update renderAvailabilityLegend to include yellow option
  const renderAvailabilityLegend = () => (
    <div className="flex gap-4 items-center mb-4 p-3 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-green-200"></div>
        <span className="text-sm">Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-yellow-200"></div>
        <span className="text-sm">Partially Reserved</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-red-200"></div>
        <span className="text-sm">Fully Reserved</span>
      </div>
    </div>
  );

  // Enhanced calendar view with loading state
  return (
    <div className="p-4 space-y-6">
      {renderEnhancedDateTimeSelection()}
      
      <div className="relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"
            >
              <Spin size="large" />
            </motion.div>
          )}
        </AnimatePresence>

        {renderAvailabilityLegend()}

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleDateNavigation('prev')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <span>←</span>
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => handleDateNavigation('next')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <span>→</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Day
            </button>
          </div>
        </div>

        {view === 'month' && (
          <>
            <div className="mb-4 grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            {renderCalendarGrid()}
          </>
        )}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}

        {renderTimeSelectionModal()}
      </div>
    </div>
  );
};

export default ReservationCalendar;



