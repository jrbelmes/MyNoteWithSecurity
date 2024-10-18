import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFolder, FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset, FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle } from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isMasterFileOpen, setMasterFileOpen] = useState(false);
  const [isUsersOpen, setUsersOpen] = useState(false);
  const [isReservationOpen, setReservationOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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

  return (
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
        {/* Content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
