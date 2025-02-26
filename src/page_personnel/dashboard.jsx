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
  FiUsers,
  FiClipboard,
  FiFilter,
  FiMapPin,
  FiPlus
} from 'react-icons/fi';
import ReservationCalendar from '../components/ReservationCalendar';
import Sidebar from './component/sidebar';  // Updated import path
import { format } from 'timeago.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [statistics, setStatistics] = useState({
    assignedTasks: 0,
    completedTasks: 0
  });
  const [refreshKey, setRefreshKey] = useState(0); // Add this new state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [recentActivities, setRecentActivities] = useState([]);

  const statsData = [
    { title: "Assigned Tasks", value: statistics.assignedTasks, icon: FiClipboard, color: "bg-blue-600" },
    { title: "Completed Tasks", value: statistics.completedTasks, icon: FiCheck, color: "bg-green-600" }
  ];

  const priorityItems = [
    { id: 1, title: "Urgent Approval Required", venue: "Main Hall", time: "2:00 PM", priority: "high" },
    { id: 2, title: "Facility Inspection", venue: "Conference Room A", time: "3:30 PM", priority: "medium" },
    { id: 3, title: "Schedule Conflict Resolution", venue: "Auditorium", time: "4:00 PM", priority: "high" }
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
      if (result.status === 'success' && Array.isArray(result.data)) {
        setNotifications(result.data);
      } else if (result.status === 'error' && result.message === 'No checklists found') {
        setNotifications([]); // Set empty array when no records found
        console.log('No notifications available');
      } else {
        console.error('Failed to fetch notifications:', result);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };


  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/personnel.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchAssignedRelease',
          personnel_id: localStorage.getItem('user_id')
        })
      });

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Transform the data to match our needs
        const transformedTasks = result.data.map(item => ({
          id: item.master_data.checklist_id,
          title: item.master_data.vehicle_form_name,
          venue: item.master_data.venue_form_name,
          time: new Date(item.master_data.vehicle_form_start_date).toLocaleTimeString(),
          startDate: new Date(item.master_data.vehicle_form_start_date).toLocaleDateString(),
          endDate: new Date(item.master_data.vehicle_form_end_date).toLocaleDateString(),
          status: item.master_data.status_checklist_name,
          priority: item.master_data.checklist_status_id === "4" ? "high" : "medium"
        }));
        setPriorityTasks(transformedTasks);
      } else {
        setPriorityTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setPriorityTasks([]);
    }
  };

  const formatTimeAgo = (date) => {
    return format(new Date(date));
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/personnel.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchRecent'
        })
      });

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const transformedActivities = result.data.map(item => ({
          type: 'Task Added',
          message: `Task was added`,
          time: item.checklist_updated_at,
          timeAgo: formatTimeAgo(item.checklist_updated_at)
        }));
        setRecentActivities(transformedActivities);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = priorityTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(priorityTasks.length / itemsPerPage);

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
    fetchRecentActivities();
  }, [refreshKey]); // Add refreshKey as dependency

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    setUserName(storedName || 'User');
  }, []);

  const handleTaskComplete = async (taskId) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateTaskStatus',
          task_id: taskId,
          status: 'completed'
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Trigger a refresh of the tasks
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-x-hidden">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-gray-600">Welcome back, {userName}</h1>
          </div>
          <div className="flex gap-4">
           
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</h3>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority Tasks */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Priority Tasks</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <FiFilter className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {currentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active tasks available</p>
                </div>
              ) : (
                <>
                  {currentTasks.map((item) => (
                    <div key={item.id} className={`p-4 rounded-lg border-l-4 ${
                      item.priority === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                    }`}>
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-4 h-4" /> {item.venue}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" /> {item.time}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <span>From: {item.startDate}</span>
                          <span>To: {item.endDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            item.status.toLowerCase() === 'pending' ? 'text-yellow-600' : 'text-blue-600'
                          }`}>
                            Status: {item.status}
                          </span>
                          <button 
                            onClick={() => handleTaskComplete(item.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Recent Activities</h2>
              <select className="text-sm border rounded-lg px-2 py-1">
                <option>All Activities</option>
                <option>Approvals</option>
                <option>Rejections</option>
                <option>Updates</option>
              </select>
            </div>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-2 rounded-full shrink-0 bg-blue-100 text-blue-600">
                      <FiClipboard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">{activity.message}</p>
                        <span className="text-sm text-gray-500">{activity.timeAgo}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className="font-medium text-blue-600">{activity.type}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
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
