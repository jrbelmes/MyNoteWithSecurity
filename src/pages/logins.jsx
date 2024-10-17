import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

function Logins() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaNum1, setCaptchaNum1] = useState(Math.floor(Math.random() * 10));
    const [captchaNum2, setCaptchaNum2] = useState(Math.floor(Math.random() * 10));
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
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

                // Add a delay before redirecting
                setTimeout(() => {
                    navigateTo("/adminDashboard");
                }, 2000);

                toast.success("Login Successful");
            } else {
                toast.error("Invalid Credentials");
            }
        } catch (error) {
            console.error("Login error:", error.response ? error.response.data : error.message);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateCaptcha(); // Generate CAPTCHA on component mount
    }, []);

    return (
        <div className='flex flex-col justify-center items-center h-screen bg-gray-100'>
            <div className='flex justify-center items-center mb-5'>
                <h1 className='text-4xl text-blue-600 font-bold'>Welcome Back!</h1>
            </div>

            <div className="w-full max-w-xs">
                <form className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4" onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-blue-500" 
                            id="username" 
                            type="text" 
                            placeholder="Enter your username" 
                            required 
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-500" 
                            id="password" 
                            type="password" 
                            placeholder="Enter your password" 
                            required 
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Solve this: {captchaNum1} + {captchaNum2} = ?
                        </label>
                        <input
                            type="text"
                            value={captchaAnswer}
                            onChange={handleCaptchaChange}
                            className={`shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-blue-500 ${isCaptchaCorrect === false ? 'border-red-500' : isCaptchaCorrect === true ? 'border-green-500' : ''}`}
                            placeholder="Your answer"
                        />
                        {isCaptchaCorrect === false && <p className="text-red-500 text-sm">Incorrect answer.</p>}
                        {isCaptchaCorrect === true && <p className="text-green-500 text-sm">Correct!</p>}
                    </div>

                    <div className="flex items-center justify-center">
                        <button 
                            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>

                    <div className="flex items-center justify-center mt-4">
                        <a className="inline-block align-baseline font-semibold text-sm text-blue-500 hover:text-blue-800" href="#">
                            Forgot Password?
                        </a>
                    </div>
                </form>

                <form className="bg-white shadow-lg rounded-lg px-3 pt-6 pb-2 mb-4 mt-2">
                    <div className="flex items-center justify-center">
                        <p className='text-black'>Don't have an account? </p>
                        <span className='ms-2'>
                            <p className='cursor-pointer text-sm text-blue-600 hover:text-blue-800' onClick={() => navigateTo('/register')}>
                                Register
                            </p>
                        </span>
                    </div>
                </form>

                <p className="text-center text-gray-500 text-xs">
                    &copy;{new Date().getFullYear()} Acme Corp. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default Logins;
