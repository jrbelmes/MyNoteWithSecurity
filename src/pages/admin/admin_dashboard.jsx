import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import {
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Sidebar from '../../components/Sidebar';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [userLevelName] = useState('Admin');

  // Sample data for the chart
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Notes Created',
        data: [15, 22, 18, 25, 30, 20, 28],
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
      },
    ],
  };  
  useEffect(() => {
    const role = SecureStorage.getSessionItem('user_role');

    if (role !== 'Admin') {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/');
    } else {
      const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
      if (!hasLoadedBefore) {
        const timeoutId = setTimeout(() => {
          setLoading(false);
          setFadeIn(true);
          localStorage.setItem('hasLoadedDashboard', 'true');
        }, 2000);
        return () => clearTimeout(timeoutId);
      } else {
        setLoading(false);
        setFadeIn(true);
      }
    }
  }, [navigate]);


    

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weekly Notes Created',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Sample data for statistics cards
  const stats = [
    {
      title: 'Total Users',
      value: '2,534',
      change: '+12.5%',
      icon: UsersIcon,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Total Notes',
      value: '4,287',
      change: '+15.3%',
      icon: CalendarIcon,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Shared Notes',
      value: '845',
      change: '+18.2%',
      icon: CheckCircleIcon,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Active Today',
      value: '382',
      change: '+8.1%',
      icon: ClockIcon,
      color: 'from-orange-500 to-yellow-500',
    },
  ];

  // Sample data for recent activity
  const recentActivity = [
    {
      user: 'John Doe',
      action: 'created a new note',
      resource: 'Project Ideas',
      time: '2 minutes ago',
    },
    {
      user: 'Jane Smith',
      action: 'shared note with team',
      resource: 'Meeting Minutes',
      time: '15 minutes ago',
    },
    {
      user: 'Mike Johnson',
      action: 'updated note',
      resource: 'Development Tasks',
      time: '1 hour ago',
    },
    {
      user: 'Sarah Wilson',
      action: 'archived note',
      resource: 'Old Documentation',
      time: '2 hours ago',
    },
  ];

  return (
    <div className={`min-h-screen bg-gray-900 text-white transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <Sidebar userLevelName={userLevelName} />
          
          <main className="p-6 md:p-8 md:ml-64">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold mb-4 md:mb-0"
                >
                  Dashboard Overview
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105">
                    Generate Report
                  </button>
                </motion.div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className={`text-sm font-medium ${
                        stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.title}</h3>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts and Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2 bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                  <div className="h-[400px]">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-purple-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-6">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {activity.user}
                          </p>
                          <p className="text-sm text-gray-400">
                            {activity.action} - {activity.resource}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;