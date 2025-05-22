import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Modal } from 'antd';
import Sidebar from '../../components/Sidebar';
import { SecureStorage } from '../../utils/encryption';

const defaultNotes = [
  {
    id: 1,
    title: 'Welcome Note',
    content: 'This is your first note. Feel free to create more notes!',
    created_at: new Date('2025-05-01T10:00:00'),
    status: 'Active',
  },
  {
    id: 2,
    title: 'Todo List',
    content: '1. Buy groceries\n2. Finish React project\n3. Call mom',
    created_at: new Date('2025-05-02T15:30:00'),
    status: 'Active',
  },
];

const ViewNotes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(defaultNotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [userLevelName, setUserLevelName] = useState('User');

  useEffect(() => {
    const userRole = SecureStorage.getSessionItem('user_role');
    if (userRole) {
      setUserLevelName(userRole);
    }
  }, []);

  const handleCreateNote = (e) => {
    if (e) {
      e.preventDefault();
    }
    if (!newNote.title || !newNote.content) {
      toast.error('Please fill in both title and content');
      return;
    }

    const newNoteWithMetadata = {
      ...newNote,
      id: Date.now(),
      created_at: new Date(),
      status: 'Active',
    };

    setNotes([newNoteWithMetadata, ...notes]);
    toast.success('Note created successfully!');
    setNewNote({ title: '', content: '' });
    setShowCreateForm(false);
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
      const userRole = SecureStorage.getSessionItem('user_role');
      
  
      if (userRole !== 'User') {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/', { replace: true });
      }
    }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar userLevelName={userLevelName} />
      <div className="flex-1 transition-all duration-300 md:ml-64">
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
          {/* Background Gradients */}
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_40%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-white">Your Notes</h1>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Note
                </button>
              </div>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Create Note Modal */}
            <Modal
              open={showCreateForm}
              onCancel={() => setShowCreateForm(false)}
              title={<span className="text-lg font-semibold">Create New Note</span>}
              footer={[
                <button
                  key="cancel"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors mr-2"
                >
                  Cancel
                </button>,
                <button
                  key="submit"
                  onClick={handleCreateNote}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Create Note
                </button>,
              ]}
              className="modern-modal"
            >
              <div className="space-y-4 py-4">
                <div>
                  <input
                    type="text"
                    placeholder="Note Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Note Content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>
            </Modal>

            {/* Notes Grid */}
            {filteredNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-gray-800/50 backdrop-blur-lg border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <h3 className="text-xl font-semibold text-white mb-2">{note.title}</h3>
                    <p className="text-gray-400 mb-4 whitespace-pre-line line-clamp-3">{note.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        {note.status || 'Active'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <div className="text-gray-400 text-lg">
                  {searchQuery ? 'No notes found matching your search' : 'No notes available'}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewNotes;
