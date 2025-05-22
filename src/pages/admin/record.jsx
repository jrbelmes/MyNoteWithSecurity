import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FiSearch, 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiTrash2,
  FiEdit,
  FiRefreshCw
} from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import { SecureStorage } from '../../utils/encryption';

// Sample data
const sampleNotes = [
  {
    id: 1,
    title: "Meeting Notes",
    content: "Discussed project timeline and deliverables for Q2. Team agreed on new milestones.",
    user_id: "USER001",
    created_at: "2024-03-15T10:30:00"
  },
  {
    id: 2,
    title: "Project Update",
    content: "Frontend development is progressing well. Backend API integration scheduled for next week.",
    user_id: "USER002",
    created_at: "2024-03-14T15:45:00"
  },
  {
    id: 3,
    title: "Client Feedback",
    content: "Received positive feedback on the new dashboard design. Some minor adjustments needed.",
    user_id: "USER003",
    created_at: "2024-03-13T09:15:00"
  },
  {
    id: 4,
    title: "Team Meeting",
    content: "Weekly sync-up completed. All team members reported good progress on their tasks.",
    user_id: "USER004",
    created_at: "2024-03-12T14:20:00"
  },
  {
    id: 5,
    title: "Bug Report",
    content: "Identified and fixed critical bug in user authentication flow. Testing completed successfully.",
    user_id: "USER005",
    created_at: "2024-03-11T11:00:00"
  },
  {
    id: 6,
    title: "Feature Planning",
    content: "Planning session for new feature implementation. Created detailed technical specifications.",
    user_id: "USER006",
    created_at: "2024-03-10T16:30:00"
  }
];

const Record = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(sampleNotes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userLevelName, setUserLevelName] = useState('Admin');

  useEffect(() => {
    const storedUserLevelName = SecureStorage.getSessionItem('user_level_name');
    if (storedUserLevelName) {
      setUserLevelName(storedUserLevelName);
    }
  }, []);

  useEffect(() => {
    const userRole = SecureStorage.getSessionItem('user_role');
    if (userRole !== 'Admin') {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real application, you would fetch data from your API here
        // For now, we'll just reset to the sample data
        setNotes(sampleNotes);
      } catch (err) {
        setError('Failed to fetch notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const filterNotes = () => {
    let filtered = [...notes];
    
    if (searchTerm) {
      filtered = filtered.filter(
        note =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return filtered;
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar userLevelName={userLevelName} />
        <div className="flex items-center justify-center min-h-screen md:ml-64">
          <div className="p-8 rounded-2xl">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar userLevelName={userLevelName} />
        <div className="flex items-center justify-center min-h-screen md:ml-64">
          <div className="p-8 bg-gray-800 rounded-2xl shadow-lg">
            <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center"
            >
              <FiRefreshCw className="mr-2" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar userLevelName={userLevelName} />
      <div className="transition-all duration-300 md:ml-64">
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6">
          {/* Background Gradients */}
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_40%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">User Records</h1>
                  <p className="text-gray-400 mt-1">Manage and view all user notes</p>
                </div>
                
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center"
                >
                  <FiRefreshCw className="mr-2" /> Refresh
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="mt-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or content..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <select
                    className="px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800/50 text-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">By Title</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Grid */}
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterNotes().map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 group border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {note.title}
                        </h2>
                        <span className="text-sm text-gray-400 flex items-center mt-1">
                          <FiUser className="mr-1" />
                          User ID: {note.user_id}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-purple-400 transition-colors">
                          <FiEdit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
                      <p className="text-gray-300 line-clamp-3">{note.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center">
                        <FiCalendar className="mr-1" />
                        {format(new Date(note.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="mr-1" />
                        {format(new Date(note.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {filterNotes().length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-700"
              >
                <div className="flex flex-col items-center gap-4">
                  <FiSearch className="w-12 h-12 text-gray-400" />
                  <p className="text-gray-400 text-lg">No notes found</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record;