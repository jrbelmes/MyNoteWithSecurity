import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CalendarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ userLevelName }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMenuItems = () => {
    if (userLevelName === 'Admin') {
      return [
        { name: 'Dashboard', icon: HomeIcon, path: '/admin/dashboard' },
        { name: 'Record Notes', icon: CalendarIcon, path: '/admin/record' }
      ];
    } else if (userLevelName === 'User') {
      return [
        { name: 'Dashboard', icon: HomeIcon, path: '/user/dashboard' },
        { name: 'View Notes', icon: DocumentTextIcon, path: '/user/view-notes' }
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/signin');
  };

  const MenuItem = ({ name, icon: Icon, path }) => {
    return (
      <NavLink
        to={path}
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
          }`
        }
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon className="h-6 w-6" />
        {!isCollapsed && <span className="ml-3 text-sm font-medium">{name}</span>}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '256px',
          x: isMobile ? (isMobileMenuOpen ? 0 : -256) : 0
        }}
        transition={{ duration: 0.3 }}
        className={`fixed left-0 top-0 h-full bg-gray-900 shadow-xl z-50 border-r border-gray-800 flex flex-col ${
          isMobile ? 'md:translate-x-0' : ''
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Logo and Collapse Toggle */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
              {userLevelName === 'Admin' ? 'Admin Portal' : 'User Portal'}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hidden md:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ArrowLeftOnRectangleIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 mt-6 px-3 space-y-2 min-h-0 overflow-y-auto" role="menu">
          {menuItems.map((item) => (
            <MenuItem key={item.name} {...item} />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-colors duration-200"
            aria-label="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
