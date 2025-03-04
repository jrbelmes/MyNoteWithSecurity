import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-toastify';
import { DatePicker, TimePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { isHoliday } from './holiday_utils';
import { HolidaysAPI } from '../../api/holidaysAPI';

// Update the availabilityStatus object with new colors
const availabilityStatus = {
  past: {
    className: 'bg-gray-50 dark:bg-gray-800',
    hoverClass: 'cursor-not-allowed',
    textClass: 'text-gray-400 dark:text-gray-500'
  },
  available: {
    className: 'bg-green-100 dark:bg-green-900/30',
    hoverClass: 'hover:shadow-lg hover:scale-[1.02] transition-transform duration-200',
    textClass: 'text-green-800 dark:text-green-300'
  },
  partial: {
    className: 'bg-yellow-100 dark:bg-yellow-900/30',
    hoverClass: 'hover:shadow-lg hover:scale-[1.02] transition-transform duration-200',
    textClass: 'text-yellow-800 dark:text-yellow-300'
  },
  reserved: {
    className: 'bg-red-100 dark:bg-red-900/30',
    hoverClass: 'cursor-not-allowed',
    textClass: 'text-red-800 dark:text-red-300'
  },
  holiday: {
    className: 'bg-violet-100 dark:bg-violet-900/30',
    hoverClass: 'cursor-not-allowed',
    textClass: 'text-violet-800 dark:text-violet-300'
  }
};



const ReservationCalendar = ({ onDateSelect, selectedResource }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [view, setView] = useState('month');
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState({
    startTime: null,
    endTime: null,
    startMinute: null,
    endMinute: null
  });
  const [dateRange, setDateRange] = useState(null);
  const [setDateTimeValidation] = useState({
    isValid: true,
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const [isSelectionComplete] = useState(false);

  const [conflictDetails, setConflictDetails] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null); // Add this line
  const [holidays, setHolidays] = useState([]);

  // Add this new state
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Add these new state variables after other state declarations
  const [selectionMode, setSelectionMode] = useState('full'); // 'full' for monthly, 'end-only' for weekly/daily

  // Add this function after the state declarations and before other functions
  const isSelectionValid = () => {
    if (selectionMode === 'full') {
      return (
        selectedStartDate && 
        selectedEndDate && 
        selectedTimes.startTime !== null && 
        selectedTimes.endTime !== null &&
        selectedTimes.startTime >= 5 &&
        selectedTimes.endTime <= 19
      );
    } else {
      return (
        selectedStartDate && 
        selectedEndDate &&
        selectedTimes.endTime !== null &&
        selectedTimes.endTime <= 19
      );
    }
  };

  // Add this function right after the state declarations
  const getReservedTimeSlots = (date) => {
    if (!date) return { hours: [], timeRanges: [] };
    
    const timeRanges = [];
    const reservedHours = new Set();
    
    const dayReservations = reservations.filter(res => 
      res.isReserved && isSameDay(new Date(res.startDate), date)
    );

    dayReservations.forEach(res => {
      const start = new Date(res.startDate);
      const end = new Date(res.endDate);
      timeRanges.push({
        start: start,
        end: end
      });
      
      // Add all hours within the reservation
      for (let hour = start.getHours(); hour <= end.getHours(); hour++) {
        reservedHours.add(hour);
      }
    });

    return {
      hours: Array.from(reservedHours),
      timeRanges: timeRanges
    };
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedResource]);

  // Add this useEffect to fetch holidays
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear();
        console.log('Fetching holidays for year:', currentYear);
        const holidaysList = await HolidaysAPI.fetchHolidays(currentYear);
        console.log('Fetched holidays:', holidaysList);
        setHolidays(holidaysList);
      } catch (error) {
        console.error('Failed to load holidays:', error);
        toast.error('Failed to load holiday information');
      }
    };
    loadHolidays();
  }, []);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  // Past dates check
  if (compareDate < today) {
    return 'past';
  }

  // Check for holidays
  const formattedDate = compareDate.toISOString().split('T')[0];
  if (holidays.find(h => h.date === formattedDate)) {
    return 'holiday';
  }

  // Filter reservations for the current date
  const dayReservations = allReservations.filter(res => {
    if (!res.isReserved) return false;

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    resStart.setHours(0, 0, 0, 0);
    resEnd.setHours(0, 0, 0, 0);
    
    return compareDate >= resStart && compareDate <= resEnd;
  });

  if (dayReservations.length === 0) {
    return 'available';
  }

  // Check if any reservation covers the entire business hours (5AM to 7PM)
  const hasFullDayReservation = dayReservations.some(res => {
    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    return resStart.getHours() <= 5 && resEnd.getHours() >= 19;
  });

  return hasFullDayReservation ? 'reserved' : 'partial';
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
    <motion.div className="grid grid-cols-7 gap-0.5 sm:gap-1">
      {days.map((day, index) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        // Format the date consistently for comparison
        const formattedDate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate()
        ).toISOString().split('T')[0];
        const holidayInfo = holidays.find(h => h.date === formattedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(day);
        compareDate.setHours(0, 0, 0, 0);
        
        // Check if the date is in the past or today but after business hours
        const isPastDate = compareDate < today;
        
        // Determine the style based on date status
        let status = isPastDate ? 'past' : 
                    holidayInfo ? 'holiday' : 
                    getAvailabilityStatus(day, reservations);
        
        let statusStyle = availabilityStatus[status];
        
        // Add specific styles for partial reservations
        if (status === 'partial') {
          statusStyle = {
            className: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
            hoverClass: 'hover:shadow-lg hover:scale-[1.02] transition-transform duration-200',
            textClass: 'text-yellow-800 dark:text-yellow-300'
          };
        }

        // Add selected date range highlighting
        const isSelected = selectedStartDate && day >= selectedStartDate && 
                         (selectedEndDate ? day <= selectedEndDate : day === selectedStartDate);

        return (
          <motion.div
            key={day.toISOString()}
            onClick={() => {
              if (isPastDate) {
                toast.error('Cannot select past dates');
                return;
              }
              if (holidayInfo) {
                toast.error(`Reservations not allowed on ${holidayInfo.name}`);
                return;
              }
              handleDayClick(day);
            }}
            className={`
              min-h-[32px] sm:min-h-[60px] p-0.5 sm:p-2 border rounded-md
              ${isCurrentMonth ? statusStyle.className : 'bg-gray-50 text-gray-400'}
              ${statusStyle.hoverClass}
              ${isSelected ? 'ring-2 ring-blue-500' : ''}
              transition-all duration-200
              ${isSameDay(day, new Date()) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
            `}
          >
            <div className="flex flex-col h-full">
              <span className={`text-[10px] sm:text-sm font-medium 
                ${isCurrentMonth ? statusStyle.textClass : ''}
                ${isSameDay(day, new Date()) ? '!text-blue-600 font-bold' : ''}`}>
                {format(day, 'd')}
              </span>
              {holidayInfo && (
                <div className="mt-0.5 hidden sm:block">
                  <span className="text-[6px] sm:text-[8px] text-violet-600 truncate">
                    Holiday
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Update getTimeSlotAvailability to properly handle business hours
const getTimeSlotAvailability = (date, hour, allReservations) => {
  // Business hours are now 5 AM to 7 PM
  if (hour < 5 || hour >= 19) return 'outside';

  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0);
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  const hasReservationInSlot = allReservations.some(res => {
    if (!res.isReserved) return false;

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);

    // Check if the slot overlaps with the reservation
    return (
      (slotStart >= resStart && slotStart < resEnd) || // Slot starts during reservation
      (slotEnd > resStart && slotEnd <= resEnd) ||    // Slot ends during reservation
      (slotStart <= resStart && slotEnd >= resEnd)    // Slot completely encompasses reservation
    );
  });

  return hasReservationInSlot ? 'reserved' : 'available';
};

// Update getTimeSlotClass to use correct business hours
const getTimeSlotClass = (date, hour, reservations) => {
  const now = new Date();
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hour, 0, 0, 0);
  
  // Check if the time slot is in the past
  if (slotDateTime < now) {
    return 'bg-gray-100 cursor-not-allowed text-gray-400';
  }

  const status = getTimeSlotAvailability(date, hour, reservations);
  
  switch (status) {
    case 'outside':
      return 'bg-gray-100 cursor-not-allowed text-gray-400';
    case 'reserved':
      return 'bg-red-100 cursor-not-allowed text-red-600';
    case 'available':
      return 'bg-green-100 hover:bg-green-200 cursor-pointer text-green-600';
    default:
      return 'bg-gray-100 cursor-not-allowed text-gray-400';
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

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 5); // 5 AM to 7 PM

  const isSlotReserved = (day, hour) => {
    return reservations.some(res => {
      if (!res.isReserved) return false;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const slotDateTime = new Date(day);
      slotDateTime.setHours(hour, 0, 0, 0);

      const resEndHour = resEnd.getHours();
      
      // For any day within the reservation period
      if (slotDateTime >= resStart && slotDateTime <= resEnd) {
        // Set fixed hours regardless of day
        return hour >= 5 && hour < 10;
      }

      return false;
    });
  };

  const getReservationInfo = (day, hour) => {
    const reservation = reservations.find(res => {
      if (!res.isReserved) return false;

      const resStart = new Date(res.startDate);
      const slotDate = new Date(day);
      slotDate.setHours(hour, 0, 0, 0);

      return (
        isSameDay(slotDate, resStart) && 
        hour === 5 // Only show info at 5 AM
      );
    });

    if (reservation) {
      return {
        ...reservation
      };
    }

    return null;
  };

  // Rest of the rendering code remains the same
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-full">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] border-b">
          <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-500">Time</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="p-2 sm:p-4 text-center border-l">
              <div className="text-xs sm:text-sm font-medium text-gray-800">
                {format(day, 'EEE')}
              </div>
              <div className="text-xs text-gray-500">
                {format(day, 'MMM d')}
              </div>
            </div>
          ))}
        </div>

        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] border-b">
            <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-500">
              {format(new Date().setHours(hour), 'ha')}
            </div>
            {days.map((day) => {
              const reservationInfo = getReservationInfo(day, hour);
              const isReserved = isSlotReserved(day, hour);

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={`p-2 border-l min-h-[80px] relative ${
                    isReserved ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  }`}
                  onClick={() => handleTimeSlotClick(day, hour)}
                >
                  {reservationInfo && (
                    <div className="absolute inset-x-0 top-0 px-2 py-1">
                      <div className="text-xs text-red-800 dark:text-red-200 whitespace-pre-line">
                        {reservationInfo.displayText}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
// Update renderDayView with enhanced full-day indication
const renderDayView = () => {
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 5); // 5 AM to 7 PM

  const getReservationStyle = (hour) => {
    const currentSlot = new Date(currentDate);
    currentSlot.setHours(hour, 0, 0, 0);

    for (const res of reservations) {
      if (!res.isReserved) continue;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);

      // Only apply style if the slot is within the exact reservation hours for this day
      if (isSameDay(currentSlot, resStart) || isSameDay(currentSlot, resEnd)) {
        const slotHour = currentSlot.getHours();
        const startHour = resStart.getHours();
        const endHour = resEnd.getHours();

        if (isSameDay(currentSlot, resStart) && slotHour >= startHour && slotHour < endHour) {
          const isStart = slotHour === startHour;
          const isEnd = slotHour === (endHour - 1);
          return {
            backgroundColor: 'rgb(254, 226, 226)', // red-100
            borderLeft: isStart ? '2px solid rgb(220, 38, 38)' : 'none',
            borderRight: isEnd ? '2px solid rgb(220, 38, 38)' : 'none'
          };
        }

        if (isSameDay(currentSlot, resEnd) && slotHour < endHour) {
          const isStart = slotHour === startHour;
          const isEnd = slotHour === (endHour - 1);
          return {
            backgroundColor: 'rgb(254, 226, 226)', // red-100
            borderLeft: isStart ? '2px solid rgb(220, 38, 38)' : 'none',
            borderRight: isEnd ? '2px solid rgb(220, 38, 38)' : 'none'
          };
        }
      }
    }
    return {};
  };

  return (
    <div className="border rounded-lg">
      <div className="text-center p-4 border-b">
        <span className="text-xl font-medium text-gray-800">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </span>
      </div>
      <div className="divide-y">
        {timeSlots.map((hour) => (
          <div
            key={hour}
            className="flex p-4 min-h-[80px] relative"
            style={getReservationStyle(hour)}
            onClick={() => handleTimeSlotClick(currentDate, hour)}
          >
            <div className="w-32 font-medium text-gray-500">
              {format(new Date().setHours(hour), 'ha')}
            </div>
            <div className="flex-1">
              {reservations.map(res => {
                if (!res.isReserved) return null;
                const resStart = new Date(res.startDate);
                const resEnd = new Date(res.endDate);
                const currentSlot = new Date(currentDate);
                currentSlot.setHours(hour, 0, 0, 0);

                if (currentSlot >= resStart && currentSlot < resEnd &&
                    currentSlot.getHours() === resStart.getHours()) {
                  return (
                    <div
                      key={res.id}
                      className="px-3 py-1 text-sm text-red-800 font-medium"
                    >
                      Reserved
                      <br />
                      {format(resStart, 'HH:mm')} - {format(resEnd, 'HH:mm')}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// Add this new time conflict check utility function
const checkTimeSlotConflicts = (startDateTime, endDateTime, reservations) => {
  return reservations.filter(res => {
    if (!res.isReserved) return false;
    
    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    
    // Convert all times to minutes since midnight for easier comparison
    const startTime = startDateTime.getHours() * 60 + startDateTime.getMinutes();
    const endTime = endDateTime.getHours() * 60 + endDateTime.getMinutes();
    const resStartTime = resStart.getHours() * 60 + resStart.getMinutes();
    const resEndTime = resEnd.getHours() * 60 + resEnd.getMinutes();
    
    // Same day comparison
    if (isSameDay(startDateTime, resStart)) {
      // Check if time ranges overlap
      return !(endTime <= resStartTime || startTime >= resEndTime);
    }
    
    // Different day comparison
    if (startDateTime > resEnd || endDateTime < resStart) {
      return false; // No overlap if completely before or after
    }
    
    // For multi-day reservations, check specific time ranges
    if (isSameDay(startDateTime, resStart)) {
      return startTime < resEndTime;
    }
    if (isSameDay(endDateTime, resEnd)) {
      return endTime > resStartTime;
    }
    
    return false;
  });
};

// Update the handleTimeSelection function
const handleTimeSelection = () => {
  if (!isSelectionValid()) {
    toast.error('Please select both dates and times');
    return;
  }

  try {
    const startDateTime = new Date(selectedStartDate);
    const endDateTime = new Date(selectedEndDate || selectedStartDate);

    startDateTime.setHours(selectedTimes.startTime || 0);
    startDateTime.setMinutes(selectedTimes.startMinute || 0);
    endDateTime.setHours(selectedTimes.endTime || 0);
    endDateTime.setMinutes(selectedTimes.endMinute || 0);

    // Add validation for business hours
    if (startDateTime.getHours() < 5 || endDateTime.getHours() >= 19) {
      toast.error('Reservations must be between 5 AM and 7 PM');
      return;
    }

    const conflicts = checkTimeSlotConflicts(startDateTime, endDateTime, reservations);
    
    if (conflicts.length > 0) {
      // Format the conflict message more clearly
      const conflictInfo = {
        conflicts: conflicts.map(conflict => ({
          start: dayjs(conflict.startDate).format('MMM D, YYYY h:mm A'),
          end: dayjs(conflict.endDate).format('MMM D, YYYY h:mm A')
        })),
        attemptedBooking: {
          start: dayjs(startDateTime).format('MMM D, YYYY h:mm A'),
          end: dayjs(endDateTime).format('MMM D, YYYY h:mm A')
        }
      };
      setConflictDetails(conflictInfo);
      setShowConflictModal(true);
      return;
    }

    onDateSelect(startDateTime, endDateTime);
    setIsDatePickerModalOpen(false);
  } catch (error) {
    console.error('Error in handleTimeSelection:', error);
    toast.error('An error occurred while processing your selection');
  }
};


const validateDateTime = (dates, times) => {
  if (!dates || !times || !Array.isArray(dates) || dates.length !== 2) return true;

  const [startDate, endDate] = dates;
  const [startTime, endTime] = times;

  // Check if we have valid dayjs objects
  if (!dayjs.isDayjs(startTime) || !dayjs.isDayjs(endTime)) {
    return false;
  }

  const startDateTime = dayjs(startDate)
    .hour(startTime.hour())
    .minute(startTime.minute());
  
  const endDateTime = dayjs(endDate)
    .hour(endTime.hour())
    .minute(endTime.minute());

  // Check if the dates are valid
  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    return false;
  }

  // Check if selected time range conflicts with existing reservations
  const hasConflict = reservations.some(reservation => {
    const resStart = dayjs(reservation.startDate);
    const resEnd = dayjs(reservation.endDate);
    
    return (
      (startDateTime.isSame(resStart) || startDateTime.isBetween(resStart, resEnd)) ||
      (endDateTime.isSame(resEnd) || endDateTime.isBetween(resStart, resEnd)) ||
      (startDateTime.isBefore(resStart) && endDateTime.isAfter(resEnd))
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

  const checkScheduleConflicts = (startDateTime, endDateTime) => {
    return reservations.filter(res => {
      if (!res.isReserved) return false;
      
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      // Check if the new booking starts during an existing reservation
      // or if the new booking ends during an existing reservation
      // or if the new booking completely encompasses an existing reservation
      const hasOverlap = (
        (startDateTime >= resStart && startDateTime < resEnd) || // New booking starts during existing reservation
        (endDateTime > resStart && endDateTime <= resEnd) || // New booking ends during existing reservation
        (startDateTime <= resStart && endDateTime >= resEnd) // New booking encompasses existing reservation
      );

      // If we're booking on the same day as a reservation that ends at 10 AM,
      // allow bookings that start at or after 10 AM
      if (startDateTime.toDateString() === resEnd.toDateString() &&
          resEnd.getHours() === 10 && 
          startDateTime.getHours() >= 10) {
        return false;
      }

      return hasOverlap && res.isReserved;
    });
  };

  const handleDateTimeSelection = (start, end) => {
    const startDateTime = dayjs(start);
    const endDateTime = dayjs(end);

    const startHour = startDateTime.hour();
    const endHour = endDateTime.hour();
    const startMinute = startDateTime.minute();
    const endMinute = endDateTime.minute();

    if (startHour < 5 || startHour > 19 || 
        endHour < 6 || endHour > 20 ||
        (startHour === 20 && startMinute > 0) ||
        (endHour === 20 && endMinute > 0)) {
      toast.error('Please select times between 5:00 AM and 8:00 PM');
      return;
    }

    const duration = endDateTime.diff(startDateTime, 'hours', true);
    if (duration < 1) {
      toast.error('Minimum booking duration is 1 hour');
      return;
    }
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
      return;
    }

    onDateSelect(startDateTime.toDate(), endDateTime.toDate());
    setIsDatePickerModalOpen(false);
  };

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
            <>
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="font-medium text-red-800 mb-2">Your attempted booking:</p>
                <p className="text-red-600">
                  From: {dayjs(conflictDetails.attemptedBooking.start).format('MMMM D, YYYY h:mm A')}
                  <br/>
                  To: {dayjs(conflictDetails.attemptedBooking.end).format('MMMM D, YYYY h:mm A')}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="font-medium text-yellow-800 mb-2">Existing reservations:</p>
                <ul className="space-y-2">
                  {conflictDetails.conflicts.map((conflict, index) => {
                    const startDate = dayjs(conflict.startDate);
                    const endDate = dayjs(conflict.endDate);
                    const isSameDay = startDate.isSame(endDate, 'day');
                    
                    return (
                      <li key={index} className="text-yellow-700">
                        {conflict.venueName && <span className="font-medium">{conflict.venueName}</span>}
                        <br />
                        {isSameDay ? (
                          `${startDate.format('MMMM D, YYYY')} from ${startDate.format('h:mm A')} to ${endDate.format('h:mm A')}`
                        ) : (
                          `${startDate.format('MMMM D')} - ${endDate.format('MMMM D, YYYY')} from ${startDate.format('h:mm A')} to ${endDate.format('h:mm A')}`
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setShowConflictModal(false);
              setSelectedTimes({
                startTime: null,
                endTime: null,
                startMinute: null,
                endMinute: null
              });
              setDateRange(null);
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
  

  // Update renderAvailabilityLegend to include yellow option
  const renderAvailabilityLegend = () => (
    <div className="flex flex-wrap gap-1 sm:gap-2 items-center mb-2 p-1 sm:p-2 bg-white rounded-lg text-[10px] sm:text-sm">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-green-100"></div>
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-yellow-100"></div>
        <span>Partially Reserved</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-red-100"></div>
        <span>Fully Reserved (5AM-7PM)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gray-100"></div>
        <span>Past</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-violet-100"></div>
        <span>Holiday</span>
      </div>
    </div>
  );

  // Add this new function to handle day clicks
  const handleDayClick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(day);
    compareDate.setHours(0, 0, 0, 0);
    
    // Only prevent dates before today (midnight)
    if (compareDate < today) {
      toast.error('Cannot select past dates');
      return;
    }
  
    const status = getAvailabilityStatus(day, reservations);
    const holidayInfo = holidays.find(h => h.date === day.toISOString().split('T')[0]);
  
    if (status === 'full') {
      toast.error('This date is already fully reserved');
      return;
    }
    
    if (holidayInfo) {
      toast.error(`Reservations not allowed on ${holidayInfo.name}`);
      return;
    }
  
    // Set only start date and open modal directly
    setSelectedStartDate(day);
    setStartDate(day);
    setEndDate(null);
    setSelectedEndDate(null);
    setIsDatePickerModalOpen(true);
    setSelectionMode('full');
  };

  // Add new handler for weekly/daily time slot clicks
  const handleTimeSlotClick = (day, hour) => {
    const now = new Date();
    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);

    if (selectedDateTime < now) {
      toast.error('Cannot select past dates');
      return;
    }

    const status = getTimeSlotAvailability(day, hour, reservations);
    if (status === 'full' || status === 'reserved') {
      toast.error('This time slot is already reserved');
      return;
    }

    // Set start date and time, then open modal
    setSelectedStartDate(selectedDateTime);
    setStartDate(selectedDateTime);
    setSelectedTimes(prev => ({
      ...prev,
      startTime: hour,
      startMinute: 0
    }));
    setEndDate(null);
    setSelectedEndDate(null);
    setIsDatePickerModalOpen(true);
    setSelectionMode('end-only');
  };

  // Add this new function to render the date range modal
  const renderDateRangeModal = () => (
    <Dialog
      open={isDatePickerModalOpen}
      onClose={() => setIsDatePickerModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-medium mb-4">
            Select Date and Time Range
          </Dialog.Title>

          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Start Date:</p>
              <p className="font-medium">{dayjs(startDate).format('MMMM D, YYYY')}</p>
            </div>
            
            <div>
              <label className="block text-sm mb-2">Start Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                placeholder="Select start time"
                disabledTime={() => ({
                  disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19),
                })}
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      startTime: time.hour(),
                      startMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-2">End Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                placeholder="Select end time"
                disabledTime={() => ({
                  disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19),
                })}
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: time.hour(),
                      endMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setIsDatePickerModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                if (!selectedTimes.startTime || !selectedTimes.endTime) {
                  toast.error('Please select both start and end times');
                  return;
                }

                const startDateTime = dayjs(startDate)
                  .hour(selectedTimes.startTime)
                  .minute(selectedTimes.startMinute || 0)
                  .toDate();

                const endDateTime = dayjs(startDate)
                  .hour(selectedTimes.endTime)
                  .minute(selectedTimes.endMinute || 0)
                  .toDate();

                if (endDateTime <= startDateTime) {
                  toast.error('End time must be after start time');
                  return;
                }

                const conflicts = checkTimeSlotConflicts(startDateTime, endDateTime, reservations);
                
                if (conflicts.length > 0) {
                  setConflictDetails({
                    conflicts,
                    attemptedBooking: {
                      start: dayjs(startDateTime).format('MMM DD, YYYY HH:mm'),
                      end: dayjs(endDateTime).format('MMM DD, YYYY HH:mm')
                    }
                  });
                  setShowConflictModal(true);
                  return;
                }

                onDateSelect(startDateTime, endDateTime);
                setIsDatePickerModalOpen(false);
              }}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  // Add this new date-time selection modal component
  const renderDateTimeSelectionModal = () => (
    <Dialog
      open={isDatePickerModalOpen}
      onClose={() => setIsDatePickerModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-[340px] sm:max-w-md">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base sm:text-lg font-semibold">
              Select Reservation Period
            </Dialog.Title>
            <button
              onClick={() => setIsDatePickerModalOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Start Date Display (not editable) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Start Date</label>
              <div className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                {dayjs(selectedStartDate).format('MMMM D, YYYY')}
              </div>
            </div>

            {/* End Date Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">End Date</label>
              <DatePicker
                className="w-full"
                value={selectedEndDate ? dayjs(selectedEndDate) : null}
                onChange={(date) => setSelectedEndDate(date.toDate())}
                disabledDate={(current) => {
                  return current < dayjs(selectedStartDate).startOf('day') ||
                         current < dayjs().startOf('day');
                }}
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Start Time</label>
                <TimePicker
                  className="w-full text-xs sm:text-sm"
                  format="HH:mm"
                  minuteStep={30}
                  popupClassName="text-xs sm:text-sm"
                  value={selectedTimes.startTime ? 
                    dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
                    null
                  }
                  disabledTime={() => ({
                    disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 20),
                    disabledMinutes: () => []
                  })}
                  onChange={(time) => {
                    if (time) {
                      setSelectedTimes(prev => ({
                        ...prev,
                        startTime: time.hour(),
                        startMinute: time.minute()
                      }));
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">End Time</label>
                <TimePicker
                  className="w-full text-xs sm:text-sm"
                  format="HH:mm"
                  minuteStep={30}
                  popupClassName="text-xs sm:text-sm"
                  value={selectedTimes.endTime ? 
                    dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
                    null
                  }
                  disabledTime={() => ({
                    disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 20),
                    disabledMinutes: (selectedHour) => {
                      if (isSameDay(selectedStartDate, selectedEndDate) &&
                          selectedHour === selectedTimes.startTime) {
                        return [...Array(60)].map((_, i) => i)
                          .filter(m => m <= selectedTimes.startMinute);
                      }
                      return [];
                    }
                  })}
                  onChange={(time) => {
                    if (time) {
                      setSelectedTimes(prev => ({
                        ...prev,
                        endTime: time.hour(),
                        endMinute: time.minute()
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
            <button
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 
                       hover:bg-gray-200 rounded-lg transition-colors"
              onClick={() => setIsDatePickerModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-500 
                       hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
              onClick={() => {
                // Validate date selection
                if (!selectedStartDate || !selectedEndDate) {
                  toast.error('Please select both start and end dates');
                  return;
                }

                // Validate time selection
                if (!selectedTimes.startTime || !selectedTimes.endTime) {
                  toast.error('Please select both start and end times');
                  return;
                }

                const startDateTime = dayjs(selectedStartDate)
                  .hour(selectedTimes.startTime)
                  .minute(selectedTimes.startMinute || 0)
                  .toDate();

                const endDateTime = dayjs(selectedEndDate)
                  .hour(selectedTimes.endTime)
                  .minute(selectedTimes.endMinute || 0)
                  .toDate();

                // Validate date-time combination
                if (endDateTime <= startDateTime) {
                  toast.error('End date-time must be after start date-time');
                  return;
                }

                // Check for conflicts
                const conflicts = checkTimeSlotConflicts(startDateTime, endDateTime, reservations);
                if (conflicts.length > 0) {
                  setConflictDetails({
                    conflicts,
                    attemptedBooking: {
                      start: dayjs(startDateTime).format('MMM DD, YYYY HH:mm'),
                      end: dayjs(endDateTime).format('MMM DD, YYYY HH:mm')
                    }
                  });
                  setShowConflictModal(true);
                  return;
                }

                // If all validations pass, proceed with the selection
                onDateSelect(startDateTime, endDateTime);
                setIsDatePickerModalOpen(false);
              }}
              disabled={!selectedStartDate || !selectedEndDate || !selectedTimes.startTime || !selectedTimes.endTime}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  // Add this new function before the return statement
const renderTimeSelectionModal = () => (
  <Dialog
    open={timeModalOpen}
    onClose={() => setTimeModalOpen(false)}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
        <Dialog.Title className="text-lg font-medium mb-4">
          Select Time Range
        </Dialog.Title>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                value={selectedTimes.startTime ? 
                  dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
                  null
                }
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      startTime: time.hour(),
                      startMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                value={selectedTimes.endTime ? 
                  dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
                  null
                }
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: time.hour(),
                      endMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
          </div>
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

  // Enhanced calendar view with loading state
  return (
    <div className="p-1.5 sm:p-4 space-y-2 sm:space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      <div className="relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 z-10 flex items-center justify-center"
            >
              <Spin size="small" />
            </motion.div>
          )}
        </AnimatePresence>

        {renderAvailabilityLegend()}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handleDateNavigation('prev')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ←
              </button>
              <h2 className="text-sm sm:text-lg font-semibold">
                {format(currentDate, 'MMM yyyy')}
              </h2>
              <button
                onClick={() => handleDateNavigation('next')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                →
              </button>
            </div>
          </div>
          
          {/* View toggles */}
          <div className="flex gap-0.5 sm:gap-2">
            {['month', 'week', 'day'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md
                  ${view === viewType 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {view === 'month' && (
          <>
            <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500 text-[10px] sm:text-sm">
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
        {renderDateRangeModal()}
        {renderConflictModal()}
        {renderDateTimeSelectionModal()}
      </div>
    </div>
  );
};

export default ReservationCalendar;


