import React, { useState, useEffect, createContext, useContext } from 'react';
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  const name = localStorage.getItem('name') || 'Admin User';

  useEffect(() => {
    setActiveItem(location.pathname);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [location]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/gsd');
    window.location.reload();
  };

  return (
    <SidebarContext.Provider value={{ isSidebarOpen }}>
      <div className="flex h-screen bg-white">
        <motion.aside
          initial="open"
          animate={isSidebarOpen ? "open" : "closed"}
          variants={sidebarVariants}
          transition={{ duration: 0.3, type: 'tween' }}
          className={`fixed md:relative h-full bg-white text-gray-700 shadow-xl flex flex-col z-40 ${
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
              <SidebarItem icon={FaTachometerAlt} text="Dashboard" link="/personeldasboard" active={activeItem === '/adminDashboard'} />
              
            
              <SidebarDropdown icon={FaCar} text="Reservations" active={['/viewReservation', '/ViewRequest', '/AddReservation'].includes(activeItem)}>
                <SidebarSubItem icon={FaHeadset} text="View Requests" link="/ViewRequest" active={activeItem === '/ViewRequest'} />
                <SidebarSubItem icon={FaCar} text="Add Reservation" link="/AddReservation" active={activeItem === '/AddReservation'} />
              </SidebarDropdown>

              <SidebarSubItem icon={FaFileAlt} text="Reports" link="/viewReservation" active={activeItem === '/viewReservation'} />
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
        <div className="flex-1 p-10 overflow-y-auto bg-gray-50">
          {/* Your main content goes here */}
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

const SidebarItem = ({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  return (
    <Link to={link} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${active ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-green-50 hover:text-green-600'}`}>
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
    </Link>
  );
};

const SidebarDropdown = ({ icon: Icon, text, active, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSidebarOpen } = useContext(SidebarContext);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${active ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-green-50 hover:text-green-600'}`}
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
        <div className="ml-4 mt-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

const SidebarSubItem = ({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  return (
    <Link to={link} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${active ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}`}>
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
};

export default Sidebar;
