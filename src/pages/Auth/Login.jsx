import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import bcrypt from 'bcryptjs';
import { SecureStorage } from '../../utils/encryption'; // Adjust path if needed

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showMathCaptcha, setShowMathCaptcha] = useState(false);
  const [mathProblem, setMathProblem] = useState({ num1: 0, num2: 0, operator: '+' });
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const generateMathProblem = () => {
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1, num2;

    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        break;
      case '-':
        // Ensure num1 is always greater than num2 to avoid negative results
        num1 = Math.floor(Math.random() * 10) + 6; // Start from 6 to ensure we have room for subtraction
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // num2 will always be less than num1
        break;
      case '*':
        num1 = Math.floor(Math.random() * 5) + 1; // Keep multiplication numbers small
        num2 = Math.floor(Math.random() * 5) + 1;
        break;
      default:
        num1 = 1;
        num2 = 1;
    }

    setMathProblem({ num1, num2, operator });
  };

  const checkCaptchaAnswer = (answer) => {
    let correctAnswer;
    switch (mathProblem.operator) {
      case '+':
        correctAnswer = mathProblem.num1 + mathProblem.num2;
        break;
      case '-':
        correctAnswer = mathProblem.num1 - mathProblem.num2;
        break;
      case '*':
        correctAnswer = mathProblem.num1 * mathProblem.num2;
        break;
      default:
        correctAnswer = 0;
    }
    setIsCaptchaCorrect(Number(answer) === correctAnswer);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCaptchaChange = (e) => {
    const answer = e.target.value;
    setCaptchaAnswer(answer);
    checkCaptchaAnswer(answer);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && formData.email && formData.password) {
      e.preventDefault();
      if (!showMathCaptcha) {
        setShowMathCaptcha(true);
        generateMathProblem();
      }
    }
  };

  useEffect(() => {
    const isLoggedIn = SecureStorage.getSessionItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      const userLevelName = SecureStorage.getSessionItem('user_role');
      if (userLevelName === 'Admin') {
        navigate('/admin/dashboard');
      } else if (userLevelName === 'User') {
        navigate('/user/dashboard');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isCaptchaCorrect) {
      setError('Please solve the math problem correctly.');
      return;
    }

    try {
      // First check if user exists
      const { data: userData, error: fetchError } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('email', formData.email.trim())
        .single();

      if (fetchError || !userData) {
        setError('Invalid login credentials');
        setShowMathCaptcha(false);
        setCaptchaAnswer('');
        setIsCaptchaCorrect(false);
        return;
      }

      // Check login attempts
      const { data: attemptData, error: attemptError } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (attemptError && attemptError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        setError('Error checking login attempts. Please try again.');
        console.error('Login attempts error:', attemptError);
        return;
      }

      if (attemptData) {
        // Check if user is blocked
        if (attemptData.login_until && new Date(attemptData.login_until) > new Date()) {
          const remainingTime = Math.ceil((new Date(attemptData.login_until) - new Date()) / 1000 / 60);
          setError(`Account is temporarily blocked. Please try again in ${remainingTime} minutes.`);
          return;
        } else if (attemptData.login_until && new Date(attemptData.login_until) <= new Date()) {
          // Delete expired login attempt record
          await supabase
            .from('login_attempts')
            .delete()
            .eq('user_id', userData.id);
        }
      }

      const passwordMatch = await bcrypt.compare(formData.password, userData.password);
      
      if (!passwordMatch) {
        // Increment failed attempts
        if (attemptData) {
          const newAttempts = attemptData.attempts + 1;
          const loginUntil = newAttempts >= 3 ? new Date(Date.now() + 2 * 60 * 1000) : null;
          
          await supabase
            .from('login_attempts')
            .update({ 
              attempts: newAttempts,
              login_until: loginUntil
            })
            .eq('user_id', userData.id);
        } else {
          await supabase
            .from('login_attempts')
            .insert({ 
              user_id: userData.id,
              attempts: 1
            });
        }
        
        setError('Invalid login credentials');
        setShowMathCaptcha(false);
        setCaptchaAnswer('');
        setIsCaptchaCorrect(false);
        return;
      }

      // Reset login attempts on successful login
      if (attemptData) {
        await supabase
          .from('login_attempts')
          .update({ 
            attempts: 0,
            login_until: null
          })
          .eq('user_id', userData.id);
      }

      // Store separately in encrypted localStorage and sessionStorage
      SecureStorage.setLocalItem('user_id', userData.id);
      SecureStorage.setLocalItem('user_email', userData.email);
      SecureStorage.setLocalItem('user_role', userData.role);
      SecureStorage.setLocalItem('isLoggedIn', true);

      // Store in sessionStorage
      SecureStorage.setSessionItem('user_id', userData.id);
      SecureStorage.setSessionItem('user_email', userData.email);
      SecureStorage.setSessionItem('user_role', userData.role);
      SecureStorage.setSessionItem('isLoggedIn', true);

      navigate(userData.role === 'Admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Link
              to="/"
              className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text"
            >
              MyNote
            </Link>
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-purple-500 hover:text-purple-400"
            >
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-2 rounded text-center">
            {error}
          </div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 space-y-6 bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-xl"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter your password"
              />
              <p className="mt-1 text-sm text-gray-400">Press Enter after entering your password to proceed</p>
            </div>

            {showMathCaptcha && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-gray-300">
                  Solve this math problem: {mathProblem.num1} {mathProblem.operator} {mathProblem.num2} = ?
                </label>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={handleCaptchaChange}
                  className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="Enter your answer"
                />
                <p className="mt-1 text-sm text-gray-400">Press Enter after solving the math problem</p>
              </motion.div>
            )}
          </div>

          {isCaptchaCorrect && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all hover:scale-105"
            >
              Sign in
            </motion.button>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
