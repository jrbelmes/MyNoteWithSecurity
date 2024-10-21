import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset,
  FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle, FaFolder,
  FaBell, FaMoon, FaSun, FaBuilding
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const sidebarVariants = {
  open: { x: 0, width: 256 },
  closed: { x: -220, width: 256 },
};

const menuItemVariants = {
  open: { opacity: 1, x: 0 },
  closed: { opacity: 0, x: -20 },
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [isMasterFileOpen, setMasterFileOpen] = useState(false);
  const [isUsersOpen, setUsersOpen] = useState(false);
  const [isReservationOpen, setReservationOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3); // Example notification count

  const adminName = localStorage.getItem('adminName') || '';

  const toggleMasterFile = () => {
    setMasterFileOpen(!isMasterFileOpen);
  };

  const toggleUsers = () => {
    setUsersOpen(!isUsersOpen);
  };

  const toggleReservations = () => {
    setReservationOpen(!isReservationOpen);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
    navigate('/gsd');
     // Add this line to refresh the window
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Implement dark mode logic here
  };

  // Detect route changes and keep the correct toggle open
  useEffect(() => {
    if (location.pathname.includes('/Venue') || location.pathname.includes('/VehicleEntry') || location.pathname.includes('/Equipment')) {
      setMasterFileOpen(true);
    } else {
      setMasterFileOpen(false);
    }

    if (location.pathname.includes('/personnel') || location.pathname.includes('/Faculty')) {
      setUsersOpen(true);
    } else {
      setUsersOpen(false);
    }

    if (location.pathname.includes('/viewReservation') || location.pathname.includes('/ViewRequest') || location.pathname.includes('/AddReservation')) {
      setReservationOpen(true);
    } else {
      setReservationOpen(false);
    }
  }, [location]); // Update the toggles whenever the location changes

  return (
    <div className={`flex ${isDarkMode ? 'dark' : ''}`}>
      <button 
        className={`fixed top-1 z-50 text-emerald-700 bg-white rounded-full shadow-lg hover:bg-emerald-50 transition-all duration-300 p-3 ${isSidebarOpen ? 'left-64' : 'left-10'}`}
        onClick={toggleSidebar}
      >
        <FaBars />
      </button>
      <motion.aside
        initial="open"
        animate={isSidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, type: 'tween' }}
        className={`fixed h-full bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 text-white shadow-xl flex flex-col z-40 overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-16'}`}
      >
        <div className="sidebar-header p-6 text-center bg-emerald-900 rounded-br-[40px] shadow-md">
          <motion.div 
            className="flex items-center justify-center mb-4"
            variants={menuItemVariants}
          >
            <img src="/images/assets/phinma.png" alt="GSD Logo" className="w-12 h-12 mr-3" />
            <h2 className="text-xl font-bold">General Service Department</h2>
          </motion.div>
          <motion.div 
            className="flex items-center justify-center mt-4"
            variants={menuItemVariants}
          >
            <FaUserCircle className="text-3xl mr-2" />
            <h1 className="text-lg font-semibold">{adminName}</h1>
          </motion.div>
        </div>
        <nav className="sidebar-nav p-5 flex-grow overflow-y-auto custom-scrollbar">
          <ul className="space-y-2">
            <SidebarItem icon={FaTachometerAlt} text="Dashboard" link="/adminDashboard" />
            <SidebarDropdown
              icon={FaFileAlt}
              text="Master File"
              isOpen={isMasterFileOpen}
              toggleOpen={toggleMasterFile}
            >
              <SidebarSubItem icon={FaHome} text="Venue" link="/Venue" />
              <SidebarSubItem icon={FaCar} text="Vehicle" link="/VehicleEntry" />
              <SidebarSubItem icon={FaTools} text="Equipments" link="/Equipment" />
              <SidebarSubItem icon={FaFolder} text="Master" link="/Master" />
            </SidebarDropdown>
            <SidebarDropdown
              icon={FaUserCircle}
              text="Users"
              isOpen={isUsersOpen}
              toggleOpen={toggleUsers}
            >
              <SidebarSubItem icon={FaUserCircle} text="Personnel" link="/personel" />
              <SidebarSubItem icon={FaUserCircle} text="Faculty" link="/Faculty" />
            </SidebarDropdown>
            <SidebarDropdown
              icon={FaCar}
              text="Reservations"
              isOpen={isReservationOpen}
              toggleOpen={toggleReservations}
            >
              <SidebarSubItem icon={FaFileAlt} text="View All Reservations" link="/viewReservation" />
              <SidebarSubItem icon={FaHeadset} text="View Requests" link="/ViewRequest" />
              <SidebarSubItem icon={FaCar} text="Add Reservation" link="/AddReservation" />
            </SidebarDropdown>
            <SidebarItem icon={FaCog} text="Settings" link="/settings" />
            <SidebarItem icon={FaHeadset} text="Support" link="/support" />
          </ul>
        </nav>
        <div className="sidebar-footer p-4 bg-emerald-900  shadow-inner">
          <div className="flex flex-col items-center">
           
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center w-full py-2 px-4 text-red-400 hover:bg-red-400 hover:text-white rounded-full transition-all duration-300"
            >
              <FaSignOutAlt className="mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
      <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Content goes here */}
      </div>
    </div>
  );
};

// Updated components to accept variants prop
const SidebarItem = ({ icon: Icon, text, link, variants }) => (
  <motion.li variants={variants}>
    <Link to={link} className="flex items-center p-3 hover:bg-emerald-600 rounded-xl transition-all duration-200 group">
      <Icon className="mr-3 text-emerald-300 group-hover:text-white transition-colors" />
      <span className="group-hover:translate-x-1 transition-transform">{text}</span>
    </Link>
  </motion.li>
);

const SidebarDropdown = ({ icon: Icon, text, isOpen, toggleOpen, children, variants }) => (
  <motion.li variants={variants}>
    <div 
      onClick={toggleOpen} 
      className="flex items-center cursor-pointer p-3 hover:bg-emerald-600 rounded-xl transition-all duration-200 group"
    >
      <Icon className="mr-3 text-emerald-300 group-hover:text-white transition-colors" />
      <span className="flex-grow group-hover:translate-x-1 transition-transform">{text}</span>
      <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </div>
    {isOpen && (
      <ul className="ml-4 mt-2 space-y-1 pr-2">
        {children}
      </ul>
    )}
  </motion.li>
);

const SidebarSubItem = ({ icon: Icon, text, link, variants }) => (
  <motion.li variants={variants}>
    <Link 
      to={link} 
      className="flex items-center p-2 my-1 hover:bg-emerald-100 hover:text-emerald-800 text-emerald-100 bg-emerald-800 bg-opacity-30 rounded-lg transition-all duration-200 group border border-emerald-300"
    >
      <Icon className="mr-2 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
      <span className="group-hover:translate-x-1 transition-transform text-sm">{text}</span>
    </Link>
  </motion.li>
);

export default Sidebar;
