<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset,
  FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle, FaFolder,
  FaBell, FaMoon, FaSun
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
=======
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFolder, FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset, FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle } from 'react-icons/fa';
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [isMasterFileOpen, setMasterFileOpen] = useState(false);
  const [isUsersOpen, setUsersOpen] = useState(false);
  const [isReservationOpen, setReservationOpen] = useState(false);
<<<<<<< HEAD
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3); // Example notification count
=======
  const [isSidebarOpen, setSidebarOpen] = useState(false);
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271

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
    navigate('/gsd');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You would implement the actual dark mode logic here
  };

  const sidebarVariants = {
    open: { x: 0, width: 256 },
    closed: { x: '-100%', width: 0 },
  };

  const menuItemVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 },
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
<<<<<<< HEAD
    <div className={`flex ${isDarkMode ? 'dark' : ''}`}>
      <button 
        className="p-3 fixed top-4 left-4 z-50 text-[#495E57] bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300" 
        onClick={toggleSidebar}
      >
        <FaBars />
      </button>
      <motion.aside
        initial="closed"
        animate={isSidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, type: 'tween' }}
        className={`fixed h-full bg-gradient-to-b from-emerald-800 to-emerald-950 text-white shadow-lg flex flex-col z-40`}
      >
        <div className="sidebar-header p-5 text-center">
          <motion.div 
            className="flex items-center justify-center mb-2"
            variants={menuItemVariants}
          >
            <FaUserCircle className="text-4xl" />
          </motion.div>
          <motion.h1 
            className="text-xl font-bold"
            variants={menuItemVariants}
          >
            {adminName}
          </motion.h1>
        </div>
        <nav className="sidebar-nav p-5 flex-grow overflow-y-auto">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.ul
                initial="closed"
                animate="open"
                exit="closed"
                variants={{ open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
              >
                <li className="mb-4">
                  <Link to="/adminDashboard" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                    <FaTachometerAlt className="mr-3" /> Dashboard
                  </Link>
                </li>
                <li className="mb-4">
                  <div onClick={toggleMasterFile} className="flex items-center cursor-pointer p-2 hover:bg-emerald-500 rounded transition">
                    <FaFileAlt className="mr-3" /> Master File
                    <FaChevronDown className={`ml-auto transition-transform ${isMasterFileOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isMasterFileOpen && (
                    <ul className="ml-4 mt-2 bg-emerald-800 rounded shadow-md">
                      <li className="mb-2">
                        <Link to="/Venue" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaHome className="mr-2" /> Venue
                        </Link>
                      </li>
                      <li className="mb-2">
                        <Link to="/VehicleEntry" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaCar className="mr-2" /> Vehicle
                        </Link>
                      </li>
                      <li className="mb-2">
                        <Link to="/Equipment" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaTools className="mr-2" /> Equipments
                        </Link>
                      </li>
                      <li className="mb-2">
                        <Link to="/Master" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                          <FaFolder className="mr-2" /> Master
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li className="mb-4">
                  <div onClick={toggleUsers} className="flex items-center cursor-pointer p-2 hover:bg-emerald-500 rounded transition">
                    <FaUserCircle className="mr-3" /> Users
                    <FaChevronDown className={`ml-auto transition-transform ${isUsersOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isUsersOpen && (
                    <ul className="ml-4 mt-2 bg-emerald-800 rounded shadow-md">
                      <li className="mb-2">
                        <Link to="/personel" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaUserCircle className="mr-2" /> Personnel
                        </Link>
                      </li>
                      <li className="mb-2">
                        <Link to="/Faculty" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaUserCircle className="mr-2" /> Faculty
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li className="mb-4">
                  <div onClick={toggleReservations} className="flex items-center cursor-pointer p-2 hover:bg-emerald-500 rounded transition">
                    <FaCar className="mr-3" /> Reservations
                    <FaChevronDown className={`ml-auto transition-transform ${isReservationOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isReservationOpen && (
                    <ul className="ml-4 mt-2 bg-emerald-800 rounded shadow-md">
                      <li className="mb-2">
                        <Link to="/viewReservation" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaFileAlt className="mr-2" /> View All Reservations
                        </Link>
                      </li>
                      <li className="mb-2">
                        <Link to="/ViewRequest" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaHeadset className="mr-2" /> View Requests
                        </Link>
                      </li>
                      <li className="mb-2">
                        <Link to="/AddReservation" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                          <FaCar className="mr-2" /> Add Reservation
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li className="mb-4">
                  <Link to="/settings" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                    <FaCog className="mr-3" /> Settings
                  </Link>
                </li>
                <li className="mb-4">
                  <Link to="/support" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                    <FaHeadset className="mr-3" /> Support
                  </Link>
                </li>
                <li className="mb-4">
                  <button onClick={handleLogout} className="flex items-center text-red-500 hover:bg-emerald-500 hover:text-white p-2 rounded transition w-full">
                    <FaSignOutAlt className="mr-3" /> Logout
                  </button>
                </li>
                {/* New Notifications item */}
                <motion.li className="mb-4" variants={menuItemVariants}>
                  <Link to="/notifications" className="flex items-center p-2 hover:bg-emerald-500 rounded transition">
                    <FaBell className="mr-3" />
                    Notifications
                    {notifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                        {notifications}
                      </span>
                    )}
                  </Link>
                </motion.li>

                {/* Dark Mode Toggle */}
                <motion.li className="mb-4" variants={menuItemVariants}>
                  <button 
                    onClick={toggleDarkMode} 
                    className="flex items-center w-full p-2 hover:bg-emerald-500 rounded transition"
                  >
                    {isDarkMode ? <FaSun className="mr-3" /> : <FaMoon className="mr-3" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </motion.li>
              </motion.ul>
            )}
          </AnimatePresence>
        </nav>
      </motion.aside>
      <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
=======
    <div className="flex">
      <button className="p-2 fixed top-4 left-4 z-50 text-[#495E57]" onClick={toggleSidebar}>
        <FaBars />
      </button>
      <aside className={`fixed h-full bg-gray-800 text-white shadow-lg transition-transform ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'} flex flex-col z-40`}>
        <div className="sidebar-header p-5 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaUserCircle className="text-3xl" />
          </div>
          <h1 className={`text-xl font-bold ${isSidebarOpen ? '' : 'hidden'}`}>{adminName}</h1>
          <p className={`text-sm ${isSidebarOpen ? '' : 'hidden'}`}>admin@example.com</p>
        </div>
        <nav className="sidebar-nav p-5 flex-grow overflow-y-auto">
          <ul>
            <li className="mb-4">
              <Link to="/adminDashboard" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                <FaTachometerAlt className="mr-3" /> {isSidebarOpen ? 'Dashboard' : ''}
              </Link>
            </li>
            <li className="mb-4">
              <div onClick={toggleMasterFile} className="flex items-center cursor-pointer p-2 hover:bg-blue-600 rounded transition">
                <FaFileAlt className="mr-3" /> {isSidebarOpen ? 'Master File' : ''}
                <FaChevronDown className={`ml-auto transition-transform ${isMasterFileOpen ? 'rotate-180' : ''}`} />
              </div>
              {isMasterFileOpen && (
                <ul className="ml-4 mt-2 bg-gray-700 rounded shadow-md">
                  <li className="mb-2">
                    <Link to="/Venue" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaHome className="mr-2" /> {isSidebarOpen ? 'Venue' : ''}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/VehicleEntry" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaCar className="mr-2" /> {isSidebarOpen ? 'Vehicle' : ''}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/Equipment" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaTools className="mr-2" /> {isSidebarOpen ? 'Equipments' : ''}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/Master" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaFolder className="mr-2" /> {isSidebarOpen ? 'Master' : ''}
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li className="mb-4">
              <div onClick={toggleUsers} className="flex items-center cursor-pointer p-2 hover:bg-blue-600 rounded transition">
                <FaUserCircle className="mr-3" /> {isSidebarOpen ? 'Users' : ''}
                <FaChevronDown className={`ml-auto transition-transform ${isUsersOpen ? 'rotate-180' : ''}`} />
              </div>
              {isUsersOpen && (
                <ul className="ml-4 mt-2 bg-gray-700 rounded shadow-md">
                  <li className="mb-2">
                    <Link to="/personnel" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaUserCircle className="mr-2" /> {isSidebarOpen ? 'Personnel' : ''}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/Faculty" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaUserCircle className="mr-2" /> {isSidebarOpen ? 'Faculty' : ''}
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li className="mb-4">
              <div onClick={toggleReservations} className="flex items-center cursor-pointer p-2 hover:bg-blue-600 rounded transition">
                <FaCar className="mr-3" /> {isSidebarOpen ? 'Reservations' : ''}
                <FaChevronDown className={`ml-auto transition-transform ${isReservationOpen ? 'rotate-180' : ''}`} />
              </div>
              {isReservationOpen && (
                <ul className="ml-4 mt-2 bg-gray-700 rounded shadow-md">
                  <li className="mb-2">
                    <Link to="/viewReservation" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaFileAlt className="mr-2" /> {isSidebarOpen ? 'View All Reservations' : ''}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/ViewRequest" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaHeadset className="mr-2" /> {isSidebarOpen ? 'View Requests' : ''}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/AddReservation" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                      <FaCar className="mr-2" /> {isSidebarOpen ? 'Add Reservation' : ''}
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li className="mb-4">
              <Link to="/settings" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                <FaCog className="mr-3" /> {isSidebarOpen ? 'Settings' : ''}
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/support" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                <FaHeadset className="mr-3" /> {isSidebarOpen ? 'Support' : ''}
              </Link>
            </li>
            <li className="mb-4">
              <button onClick={handleLogout} className="flex items-center text-red-500 hover:bg-red-600 hover:text-white p-2 rounded transition w-full">
                <FaSignOutAlt className="mr-3" /> {isSidebarOpen ? 'Logout' : ''}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className={`flex-grow transition-all ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
        {/* Content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
