import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';

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

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password || isCaptchaCorrect === null) {
            toast.error("Please fill in all fields and solve the CAPTCHA.");
            return;
        }
        if (!isCaptchaCorrect) {
            toast.error("Incorrect CAPTCHA. Please try again.");
            generateCaptcha();
            return;
        }

        setLoading(true);

        const url = `${localStorage.getItem("url")}login.php`;
        if (!url || !username || !password) {
            toast.error("Invalid URL or missing credentials.");
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

                localStorage.clear();
                sessionStorage.clear();

                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('adminId', admin_id);
                localStorage.setItem('adminName', admin_name);
                localStorage.setItem('adminLevel', user_level_desc);
               

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

                toast.success("Login Successful");
            } else {
                const newAttempts = loginAttempts + 1;
                setLoginAttempts(newAttempts);
                if (newAttempts >= 3) {
                    toast.error("Too many failed attempts. Please try again later.");
                    setTimeout(() => setLoginAttempts(0), 300000); // Reset after 5 minutes
                } else {
                    toast.error("Invalid Credentials");
                }
            }
        } catch (error) {
            console.error("Login error:", error.response ? error.response.data : error.message);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateCaptcha();
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className='flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-100 to-green-200'
        >
            <motion.div 
                initial={{ y: -50 }} 
                animate={{ y: 0 }} 
                transition={{ type: 'spring', stiffness: 300 }}
                className='w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden p-8'
            >
                <h2 className='text-center text-3xl font-bold text-gray-800 mb-6'>User Login</h2>
                <form onSubmit={handleLogin}>
                    <div className='mb-4 relative'>
                        <label className='block text-gray-700 font-semibold mb-2' htmlFor='username'>
                            Username
                        </label>
                        <div className='relative'>
                            <FaUser className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                            <input 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300' 
                                id='username' 
                                type='text' 
                                placeholder='Enter your username' 
                                required 
                            />
                        </div>
                    </div>

                    <div className='mb-4 relative'>
                        <label className='block text-gray-700 font-semibold mb-2' htmlFor='password'>
                            Password
                        </label>
                        <div className='relative'>
                            <FaLock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                            <input 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300' 
                                id='password' 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder='Enter your password' 
                                required 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <label className='block text-gray-700 font-semibold mb-2'>
                            Solve this: {captchaNum1} + {captchaNum2} = ?
                        </label>
                        <input 
                            value={captchaAnswer}
                            onChange={handleCaptchaChange}
                            className={`w-full px-4 py-2 border ${isCaptchaCorrect === false ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:border-pink-500`}
                            placeholder='Your answer'
                        />
                        {isCaptchaCorrect === false && <p className='text-red-500 text-sm mt-1'>Incorrect answer.</p>}
                        {isCaptchaCorrect === true && <p className='text-green-500 text-sm mt-1'>Correct!</p>}
                    </div>

                    <div className='mb-4 flex items-center'>
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className='mr-2'
                        />
                        <label htmlFor="rememberMe" className='text-sm text-gray-600'>Remember me</label>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-2 px-4 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'}`}
                        type='submit'
                        disabled={loading || loginAttempts >= 3}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </motion.button>
                </form>

                <div className='mt-4 text-center'>
                    <a href="#" className='text-sm text-green-600 hover:text-green-800 transition duration-300'>Forgot password?</a>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default Logins;
