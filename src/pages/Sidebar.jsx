import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset,
  FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle, FaFolder,
  FaBell, FaMoon, FaSun, FaBuilding, FaSearch, FaQuestionCircle, FaCalendarAlt, FaChartBar
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarContext = createContext();

const sidebarVariants = {
  open: { width: '16rem' },
  closed: { width: '4rem' },
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const name = localStorage.getItem('name') || 'Admin User';

  useEffect(() => {
    setActiveItem(location.pathname);
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/gsd');
    window.location.reload();
  };

  const contextValue = useMemo(() => ({ isSidebarOpen }), [isSidebarOpen]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
        <motion.aside
          initial="open"
          animate={isSidebarOpen ? "open" : "closed"}
          variants={sidebarVariants}
          transition={{ duration: 0.3, type: 'tween' }}
          className={`fixed md:relative h-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-xl flex flex-col z-40 ${
            isSidebarOpen ? 'w-64' : 'w-16'
          } transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between p-4 border-b border-green-200">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  <img src="/images/assets/phinma.png" alt="GSD Logo" className="w-8 h-8" />
                  <span className="font-semibold text-lg text-green-600">GSD Portal</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={toggleSidebar} className="text-green-600 hover:text-green-700">
              <FaBars />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            <nav className="mt-5 px-2">
              <SidebarItem icon={FaTachometerAlt} text="Dashboard" link="/adminDashboard" active={activeItem === '/adminDashboard'} />
              
              
              <SidebarDropdown icon={FaFileAlt} text="Master File" active={['/Venue', '/VehicleEntry', '/Equipment', '/Master'].includes(activeItem)}>
                <SidebarSubItem icon={FaHome} text="Venue" link="/Venue" active={activeItem === '/Venue'} />
                <SidebarSubItem icon={FaCar} text="Vehicle" link="/VehicleEntry" active={activeItem === '/VehicleEntry'} />
                <SidebarSubItem icon={FaTools} text="Equipments" link="/Equipment" active={activeItem === '/Equipment'} />
                <SidebarSubItem icon={FaFolder} text="Master" link="/Master" active={activeItem === '/Master'} />
              </SidebarDropdown>

              <SidebarItem icon={FaUserCircle} text="Users" link="/Users" active={activeItem === '/Users'} />

              <SidebarDropdown icon={FaCar} text="Reservations" active={['/viewReservation', '/ViewRequest', '/AddReservation'].includes(activeItem)}>
                <SidebarSubItem icon={FaHeadset} text="View Requests" link="/ViewRequest" active={activeItem === '/ViewRequest'} />
                <SidebarSubItem icon={FaCar} text="Add Reservation" link="/AddReservation" active={activeItem === '/AddReservation'} />
              </SidebarDropdown>

              <SidebarSubItem icon={FaFileAlt} text="Reports" link="/viewReservation" active={activeItem === '/viewReservation'} />
              
              <SidebarItem 
                icon={FaCalendarAlt} 
                text="Released & Returned Record" 
                link="/release&return" 
                active={activeItem === '/releasedReturnedRecord'} 
              />
            </nav>
          </div>

          <div className="border-t border-green-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaUserCircle className="text-2xl text-green-600" />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="font-medium text-gray-700">{name}</p>
                      
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={toggleDarkMode} className="text-green-600 hover:text-green-700">
                {isDarkMode ? <FaSun /> : <FaMoon />}
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <FaSignOutAlt />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.aside>

        {/* Main content area */}
        
      </div>
    </SidebarContext.Provider>
  );
};

// Memoize the SidebarItem component
const SidebarItem = React.memo(({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  return (
    <Link 
      to={link} 
      className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
        active ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 
        'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`text-xl ${active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-medium"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
});

// Memoize the SidebarDropdown component
const SidebarDropdown = React.memo(({ icon: Icon, text, active, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSidebarOpen } = useContext(SidebarContext);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
          active ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 
          'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`text-xl ${active ? 'text-green-600' : 'text-gray-400'}`} />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                {text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
      </button>
      {isOpen && (
        <div className="ml-4 mt-2 space-y-2" role="menu">
          {children}
        </div>
      )}
    </div>
  );
});

// Memoize the SidebarSubItem component
const SidebarSubItem = React.memo(({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  return (
    <Link 
      to={link} 
      className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
        active ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300' : 
        'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
      }`}
      role="menuitem"
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`text-sm ${active ? 'text-green-500' : 'text-gray-400'}`} />
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
});

export default Sidebar;
