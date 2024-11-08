import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEdit, FaHistory, FaBell, FaCog, FaUserFriends } from 'react-icons/fa';
import { FiCalendar, FiList, FiHelpCircle, FiBell, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';

const navButtonVariants = {
  hover: { scale: 1.05, backgroundColor: "#f3f4f6" },
  tap: { scale: 0.95 }
};

const Profile = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(3);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Christian Mark Valle',
    email: 'chsi.valle.coc@phinmaed.com',
    schoolId: '14-034-f',
    contactNum: '+63 9533593321',
    department: 'Information Technology',
    joinDate: 'Nov 2024',
    reservations: 15,
    completedReservations: 12
  });
  const handleNavigation = () => {
    navigate('/dashboard'); // Navigate to /dashboard on click
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-white text-black">
        <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white backdrop-blur-sm bg-opacity-80 shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Logo and GSD Reservation title */}
            <div className="flex items-center space-x-4" onClick={handleNavigation}>
              <motion.img 
                src="/images/assets/phinma.png"
                alt="PHINMA CDO Logo"
                className="w-12 h-12 object-cover rounded-full shadow-md"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
              />
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                GSD Reservation
              </motion.h1>
            </div>

            {/* Right side navigation */}
            <nav className="flex items-center space-x-6">
              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                onClick={() => navigate('/addReservation')}
              >
                <FiCalendar className="w-5 h-5" />
                <span>Make Reserve</span>
              </motion.button>

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                onClick={() => setIsCalendarOpen(true)}
              >
                <FiCalendar className="w-5 h-5" />
                <span>Calendar</span>
              </motion.button>

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => navigate('/viewReserve')}
              >
                <FiList className="w-5 h-5" />
                <span>View Reserve</span>
              </motion.button>

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => navigate('/support')}
              >
                <FiHelpCircle className="w-5 h-5" />
                <span>Support</span>
              </motion.button>

              {/* Notification Bell */}
              <motion.div className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="p-2 text-gray-700 hover:text-green-600 transition-colors">
                  <FiBell className="w-6 h-6" />
                  {notifications > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Settings */}
              

              {/* Profile */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <FiUser className="w-6 h-6" />
              </motion.button>

              {/* Logout */}
              <motion.button
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2 text-red-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </motion.button>
            </nav>
          </div>
        </div>
      </motion.header>


      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-48 bg-gradient-to-r from-green-100 to-white-200 relative"
      >
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-green-200 to-transparent"/>
      </motion.div>

      {/* Profile Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
  <div className="flex flex-col md:flex-row gap-6">
    
    {/* Left Column - Profile Info */}
    <div className="md:w-1/3">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-lg p-6 shadow-xl"
      >
        {/* Profile Picture */}
        <div className="relative">
          <img 
            src="/images/assets/profileni.jpg"
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-green-500"
          />
          <button className="absolute bottom-0 right-1/3 bg-green-500 p-2 rounded-full hover:bg-green-600">
            <FaEdit className="text-white" />
          </button>
        </div>

        {/* User Info */}
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold text-green-600">{userData.name}</h2>
          <p className="text-gray-500">{userData.department}</p>
        </div>

        {/* Stats */}
        
      </motion.div>
    </div>

    {/* Right Column - Details and History */}
    <div className="md:w-2/3">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-6 shadow-xl"
      >
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 text-white">
            <FaUserFriends />
            <span>Info</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            <FaHistory />
            <span>History</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            <FaCog />
            <span>Settings</span>
          </button>
        </div>

        {/* User Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-gray-600">Email</label>
            <input 
              type="email"
              value={userData.email}
              className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-600">School ID</label>
            <input 
              type="text"
              value={userData.schoolId}
              className="w-full bg-gray-100 rounded-lg px-4 py-2"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-600">Contact Number</label>
            <input 
              type="text"
              value={userData.contactNum}
              className="w-full bg-gray-100 rounded-lg px-4 py-2"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-600">Join Date</label>
            <input 
              type="text"
              value={userData.joinDate}
              className="w-full bg-gray-100 rounded-lg px-4 py-2"
              readOnly
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-green-600">Recent Activity</h3>
          <div className="space-y-4">
            {[1].map((item) => (
              <motion.div 
                key={item}
                whileHover={{ scale: 1.02 }}
                className="bg-green-50 p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">FIOGET GENERAL ASSEMBLY</p>
                  <p className="text-sm text-gray-400">2 days ago</p>
                </div>
                <span className="px-3 py-1 bg-blue-500 rounded-full text-sm text-white">
                  On Going
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</div>

    </div>
  );
};

export default Profile;
