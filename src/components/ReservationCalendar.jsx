import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from 'framer-motion';
import { FiX, FiMapPin, FiClock, FiPlus, FiCalendar } from 'react-icons/fi';

const GSDCalendar = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('all');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch_reserve.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'operation=fetchAllReservations'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        const transformedEvents = result.data.map(reservation => ({
          title: reservation.reservation_event_title,
          startDate: reservation.reservation_start_date.split(' ')[0],
          endDate: reservation.reservation_end_date.split(' ')[0],
          venue: reservation.venue_names || 'No venue specified',
          time: `${reservation.reservation_start_date.split(' ')[1]} - ${reservation.reservation_end_date.split(' ')[1]}`,
          status: reservation.reservation_status_name.toLowerCase(),
          description: reservation.reservation_description,
          equipment: reservation.equipment_names,
          vehicles: reservation.vehicle_ids
        }));

        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateInRange = (date, startDate, endDate) => {
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    return currentDate >= start && currentDate <= end;
  };

  const getEventStatus = (startDate) => {
    const today = new Date();
    const eventDate = new Date(startDate);
    
    if (eventDate < today) {
      return 'completed';
    } else if (eventDate.toDateString() === today.toDateString()) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  const statusColors = {
    upcoming: {
      bg: 'bg-emerald-50',
      hover: 'hover:bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      indicator: 'bg-emerald-400'
    },
    reserve: {
      bg: 'bg-green-50',
      hover: 'hover:bg-green-100',
      text: 'text-green-800',
      border: 'border-green-500',
      badge: 'bg-green-100 text-green-800 border-green-200',
      indicator: 'bg-green-400'
    },
    pending: {
      bg: 'bg-yellow-100',
      hover: 'hover:bg-yellow-200',
      text: 'text-yellow-800',
      border: 'border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      indicator: 'bg-yellow-400'
    },
    completed: {
      bg: 'bg-green-100',
      hover: 'hover:bg-green-200',
      text: 'text-green-800',
      border: 'border-green-500',
      badge: 'bg-green-100 text-green-800 border-green-200',
      indicator: 'bg-green-400'
    },
    expired: {
      bg: 'bg-gray-100',
      hover: 'hover:bg-gray-200',
      text: 'text-gray-800',
      border: 'border-gray-500',
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
      indicator: 'bg-gray-400'
    }
  };

  const getTileClassName = ({ date }) => {
    const formattedDate = formatDate(date);
    let classes = 'transition-all duration-200 relative';
    
    const eventsOnDate = events.filter(event => 
      isDateInRange(formattedDate, event.startDate, event.endDate)
    );

    if (eventsOnDate.length > 0) {
      const primaryEvent = eventsOnDate[0];
      const colors = statusColors[primaryEvent.status] || statusColors.upcoming;
      
      classes += ` ${colors.bg} ${colors.hover} ${colors.text}`;

      const isStartDate = eventsOnDate.some(event => 
        new Date(event.startDate).toISOString().split('T')[0] === formattedDate
      );
      const isEndDate = eventsOnDate.some(event => 
        new Date(event.endDate).toISOString().split('T')[0] === formattedDate
      );

      if (isStartDate) classes += ` rounded-l-lg border-l-4 ${colors.border}`;
      if (isEndDate) classes += ` rounded-r-lg border-r-4 ${colors.border}`;
    }

    return classes;
  };

  const getTileContent = ({ date }) => {
    const formattedDate = formatDate(date);
    const eventsOnDate = events.filter(event => 
      isDateInRange(formattedDate, event.startDate, event.endDate)
    );

    if (eventsOnDate.length > 0) {
      const primaryEvent = eventsOnDate[0];
      const colors = statusColors[primaryEvent.status] || statusColors.upcoming;

      return (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-0.5 p-1">
          <div className={`h-1 rounded-full ${colors.indicator}`}></div>
          {eventsOnDate.length > 1 && (
            <span className={`text-xs font-medium ${colors.text}`}>
              {eventsOnDate.length} events
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  const EventCard = ({ event }) => {
    const colors = statusColors[event.status];

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
        className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${colors.border} hover:shadow-lg transition-shadow`}
      >
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-lg text-gray-800">{event.title}</h4>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
            {event.status}
          </span>
        </div>
        <div className="mt-3 space-y-2 text-gray-600">
          <div className="flex items-center space-x-2">
            <FiCalendar className="w-4 h-4 text-green-500" />
            <span className="text-sm">
              {new Date(event.startDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} 
              {' - '}
              {new Date(event.endDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FiMapPin className="w-4 h-4 text-green-500" />
            <span className="text-sm">{event.venue}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiClock className="w-4 h-4 text-green-500" />
            <span className="text-sm">{event.time}</span>
          </div>
          
        </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">GSD Calendar</h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-white text-green-600 shadow-md' 
                    : 'bg-green-500 hover:bg-green-400'
                }`}
              >
                All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('upcoming')}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  filterStatus === 'upcoming' 
                    ? 'bg-white text-green-600 shadow-md' 
                    : 'bg-green-500 hover:bg-green-400'
                }`}
              >
                Upcoming
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  filterStatus === 'completed' 
                    ? 'bg-white text-green-600 shadow-md' 
                    : 'bg-green-500 hover:bg-green-400'
                }`}
              >
                Completed
              </motion.button>
              <button onClick={onClose} className="ml-4">
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white p-4 rounded-xl shadow-md"
          >
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={getTileClassName}
              tileContent={getTileContent}
              formatShortWeekday={(locale, date) => 
                date.toLocaleDateString('en', { weekday: 'short' })
              }
              className={`
                rounded-lg border-none w-full
                [&_.react-calendar__tile]:h-16
                [&_.react-calendar__month-view__days__day]:font-medium
                [&_.react-calendar__navigation__arrow]:text-2xl
                [&_.react-calendar__navigation__label]:font-bold
                [&_.react-calendar__navigation]:mb-4
                [&_.react-calendar__month-view__weekdays]:mb-2
                [&_.react-calendar__month-view__weekdays__weekday]:font-medium
                [&_.react-calendar__tile--now]:bg-green-50
                [&_.react-calendar__tile--active]:bg-green-100
                [&_.react-calendar__tile--active]:text-green-800
                [&_.react-calendar__tile]:relative
                [&_.react-calendar__tile]:rounded-md
                [&_.react-calendar__navigation__arrow]:hover:bg-green-50
                [&_.react-calendar__tile]:hover:bg-green-50
              `}
              minDetail="month"
              maxDetail="month"
              defaultView="month"
              showNeighboringMonth={true}
              showNavigation={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <div className="space-y-4 max-h-[500px] overflow-y-auto px-4 custom-scrollbar">
              {events
                .filter(event => 
                  (filterStatus === 'all' || event.status === filterStatus) &&
                  isDateInRange(formatDate(selectedDate), event.startDate, event.endDate)
                )
                .map((event, index) => (
                  <EventCard key={index} event={event} />
                ))}
              
              {events.filter(event => 
                isDateInRange(formatDate(selectedDate), event.startDate, event.endDate)
              ).length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500"
                >
                  <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">No events scheduled for this date</p>
                  <p className="text-sm">Select a different date or add a new event</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default GSDCalendar;