import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Sidebar from './component/sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { SecureStorage } from '../utils/encryption';

const ViewPersonnelTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;
  const [modalTaskData, setModalTaskData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'completed'
  const navigate = useNavigate();

  useEffect(() => {
          const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
          console.log("this is encryptedUserLevel", encryptedUserLevel);
          if (encryptedUserLevel !== '2' && encryptedUserLevel !== '2') {
              localStorage.clear();
              navigate('/gsd');
          }
    }, [navigate]);

 
  const fetchPersonnelTasks = async () => {
    try {
      setLoading(true);
    const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
      operation: 'fetchAssignedRelease',
      personnel_id: localStorage.getItem('user_id')
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

      if (response.data.status === 'success') {
        setTasks(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistUpdate = async (taskId, checklistItem, isVenue) => {
    try {
      // API call to update checklist status would go here
      // For now, we'll update the local state
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.master_data.checklist_id === taskId) {
            const updatedTask = { ...task };
            const checklistArray = isVenue ? 'venue_equipment' : 'vehicle_checklist';
            updatedTask[checklistArray] = updatedTask[checklistArray].map(item => 
              item.release_checklist_name === checklistItem.release_checklist_name
                ? { ...item, release_isActive: item.release_isActive === '0' ? '1' : '0' }
                : item
            );
            return updatedTask;
          }
          return task;
        })
      );
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const updateTaskStatus = async (type, id, isActive) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'updateTask',
        type: type,
        id: id,
        isActive: isActive
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        
        
        // Update modalTaskData immediately
        setModalTaskData(prevData => ({
          ...prevData,
          venue_tasks: prevData.venue_tasks?.map(task => 
            task.release_venue_id === id 
              ? { ...task, release_isActive: isActive }
              : task
          ) || [],
          vehicle_tasks: prevData.vehicle_tasks?.map(task => 
            task.release_vehicle_id === id 
              ? { ...task, release_isActive: isActive }
              : task
          ) || []
        }));

        // Refresh the main tasks list
        fetchPersonnelTasks();
      } else {
        toast.error('Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Error updating task');
    }
  };

  const fetchTaskById = async (checklistId) => {
    try {
      setModalLoading(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'fetchTaskById',
        checklist_id: checklistId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        setModalTaskData(response.data.data);
      } else {
        toast.error('Failed to fetch task details');
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      toast.error('Error loading task details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalOpen = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    fetchTaskById(task.master_data.checklist_id);
  };

  const handleRefresh = () => {
    fetchPersonnelTasks();
    toast.info('Refreshing tasks...');
  };
  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'fetchCompletedTask',
        personnel_id: localStorage.getItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.status === 'success') {
        setTasks(response.data.data || []);
      } else {
        setTasks([]);
        toast.info('No completed tasks found');
      }
    } catch (err) {
      setError('Failed to fetch completed tasks');
      console.error('Error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'completed') {
      fetchCompletedTasks();
    }
  }, [filter]);

  

  const handleSubmitTask = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'insertComplete',
        checklist_id: selectedTask.master_data.checklist_id,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Task submitted successfully');
        setIsModalOpen(false);
        
        // Remove the completed task from the local state
        setTasks(prevTasks => prevTasks.filter(task => 
          task.master_data.checklist_id !== selectedTask.master_data.checklist_id
        ));
        
        // Reset selected task
        setSelectedTask(null);
        setModalTaskData(null);
      } else {
        toast.error('Failed to submit task');
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      toast.error('Error submitting task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllTasksCompleted = (tasks) => {
    return tasks.every(task => task.release_isActive === '1');
  };

  useEffect(() => {
    fetchPersonnelTasks();
  }, []);

  // Calculate pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  // Calculate progress helper function
  const calculateProgress = (task) => {
    const items = task.venue_tasks?.length > 0 ? task.venue_tasks : task.vehicle_tasks;
    if (!items || items.length === 0) return 0;
    const completed = items.filter(item => item.release_isActive === '1').length;
    return Math.round((completed / items.length) * 100);
  };

  // Enhanced task card rendering with status
  const renderTaskCard = (task) => (
    <motion.div
      key={task.master_data.checklist_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all"
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
            {task.master_data.venue_form_name || task.master_data.vehicle_form_name}
          </h3>
          <div className="flex flex-col items-end gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {task.master_data.venue_form_name ? 'Venue' : 'Vehicle'}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              filter === 'completed' 
                ? 'bg-green-100 text-green-800'
                : task.master_data.status_checklist_name === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              {filter === 'completed' ? 'Completed' : task.master_data.status_checklist_name}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          
          {filter === 'completed' && task.master_data.completion_date && (
            <span className="text-green-600">
              Completed: {new Date(task.master_data.completion_date).toLocaleDateString()}
            </span>
          )}
        </div>
  
        <button
          onClick={() => handleModalOpen(task)}
          className={`w-full py-2 px-4 text-sm rounded-lg flex items-center justify-center gap-2 ${
            filter === 'completed'
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <span>View Details</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );

  const renderListItem = (task) => (
    <motion.div
      key={task.master_data.checklist_id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between"> 
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Reservation Name: {task.master_data.venue_form_name || task.master_data.vehicle_form_name}
          </h3>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-500">
              
            </p>
            {filter === 'completed' && task.master_data.completion_date && (
              <p className="text-sm text-green-600">
                Completed: {new Date(task.master_data.completion_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center mt-2 md:mt-0 gap-3">
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            {task.master_data.venue_form_name ? 'Venue' : 'Vehicle'}
          </span>
          {filter === 'completed' ? (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              Completed
            </span>
          ) : (
            <button
              onClick={() => handleModalOpen(task)}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Manage
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Enhanced modal content
  const renderModalContent = () => (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedTask?.master_data.venue_form_name || selectedTask?.master_data.vehicle_form_name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className={`inline-block px-2 py-0.5 rounded-full ${
              selectedTask?.master_data.status_checklist_name === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {selectedTask?.master_data.status_checklist_name}
            </span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {modalLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : modalTaskData ? (
          <>
            

            {/* Checklist Section */}
            <div className="bg-white rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Checklist Items</h3>
                <div className="text-sm text-gray-500">
                  Progress: {calculateProgress(modalTaskData)}%
                </div>
              </div>

              {/* Enhanced checklist items */}
              <div className="space-y-3">
                {(modalTaskData.venue_tasks.length > 0 
                  ? modalTaskData.venue_tasks 
                  : modalTaskData.vehicle_tasks
                ).map((item, index) => (
                  <div key={index} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {filter !== 'completed' && (
                        <input
                          type="checkbox"
                          checked={item.release_isActive === '1'}
                          onChange={() => {
                            const newStatus = item.release_isActive === '1' ? '0' : '1';
                            updateTaskStatus(
                              modalTaskData.venue_tasks.length > 0 ? 'venue' : 'vehicle',
                              item.release_venue_id || item.release_vehicle_id,
                              newStatus
                            );
                          }}
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      )}
                      <span className={`${item.release_isActive === '1' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.release_checklist_name}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      item.release_isActive === '1'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.release_isActive === '1' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Submit button section - only show for ongoing tasks */}
              {filter !== 'completed' && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTask}
                    disabled={!isAllTasksCompleted(modalTaskData.venue_tasks.length > 0 
                      ? modalTaskData.venue_tasks 
                      : modalTaskData.vehicle_tasks) || isSubmitting}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isAllTasksCompleted(modalTaskData.venue_tasks.length > 0 
                        ? modalTaskData.venue_tasks 
                        : modalTaskData.vehicle_tasks)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Submit Task</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            Failed to load task details
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6"> {/* Modified padding */}
        <div className="max-w-7xl mx-auto"> {/* Increased max-width from 6xl to 7xl */}
          {/* Header */}
          <div className="mb-4"> {/* Reduced margin bottom */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"> {/* Reduced gap */}
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setFilter('ongoing')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filter === 'ongoing'
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-600'
                    }`}
                  >
                    Ongoing
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filter === 'completed'
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-600'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Add refresh button here */}
                <button
                  onClick={handleRefresh}
                  className="p-1.5 rounded bg-gray-100 hover:bg-gray-200"
                  title="Refresh tasks"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" // Added xl breakpoint and reduced gap
              : "space-y-3" // Reduced spacing
            }>
              {currentTasks.map(task => viewMode === 'grid' ? renderTaskCard(task) : renderListItem(task))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded bg-white border disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded bg-white border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isModalOpen && selectedTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              >
                {renderModalContent()}
              </motion.div>
            )}
          </AnimatePresence>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ViewPersonnelTask;
