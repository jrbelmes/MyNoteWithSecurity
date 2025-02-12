import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-toastify';
import { DatePicker, TimePicker, Alert, Space } from 'antd';
import moment from 'moment';
const { RangePicker } = DatePicker;

const themeColors = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  light: '#E8F5E9',
  white: '#FFFFFF',
  success: '#388E3C',
  warning: '#FFA000',
  error: '#D32F2F',
  text: '#2C3E50'
};

// Resource colors mapping
const resourceColors = {
  venue: 'bg-emerald-200 text-emerald-800',
  vehicle: 'bg-purple-200 text-purple-800'
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

  useEffect(() => {
    fetchReservations();
  }, [selectedResource]);
  const fetchReservations = async () => {
    try {
      const response = await axios.post(
        'http://localhost/coc/gsd/user.php',
        {
          operation: 'fetchAvailability',
          itemType: selectedResource.type,
          itemId: selectedResource.type === 'venue' ? selectedResource.id : selectedResource.id[0]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      

      if (response.data.status === 'success') {
        // Format reservations data
        const formattedReservations = response.data.data.map(res => ({
          id: res.reservation_form_venue_id || res.reservation_form_vehicle_id,
          startDate: new Date(res.reservation_form_start_date),
          endDate: new Date(res.reservation_form_end_date),
          name: res.ven_name || res.vehicle_license,
          status: res.reservation_status_status_reservation_id,
          isReserved: res.reservation_status_status_reservation_id === '3'
        }));
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
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

  const getDateAvailabilityClass = (date, reservations) => {
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if the entire day (8am-5pm) is reserved
    const hoursToCheck = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM
    
    const reservedHours = hoursToCheck.filter(hour => {
      const timeSlot = new Date(currentDate);
      timeSlot.setHours(hour);
      return reservations.some(res => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);
        return timeSlot >= start && timeSlot <= end && res.isReserved;
      });
    });
  
    if (reservedHours.length === 0) {
      return 'bg-green-200 hover:bg-green-300'; // Fully available
    } else if (reservedHours.length === hoursToCheck.length) {
      return 'bg-red-200 hover:bg-red-300'; // Fully reserved
    } else {
      return 'bg-yellow-200 hover:bg-yellow-300'; // Partially reserved
    }
  };

  const getTimeSlotAvailability = (date, hour, reservations) => {
    return reservations.some(res => {
      const start = new Date(res.startDate);
      const end = new Date(res.endDate);
      const slotStart = new Date(date.setHours(hour, 0, 0, 0));
      const slotEnd = new Date(date.setHours(hour + 1, 0, 0, 0));
      return slotStart >= start && slotEnd <= end && res.isReserved;
    });
  };

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
          const availabilityClass = getDateAvailabilityClass(day, reservations);
          const isSelected = selectedStartDate && 
            day.toDateString() === selectedStartDate.toDateString();
          const isInRange = selectedStartDate && selectedEndDate && 
            day > selectedStartDate && day < selectedEndDate;

          // Get reservations for this day
          const dayReservations = reservations.filter(res => 
            isSameDay(day, new Date(res.startDate))
          );

          return (
            <motion.div
              key={day.toISOString()}
              className={`
                min-h-[100px] p-2 border rounded-lg cursor-pointer
                ${isCurrentMonth ? availabilityClass : 'bg-gray-100'}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${isInRange ? 'bg-blue-50' : ''}
                transition-colors duration-200
              `}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  text-sm font-medium
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Show reserved time slots */}
              {isCurrentMonth && dayReservations.length > 0 && (
                <div className="mt-1">
                  {dayReservations.map((res, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      {format(new Date(res.startDate), 'HH:mm')} - 
                      {format(new Date(res.endDate), 'HH:mm')}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

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
            {days.map((day) => (
              <div key={day.toISOString()} 
                className={`p-4 text-center border-l ${
                  getDateAvailabilityClass(day, reservations)
                }`}
              >
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {timeSlots.map((hour) => (
            <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
              <div className="p-4 font-medium text-gray-500">
                {format(new Date().setHours(hour), 'ha')} {/* Changed to 'ha' format */}
              </div>
              {days.map((day) => {
                const isTimeSlotReserved = getTimeSlotAvailability(
                  new Date(day), 
                  hour, 
                  reservations
                );

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`
                      p-2 border-l min-h-[80px] relative cursor-pointer
                      ${isTimeSlotReserved ? 'bg-red-50' : 'bg-green-50'}
                      hover:opacity-75 transition-opacity duration-200
                    `}
                    onClick={() => {
                      const selectedDate = new Date(day);
                      selectedDate.setHours(hour);
                      handleDateClick(selectedDate);
                    }}
                  >
                    {/* Display any reservations */}
                    {reservations
                      .filter(res => 
                        isSameDay(day, new Date(res.startDate)) &&
                        new Date(res.startDate).getHours() === hour
                      )
                      .map((res, idx) => (
                        <div
                          key={idx}
                          className="absolute inset-x-0 m-1 p-2 text-xs rounded-sm
                            bg-red-100 text-red-800"
                        >
                         
                        </div>
                      ))
                    }
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Update day view to show availability
  const renderDayView = () => {
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM inclusive

    return (
      <motion.div className="border rounded-lg">
        <div className="text-center p-4 border-b">
          <span className="text-xl font-medium">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        <div className="divide-y">
          {hours.map((hour) => {
            const isTimeSlotReserved = getTimeSlotAvailability(
              new Date(currentDate),
              hour,
              reservations
            );

            return (
              <div
                key={hour}
                className={`
                  flex p-4 min-h-[80px] cursor-pointer
                  ${isTimeSlotReserved ? 'bg-red-50' : 'bg-green-50'}
                  hover:opacity-75 transition-opacity duration-200
                `}
                onClick={() => {
                  const selectedDate = new Date(currentDate);
                  selectedDate.setHours(hour);
                  handleDateClick(selectedDate);
                }}
              >
                <div className="w-32 font-medium text-gray-500">
                  {format(new Date().setHours(hour), 'ha')} {/* Changed to 'ha' format */}
                </div>
                <div className="flex-1">
                  {reservations
                    .filter(res =>
                      isSameDay(currentDate, new Date(res.startDate)) &&
                      new Date(res.startDate).getHours() === hour
                    )
                    .map((res, idx) => (
                      <div
                        key={idx}
                        className="p-2 mb-1 rounded-sm bg-red-100 text-red-800"
                      >                       
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Available time slots (8 AM to 5 PM)
  const timeSlots = Array.from({ length: 10 }, (_, i) => ({
    hour: i + 8,
    label: format(new Date().setHours(i + 8), 'h:mm a')
  }));

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
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-medium mb-4">Select Time</h3>
          
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
        </div>
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

  const renderDateTimeSelection = () => (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <h4 className="mb-2 font-medium">
            Select Date Range <span className="text-red-500">*</span>
          </h4>
          <RangePicker
            className={`w-full ${!dateRange ? 'border-red-300' : ''}`}
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates);
              setTimeRange(null);
              if (dates) {
                setSelectedStartDate(dates[0].toDate());
                setSelectedEndDate(dates[1].toDate());
              }
            }}
            disabledDate={(current) => {
              return current && current < moment().startOf('day');
            }}
          />
          {!dateRange && (
            <p className="text-red-500 text-sm mt-1">Please select date range</p>
          )}
        </div>

        {dateRange && (
          <div>
            <h4 className="mb-2 font-medium">
              Select Time Range <span className="text-red-500">*</span>
            </h4>
            <TimePicker.RangePicker
              className={`w-full ${!timeRange ? 'border-red-300' : ''}`}
              value={timeRange}
              onChange={(times) => {
                setTimeRange(times);
                if (times && dateRange) {
                  validateDateTime(dateRange, times);
                }
              }}
              format="HH:mm"
              minuteStep={30}
              disabledTime={(_, type) => ({
                disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 8 || h > 17)
              })}
              hideDisabledOptions
            />
            {!timeRange && (
              <p className="text-red-500 text-sm mt-1">Please select time range</p>
            )}
          </div>
        )}

        {!dateTimeValidation.isValid && (
          <Alert
            type="error"
            message={dateTimeValidation.message}
            showIcon
          />
        )}

        {dateRange && timeRange && dateTimeValidation.isValid && (
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => {
              const startDateTime = new Date(dateRange[0]);
              startDateTime.setHours(timeRange[0].hour(), timeRange[0].minute());
              
              const endDateTime = new Date(dateRange[1]);
              endDateTime.setHours(timeRange[1].hour(), timeRange[1].minute());
              
              if (startDateTime >= endDateTime) {
                toast.error('End time must be after start time');
                return;
              }

              onDateSelect(startDateTime, endDateTime);
            }}
          >
            Confirm Selection
          </button>
        )}
      </Space>
    </div>
  );

  return (
    <div className="p-4">
      {renderDateTimeSelection()}
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

      <div className="mt-4 flex justify-end">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          onClick={() => onDateSelect(selectedStartDate, selectedEndDate)}
          disabled={!selectedStartDate || !selectedEndDate}
        >
          Confirm Dates
        </button>
      </div>

      {renderTimeSelectionModal()}
    </div>
  );
};

export default ReservationCalendar;


