import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaUser, FaCalculator, FaCalendarCheck, FaChartLine, FaClock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { 
    getLoginAttempts, 
    setLoginAttempts, 
    clearAllExceptLoginAttempts, 
    isAccountLocked,
    incrementLoginAttempts,
    resetLoginAttempts 
} from '../utils/loginAttempts';

function Logins() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const navigateTo = useNavigate();
    const [isHovering, setIsHovering] = useState(false);
    const controls = useAnimation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);
    const [blockedUsername, setBlockedUsername] = useState('');
    const [captchaText, setCaptchaText] = useState('');
    const [userCaptchaInput, setUserCaptchaInput] = useState('');
    const [captchaCanvasRef] = useState(React.createRef());

    useEffect(() => {
        if (localStorage.getItem('loggedIn') === 'true') {
            navigateTo("/adminDashboard");
        }
        generateCaptcha();
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }

        // Looping animation for the feature icons
        controls.start({
            scale: [1, 1.1, 1],
            transition: { 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
            }
        });
    }, [controls, navigateTo]);

    const generateCaptcha = () => {
        const canvas = captchaCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let captcha = '';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0fdf4');
        gradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set fixed font properties
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate character spacing
        const charWidth = canvas.width / 8;
        const startX = charWidth;
        const centerY = canvas.height / 2;

        // Generate and draw characters
        for (let i = 0; i < 6; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            captcha += char;
            
            // Slightly randomize color for each character
            const hue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsl(${hue}, 50%, 30%)`; // Using HSL for better contrast

            // Draw character at fixed position with slight vertical variation
            const x = startX + (i * charWidth);
            const y = centerY + (Math.random() * 6 - 3); // Small vertical variation (-3 to +3 pixels)
            ctx.fillText(char, x, y);
        }

        // Add subtle noise/lines in background (optional)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }

        setCaptchaText(captcha);
        setUserCaptchaInput('');
        setIsCaptchaCorrect(null);
    };

    const handleCaptchaInput = (e) => {
        const input = e.target.value;
        setUserCaptchaInput(input);
        setIsCaptchaCorrect(input === captchaText);
    };

    const notify = (message, type = 'success') => {
        toast[type](message, {
            duration: 3000,
            position: 'top-right',
            style: {
                borderRadius: '10px',
                background: type === 'error' ? '#FEE2E2' : '#ECFDF5',
                color: type === 'error' ? '#DC2626' : '#059669',
            },
            iconTheme: {
                primary: type === 'error' ? '#DC2626' : '#059669',
                secondary: 'white',
            },
        });
    };

    const checkLoginAttempts = (username) => {
        const attempts = getLoginAttempts();
        const userAttempts = attempts[username] || { count: 0, timestamp: null };
        
        if (userAttempts.count >= 3 && userAttempts.timestamp) {
            const lockoutEndTime = new Date(userAttempts.timestamp).getTime() + (10 * 60 * 1000);
            const currentTime = new Date().getTime();
            
            if (currentTime < lockoutEndTime) {
                const remainingTime = Math.ceil((lockoutEndTime - currentTime) / 1000);
                setLockoutTime(remainingTime);
                setBlockedUsername(username);
                return false;
            } else {
                // Reset attempts after lockout period
                attempts[username] = { count: 0, timestamp: null };
                setLoginAttempts(attempts);
            }
        }
        return true;
    };

    const updateLoginAttempts = (username, isSuccessful) => {
        const attempts = getLoginAttempts();
        
        if (isSuccessful) {
            attempts[username] = { count: 0, timestamp: null };
        } else {
            const userAttempts = attempts[username] || { count: 0, timestamp: null };
            userAttempts.count += 1;
            if (userAttempts.count >= 3) {
                userAttempts.timestamp = new Date().toISOString();
            }
            attempts[username] = userAttempts;
        }
        
        setLoginAttempts(attempts);
    };

    const handleUsernameChange = (e) => {
        const input = e.target.value;
        
        if (isAccountLocked(input)) {
            const attempts = getLoginAttempts();
            const userAttempts = attempts[input];
            const lockoutEndTime = new Date(userAttempts.timestamp).getTime() + (10 * 60 * 1000);
            const currentTime = new Date().getTime();
            const remainingTime = Math.ceil((lockoutEndTime - currentTime) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            notify(`This account is locked. Please try again in ${minutes}:${seconds.toString().padStart(2, '0')} minutes`, 'error');
            return;
        }
        setUsername(input);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (isAccountLocked(username)) {
            const attempts = getLoginAttempts();
            const userAttempts = attempts[username];
            const lockoutEndTime = new Date(userAttempts.timestamp).getTime() + (10 * 60 * 1000);
            const currentTime = new Date().getTime();
            const remainingTime = Math.ceil((lockoutEndTime - currentTime) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            notify(`Account locked. Please try again in ${minutes}:${seconds.toString().padStart(2, '0')} minutes`, 'error');
            return;
        }

        if (!username || !password || !isCaptchaCorrect) {
            notify("Please fill in all fields and complete the CAPTCHA correctly.", 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${localStorage.getItem("url")}login.php`, {
                operation: "login",
                json: { 
                    username: username, 
                    password: password 
                }
            });

            const user = response.data;
            
            if (user.status === "success" && user.data) {
                const userData = user.data;
                
                resetLoginAttempts(username);
                clearAllExceptLoginAttempts();
            
                // Set localStorage items
                localStorage.setItem("user_id", userData.user_id);
                localStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                localStorage.setItem("school_id", userData.school_id);
                localStorage.setItem("contact_number", userData.contact_number);
                localStorage.setItem("user_level", userData.user_level_name);
                localStorage.setItem("user_level_id", userData.user_level_id);
                localStorage.setItem("department_id", userData.department_id);
                localStorage.setItem("profile_pic", userData.profile_pic || "");
                localStorage.setItem("loggedIn", "true");
            
                // Set sessionStorage items
                sessionStorage.setItem("user_id", userData.user_id);
                sessionStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                sessionStorage.setItem("school_id", userData.school_id);
                sessionStorage.setItem("contact_number", userData.contact_number);
                sessionStorage.setItem("user_level", userData.user_level_name);
                sessionStorage.setItem("user_level_id", userData.user_level_id);
                sessionStorage.setItem("department_id", userData.department_id);
                sessionStorage.setItem("profile_pic", userData.profile_pic || "");
                sessionStorage.setItem("loggedIn", "true");
            
                // Handle "Remember Me" functionality
                if (rememberMe) {
                    localStorage.setItem("rememberedUsername", username);
                } else {
                    localStorage.removeItem("rememberedUsername");
                }
            
                // Navigate based on user level
                if (userData.user_level_name === "Super Admin") {
                    notify("Super Admin Login Successful");
                    navigateTo("/adminDashboard");
                } else if (userData.user_level_name === "Personnel") {
                    notify("Personnel Login Successful");
                    navigateTo("/personeldashboard");
                } else if (userData.user_level_name === "Admin") {
                    notify("Admin Login Successful");
                    navigateTo("/adminDashboard");
                } else if (userData.user_level_name === "Dean") {
                    notify("Dean Login Successful");
                    navigateTo("/deanDashboard");
                } else {
                    notify("User Login Successful");
                    navigateTo("/dashboard");
                }
            } else {
                const attempts = incrementLoginAttempts(username);
                if (attempts.count >= 3) {
                    notify(`Account locked for 10 minutes due to too many failed attempts.`, 'error');
                } else {
                    notify(`Invalid credentials. ${3 - attempts.count} attempts remaining.`, 'error');
                }
            }
        } catch (error) {
            const attempts = incrementLoginAttempts(username);
            if (attempts.count >= 3) {
                notify(`Account locked for 10 minutes due to too many failed attempts.`, 'error');
            } else {
                notify(`Login failed. ${3 - attempts.count} attempts remaining.`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (isLocked && lockoutTime > 0) {
            interval = setInterval(() => {
                setLockoutTime(time => {
                    if (time <= 1) {
                        setIsLocked(false);
                        return 0;
                    }
                    return time - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLocked, lockoutTime]);

    useEffect(() => {
        if (username === blockedUsername) {
            const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
            const userAttempts = attempts[username] || { count: 0, timestamp: null };
            if (userAttempts.timestamp) {
                checkLoginAttempts(username);
            }
        }
    }, [username]);

    const featureVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const pageVariants = {
        initial: { opacity: 0, scale: 0.8 },
        in: { opacity: 1, scale: 1 },
        out: { opacity: 0, scale: 1.2 }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
    };

    return (
        <AnimatePresence mode="wait">
            {!isLoggedIn ? (
                <motion.div
                    key="login"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className='flex min-h-screen bg-gradient-to-br from-green-50 to-green-100 overflow-hidden'
                >
                    {/* Left side: Introduction with picture */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5 }}
                        className='w-1/2 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-white to-green-100 text-green-800 relative'
                    >
                        <motion.img 
                            src="/images/assets/phinma.png" 
                            alt="PHINMA CDO Logo" 
                            className='w-64 h-64 object-cover rounded-full mb-8 shadow-lg'
                            whileHover={{ scale: 1.1, rotate: 360 }}
                            transition={{ duration: 0.5 }}
                        />
                        <motion.h2 
                            className='text-4xl font-bold mb-4 text-green-700 font-sans'
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            General Service Department
                        </motion.h2>
                        <motion.h3 
                            className='text-2xl font-semibold mb-2 text-green-600 font-sans'
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Reservation and Monitoring System
                        </motion.h3>
                      
                        <motion.ul 
                            className='space-y-4 mt-8'
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { 
                                    opacity: 1,
                                    transition: { staggerChildren: 0.2 }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.li 
                                className='flex items-center'
                                variants={featureVariants}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.div animate={controls}>
                                    <FaCalendarCheck className='w-6 h-6 mr-2 text-green-500' />
                                </motion.div>
                                <span className='text-green-700'>Efficient Facilities reservations</span>
                            </motion.li>
                            <motion.li 
                                className='flex items-center'
                                variants={featureVariants}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.div animate={controls}>
                                    <FaChartLine className='w-6 h-6 mr-2 text-green-500' />
                                </motion.div>
                                <span className='text-green-700'>Real-time facility monitoring</span>
                            </motion.li>
                            <motion.li 
                                className='flex items-center'
                                variants={featureVariants}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.div animate={controls}>
                                    <FaClock className='w-6 h-6 mr-2 text-green-500' />
                                </motion.div>
                                <span className='text-green-700'>Optimized resource allocation</span>
                            </motion.li>
                        </motion.ul>

                        {/* Floating particles */}
                        <motion.div 
                            className="absolute top-10 right-10 w-4 h-4 bg-green-400 rounded-full"
                            animate={{
                                y: [0, -20, 0],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                        <motion.div 
                            className="absolute bottom-20 left-20 w-6 h-6 bg-yellow-400 rounded-full"
                            animate={{
                                x: [0, 20, 0],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />

                        {/* New cool animations */}
                        <motion.div 
                            className="absolute top-1/4 left-1/4 w-8 h-8 border-4 border-green-500 rounded-full"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 0.3, 0.7],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div 
                            className="absolute bottom-1/4 right-1/4 w-12 h-12 border-2 border-yellow-500"
                            animate={{
                                rotate: [0, 180, 360],
                                borderRadius: ["0%", "50%", "0%"],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                       
                    </motion.div>

                    {/* Right side: Login form */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5 }}
                        className='w-1/2 p-8 flex items-center justify-center relative'
                    >
                        {/* Decorative background elements */}
                        <motion.div 
                            className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                        <motion.div 
                            className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
                            animate={{
                                scale: [1, 1.3, 1],
                                rotate: [0, -90, 0],
                            }}
                            transition={{
                                duration: 25,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />

                        <div className='w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden z-10'>
                            <div className='bg-gradient-to-r from-green-600 to-green-700 p-6 text-white'>
                                <h2 className='text-center text-3xl font-bold'>General Service Department</h2>
                                <p className='text-center text-green-100 mt-2'>Please login to your account</p>
                            </div>
                            <div className='p-8'>
                                <form onSubmit={handleLogin} className='space-y-6'>
                                    {isLocked && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                            <strong className="font-bold">Account Locked!</strong>
                                            <p className="block sm:inline">
                                                Please try again in {Math.floor(lockoutTime / 60)}:
                                                {(lockoutTime % 60).toString().padStart(2, '0')} minutes
                                            </p>
                                        </div>
                                    )}
                                    <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700' htmlFor='username'>
                                            Username
                                        </label>
                                        <div className='relative rounded-md shadow-sm'>
                                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                <FaUser className='text-green-500' />
                                            </div>
                                            <input 
                                                value={username} 
                                                onChange={handleUsernameChange} 
                                                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out ${isAccountLocked(username) ? 'bg-red-50 border-red-300' : ''}`} 
                                                id='username' 
                                                type='text'
                                                placeholder='Enter your username' 
                                                required 
                                                disabled={isLocked}
                                            />
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700' htmlFor='password'>
                                            Password
                                        </label>
                                        <div className='relative rounded-md shadow-sm'>
                                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                <FaLock className='text-green-500' />
                                            </div>
                                            <input 
                                                value={password} 
                                                onChange={handlePasswordChange} 
                                                className='block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out' 
                                                id='password' 
                                                type={showPassword ? 'text' : 'password'} 
                                                placeholder='Enter your password' 
                                                required 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                            >
                                                {showPassword ? <FaEyeSlash className='text-green-500' /> : <FaEye className='text-green-500' />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700'>
                                            Security Verification
                                        </label>
                                        <div className='space-y-3'>
                                            <div className='relative bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
                                                <canvas
                                                    ref={captchaCanvasRef}
                                                    width="280"
                                                    height="80"
                                                    className='bg-white rounded-md'
                                                />
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={generateCaptcha}
                                                    type="button"
                                                    className='absolute top-2 right-2 p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 transition-colors'
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                            <div className='relative rounded-md shadow-sm'>
                                                <input
                                                    type="text"
                                                    value={userCaptchaInput}
                                                    onChange={handleCaptchaInput}
                                                    className={`block w-full px-4 py-2 border ${
                                                        isCaptchaCorrect === false ? 'border-red-500' : 
                                                        isCaptchaCorrect === true ? 'border-green-500' : 
                                                        'border-gray-300'
                                                    } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                                                    placeholder='Enter the characters above'
                                                />
                                                {isCaptchaCorrect === false && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className='absolute text-xs text-red-500 mt-1'
                                                    >
                                                        Incorrect CAPTCHA. Please try again.
                                                    </motion.p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='flex items-center'>
                                        <input
                                            type="checkbox"
                                            id="rememberMe"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition duration-150 ease-in-out'
                                        />
                                        <label htmlFor="rememberMe" className='ml-2 block text-sm text-gray-700'>Remember me</label>
                                    </div>

                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        type='submit'
                                        disabled={loading || loginAttempts >= 3}
                                    >
                                        {loading ? 'Logging in...' : 'Sign In'}
                                    </motion.button>
                                </form>

                                <div className='mt-6 text-center'>
                                    <a href="#" className='text-sm text-green-600 hover:text-green-700 transition duration-150 ease-in-out'>Forgot your password?</a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    key="success"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="flex items-center justify-center min-h-screen bg-green-100"
                >
                    <div className="text-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-bold text-green-700 mb-4"
                        >
                            Login Successful!
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-green-600"
                        >
                            Redirecting to dashboard...
                        </motion.p>
                    </div>
                </motion.div>
            )}
            <Toaster position="top-right" reverseOrder={false} />
        </AnimatePresence>
    );
}

export default Logins;
