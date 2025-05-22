import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DocumentTextIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import Sidebar from '../../components/Sidebar';
import { SecureStorage } from '../../utils/encryption';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [userLevelName, setUserLevelName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  // Simulated notes data for demonstration
  const [notes, setNotes] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Fake user data fetching example
    setUserData({ name: 'John Doe' });

    // Simulate fetching user notes from API or localStorage
    const storedNotes = JSON.parse(localStorage.getItem('user_notes')) || [];

    // If no notes, add a default welcome note
    if (storedNotes.length === 0) {
      setNotes([
        {
          id: 1,
          title: 'Welcome to your notes!',
          excerpt: 'Start creating notes to keep track of your thoughts...',
        },
      ]);
    } else {
      setNotes(storedNotes);
    }

    // Role check and loading animation
    const role = SecureStorage.getSessionItem('user_role');
    if (role !== 'User') {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/');
    } else {
      setUserLevelName(role);
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar userLevelName={userLevelName} />

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-8 rounded-2xl">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <main className={`transition-all duration-500 md:ml-64 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6">
            <div className="fixed inset-0 z-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_40%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]"></div>
            </div>

            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-white mb-8">
                Welcome Back{userData?.name ? `, ${userData.name}` : ''}!
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Notes Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-2xl bg-gray-800/50 backdrop-blur-lg border border-gray-700 flex flex-col"
                >
                  <h3 className="text-xl font-semibold text-white mb-4">Your Notes</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                    {notes.length}
                  </div>
                  <p className="text-gray-400 mt-2 mb-4">Total Notes</p>

                  {notes.length > 0 ? (
                    <ul className="flex-1 overflow-auto space-y-2 mb-4">
                      {notes.slice(0, 3).map((note) => (
                        <li
                          key={note.id}
                          className="text-gray-300 text-sm truncate cursor-pointer hover:text-white"
                          title={note.title}
                          onClick={() => navigate('/user/view-notes')}
                        >
                          • {note.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">You have no notes yet. Start adding some!</p>
                  )}

                  <button
                    onClick={() => navigate('/user/view-notes')}
                    className="mt-auto inline-flex items-center px-3 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Create / View Notes
                  </button>
                </motion.div>

                {/* Quick Actions Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="p-6 rounded-2xl bg-gray-800/50 backdrop-blur-lg border border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/user/view-notes')}
                      className="flex items-center text-gray-300 hover:text-white transition-colors"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      View Notes
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default UserDashboard;
