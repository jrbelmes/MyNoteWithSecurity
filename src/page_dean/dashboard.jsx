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
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiGrid,
  FiInbox,
  FiFileText
} from 'react-icons/fi';
import ReservationCalendar from '../components/ReservationCalendar';
import DeanSidebar from './component/dean_sidebar';
import ViewApproval from './component/viewApproval';
import { SecureStorage } from '../utils/encryption';

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

  useEffect(() => {
            const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
            console.log("this is encryptedUserLevel", encryptedUserLevel);
            if (encryptedUserLevel !== '5' && encryptedUserLevel !== '6') {
                localStorage.clear();
                navigate('/gsd');
            }
      }, [navigate]);





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



        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* Pending Approvals */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Pending Approvals</h3>
            </div>
            <ViewApproval />
          </motion.div>

          {/* Recent Activities */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {/* Add today's events list here */}
            </div>
          </motion.div>
        </div>
        <ReservationCalendar 
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
        />
      </main>
    </div>
  );
};

export default Dashboard;
