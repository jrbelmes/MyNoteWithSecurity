import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaUser, FaCalculator } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

function Logins() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaNum1, setCaptchaNum1] = useState(Math.floor(Math.random() * 10));
    const [captchaNum2, setCaptchaNum2] = useState(Math.floor(Math.random() * 10));
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const navigateTo = useNavigate();

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
    }, [navigateTo]);

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10));
        setCaptchaNum2(Math.floor(Math.random() * 10));
        setCaptchaAnswer("");
        setIsCaptchaCorrect(null);
    };

    const handleCaptchaChange = (e) => {
        const userAnswer = e.target.value;
        setCaptchaAnswer(userAnswer);
        setIsCaptchaCorrect(userAnswer == (captchaNum1 + captchaNum2));
    };

    const notify = (message, type = 'success') => {
        toast[type](message, {
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

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password || isCaptchaCorrect === null) {
            notify("Please fill in all fields and solve the CAPTCHA.", 'error');
            return;
        }
        if (!isCaptchaCorrect) {
            notify("Incorrect CAPTCHA. Please try again.", 'error');
            generateCaptcha();
            return;
        }

        setLoading(true);

        const url = `${localStorage.getItem("url")}login.php`;
        if (!url || !username || !password) {
            notify("Invalid URL or missing credentials.", 'error');
            setLoading(false);
            return;
        }

        try {
            const jsonData = { username, password };
            const formData = new FormData();
            formData.append("json", JSON.stringify(jsonData));
            formData.append("operation", "admin");

            const res = await axios.post(url, formData);
            const data = res.data;

            if (Array.isArray(data) && data.length > 0) {
                const { admin_id, admin_name, user_level_desc } = data[0];

                // Clear localStorage and sessionStorage
                localStorage.clear();
                sessionStorage.clear();

                // Set new values in localStorage
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('adminId', admin_id);
                localStorage.setItem('adminName', admin_name);
                localStorage.setItem('adminLevel', user_level_desc);
                localStorage.setItem('url', url);  // Make sure to preserve the URL

                // Set values in sessionStorage
                sessionStorage.setItem('adminId', admin_id);

                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }
                setLoginAttempts(0);

                // Add a delay before redirecting
                setTimeout(() => {
                    navigateTo("/adminDashboard");
                }, 2000);

                notify("Login Successful");
            } else {
                const newAttempts = loginAttempts + 1;
                setLoginAttempts(newAttempts);
                if (newAttempts >= 3) {
                    notify("Too many failed attempts. Please try again later.", 'error');
                    setTimeout(() => setLoginAttempts(0), 300000); // Reset after 5 minutes
                } else {
                    notify("Invalid Credentials", 'error');
                }
            }
        } catch (error) {
            console.error("Login error:", error.response ? error.response.data : error.message);
            notify("Something went wrong. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className='flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4'
        >
            <Toaster position="top-right" reverseOrder={false} />
            <motion.div 
                initial={{ y: -50 }} 
                animate={{ y: 0 }} 
                transition={{ type: 'spring', stiffness: 300 }}
                className='w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden'
            >
                <div className='bg-gradient-to-r from-green-600 to-green-700 p-6 text-white'>
                    <h2 className='text-center text-3xl font-bold'>Welcome Back</h2>
                    <p className='text-center text-green-100 mt-2'>Please login to your account</p>
                </div>
                <div className='p-8'>
                    <form onSubmit={handleLogin} className='space-y-6'>
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
                                    onChange={(e) => setUsername(e.target.value)} 
                                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out' 
                                    id='username' 
                                    type='text' 
                                    placeholder='Enter your username' 
                                    required 
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
                                    onChange={(e) => setPassword(e.target.value)} 
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
                                Math CAPTCHA
                            </label>
                            <div className='flex items-center space-x-2 bg-green-50 p-3 rounded-md'>
                                <FaCalculator className='text-green-500' />
                                <span>{captchaNum1} + {captchaNum2} = ?</span>
                                <input 
                                    value={captchaAnswer}
                                    onChange={handleCaptchaChange}
                                    className={`w-20 px-2 py-1 border ${isCaptchaCorrect === false ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out`}
                                    placeholder='Answer'
                                />
                            </div>
                            <AnimatePresence>
                                {isCaptchaCorrect === false && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className='text-red-500 text-xs'
                                    >
                                        Incorrect answer.
                                    </motion.p>
                                )}
                                {isCaptchaCorrect === true && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className='text-green-500 text-xs'
                                    >
                                        Correct!
                                    </motion.p>
                                )}
                            </AnimatePresence>
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
            </motion.div>
        </motion.div>
    );
}

export default Logins;
