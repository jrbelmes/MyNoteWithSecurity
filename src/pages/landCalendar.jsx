import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import Sidebar from './Sidebar';
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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showYearSelect, setShowYearSelect] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);

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
        className="grid grid-cols-7 gap-1" /* decreased gap */
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <motion.div
              key={day.toString()}
              className={`
                min-h-[100px] p-2 border rounded-lg /* decreased height and padding */
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isSameDay(day, new Date()) ? 'border-blue-500 border-2' : 'border-gray-200'}
                hover:shadow-lg transition-shadow duration-200
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`
                text-base font-semibold /* decreased from text-lg */
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              `}>
                {format(day, 'd')}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-auto max-h-[800px] border rounded-lg">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r bg-gray-50">
            <div className="h-16 border-b"></div> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b px-2 py-1">
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
                {hours.map(hour => (
                  <motion.div
                    key={`${day}-${hour}`}
                    className="h-20 border-b border-r hover:bg-blue-50 cursor-pointer relative group"
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Event indicators would go here */}
                  </motion.div>
                ))}
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
      <div className="overflow-auto max-h-[800px] border rounded-lg">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r bg-gray-50">
            <div className="h-16 border-b"></div> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-24 border-b px-2 py-1">
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
            {hours.map(hour => (
              <motion.div
                key={hour}
                className="h-24 border-b hover:bg-blue-50 cursor-pointer relative group"
                whileHover={{ scale: 1.01 }}
              >
                {/* Events would render here */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-blue-500 hover:text-blue-700 text-sm">
                    + Add event
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-4"> {/* decreased from p-8 */}
          <motion.div 
            className="bg-white rounded-xl shadow-2xl p-6" /* decreased from p-8 */
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6"> {/* decreased from mb-10 */}
              <div className="flex items-center space-x-4"> {/* decreased from space-x-6 */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full hover:bg-gray-100"
                  onClick={() => handleDateNavigation('prev')}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="relative">
                  <h2 
                    className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-500" /* decreased from text-4xl */
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
                    className={`px-4 py-2 rounded-lg ${
                      view === viewOption 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
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
                    <div key={day} className="text-center text-base font-semibold text-gray-600 py-1"> {/* decreased text and padding */}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
