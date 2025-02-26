import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, 
  FiBarChart2, 
  FiCalendar, 
  FiList, 
  FiHelpCircle,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiTrash2,
  FiMessageSquare
} from 'react-icons/fi';
import ReservationCalendar from '../components/ReservationCalendar';
import DeanSidebar from './component/dean_sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showSupportTicket, setShowSupportTicket] = useState(false);

  const navButtonVariants = {
    hover: { 
      scale: 1.05,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const statsData = [
    { title: "Total Reservations", value: "156", icon: FiBarChart2, color: "bg-blue-500" },
    { title: "Pending Requests", value: "8", icon: FiCalendar, color: "bg-yellow-500" },
    { title: "Approved Today", value: "12", icon: FiList, color: "bg-green-500" },
  ];

  const recentActivities = [
    { type: "Approved", message: "Roofdeck reservation approved", time: "2 minutes ago" },
    { type: "Pending", message: "New reservation request for Ms Lobby", time: "1 hour ago" },
    { type: "Cancelled", message: "Multipurpose Hall reservation cancelled", time: "3 hours ago" },
    { type: "Completed", message: "Event in Auditorium completed", time: "5 hours ago" },
  ];

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch_reserve.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchNotificationsByUserId',
          user_id: localStorage.getItem('user_id')
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setNotifications(result.data);
      } else {
        console.error('Failed to fetch notifications:', result);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateNotification',
          notification_id: notificationId
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Update local state to reflect the change
        setNotifications(notifications.map(notif => 
          notif.notification_id === notificationId 
            ? {...notif, is_read_by_user: '1'}
            : notif
        ));
      } else {
        console.error('Failed to mark notification as read:', result.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    setUserName(storedName || 'User');
  }, []);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  
  

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-white">
      <DeanSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-80 mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome back, {userName}! 👋
          </h2>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your reservations today.
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                </div>
                <div className={`${stat.color} p-3 rounded-full text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`
                    p-2 rounded-full 
                    ${activity.type === 'Approved' ? 'bg-green-100 text-green-600' :
                      activity.type === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'Cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'}
                  `}>
                    <FiBarChart2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{activity.message}</p>
                    <p className="text-gray-400 text-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors">
                <FiCalendar className="w-5 h-5" />
                <span>New Reservation</span>
              </button>
              <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors">
                <FiList className="w-5 h-5" />
                <span>View Schedule</span>
              </button>
              <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors">
                <FiHelpCircle className="w-5 h-5" />
                <span>Get Help</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <ReservationCalendar 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
