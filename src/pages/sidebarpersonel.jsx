import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaHeadset, FaChevronDown, FaBars, FaUserCircle } from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isReservationOpen, setReservationOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const adminName = localStorage.getItem('adminName') || '';
  const userRole = localStorage.getItem('userRole') || 'guest'; // Assume userRole is set in localStorage

  const toggleReservations = () => setReservationOpen(!isReservationOpen);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/gsd');
  };

  return (
    <div className="flex">
      <button className="lg:hidden p-2" onClick={toggleSidebar}>
        <FaBars className="text-white" />
      </button>
      <aside className={`fixed h-full bg-emerald-800 text-white shadow-lg transition-transform ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-16'} lg:translate-x-0 lg:w-64`}>
        <div className="sidebar-header p-5 text-center bg-emerald-950 border-b border-gray-600">
          <div className="flex items-center justify-center mb-2">
            <FaUserCircle className="text-3xl" />
          </div>
          <h1 className={`text-xl font-bold ${isSidebarOpen ? '' : 'hidden'}`}>{adminName}</h1>
          <p className={`text-sm ${isSidebarOpen ? '' : 'hidden'}`}>admin@example.com</p>
        </div>
        <nav className="sidebar-nav p-5">
          <ul>
            {userRole === 'personnel' && (
              <li className="mb-4">
                <Link to="/dashboard" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                  <FaTachometerAlt className="mr-3" /> {isSidebarOpen ? 'Dashboard' : ''}
                </Link>
              </li>
            )}
            {userRole === 'personnel' && (
              <li className="mb-4">
                <div onClick={toggleReservations} className="flex items-center cursor-pointer p-2 hover:bg-blue-600 rounded transition">
                  <FaCar className="mr-3" /> {isSidebarOpen ? 'Reservations' : ''}
                  <FaChevronDown className={`ml-auto transition-transform ${isReservationOpen ? 'rotate-180' : ''}`} />
                </div>
                {isReservationOpen && (
                  <ul className="ml-4 mt-2 bg-gray-700 rounded shadow-md">
                    <li className="mb-2">
                      <Link to="/viewReservation" className="flex items-center p-2 hover:bg-blue-600 rounded transition">
                        <FaHeadset className="mr-2" /> {isSidebarOpen ? 'View All Reservations' : ''}
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
            )}
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
      <div className={`flex-grow transition-all ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
