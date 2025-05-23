import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { SecureStorage } from '../utils/encryption'


const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const location = useLocation();
const navigate = useNavigate();

// Redirect if already logged in
useEffect(() => {
    const isLoggedIn = SecureStorage.getSessionItem('isLoggedIn');
    const userRole = SecureStorage.getSessionItem('user_role');

    if ((isLoggedIn === 'true' || isLoggedIn === true) && userRole) {
        if (location.pathname === '/signin' || location.pathname === '/signup' || location.pathname === '/landing-page') {
            if (userRole === 'Admin') {
                navigate('/admin/dashboard');
            } else if (userRole === 'User') {
                navigate('/user/dashboard');
            }
        }
    }
}, [location, navigate]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-shrink-0 flex items-center"
              >
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                  MyNote
                </span>
              </motion.div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex space-x-6"
              >
              
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-4"
              >
                <Link
                  to="/signin"
                  className="px-4 py-2 text-gray-300 hover:text-white rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isMenuOpen ? 1 : 0, height: isMenuOpen ? 'auto' : 0 }}
          className="md:hidden overflow-hidden bg-gray-800"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/features" className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
              Features
            </Link>
            <Link to="/pricing" className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
              Pricing
            </Link>
            <Link to="/about" className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
              About
            </Link>
            <Link to="/signin" className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
              Sign In
            </Link>
            <Link to="/signup" className="block px-3 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-md">
              Get Started
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_40%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]"></div>
        </div>

        <div className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold mb-8">
                <span className="block bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                  Transform Your
                </span>
                <span className="block mt-2">MyNote Experience</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
               Sample is a powerful note-taking app that helps you organize your thoughts and ideas effortlessly. Whether you're a student, professional, or just someone who loves to jot down notes, Sample has got you covered.
              </p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row justify-center items-center gap-4"
              >
              
              </motion.div>

            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;