
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

function Logins() {
    const defaultUrl = "http://localhost/coc/gsd/";
    const navigateTo = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        captchaAnswer: "",
    });
    const [loading, setLoading] = useState(false);
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('loggedIn') === 'true') {
            navigateTo("/adminDashboard");
        }
        if (localStorage.getItem("url") !== defaultUrl) {
            localStorage.setItem("url", defaultUrl);
        }
        generateCaptcha();
    }, [navigateTo]);

    const generateCaptcha = () => {
        setCaptcha({ num1: Math.floor(Math.random() * 10), num2: Math.floor(Math.random() * 10) });
        setIsCaptchaCorrect(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'captchaAnswer') {
            setIsCaptchaCorrect(parseInt(value) === (captcha.num1 + captcha.num2));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password || isCaptchaCorrect === null) {
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
        if (!url) {
            toast.error("Invalid URL.");
            setLoading(false);
            return;
        }

        try {
            const jsonData = { username: formData.username, password: formData.password };
            const formDataToSend = new FormData();
            formDataToSend.append("json", JSON.stringify(jsonData));
            formDataToSend.append("operation", "login");

            const response = await axios.post(url, formDataToSend);

            if (response.data) {
                const user = response.data;
                toast.success("Login successful! Redirecting...");

                if (user.adm_userLevel === "100") {
                    localStorage.setItem("user_id", user.admin_id);
                    localStorage.setItem("user_level", user.adm_userLevel);
                    localStorage.setItem("name", user.admin_name || "");
                    navigateTo("/adminDashboard");
                } else if (user.personnel_userLevel  === "1") {
                    localStorage.setItem("user_id", user.jo_personel_id);
                    localStorage.setItem("user_level", user.personnel_userLevel );
                    localStorage.setItem("first_name", user.jo_personel_fname || "");
                    navigateTo("/personnelDashboard");
                }
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

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
                            name="username"
                            value={formData.username} 
                            onChange={handleInputChange} 
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
                        <div className="relative">
                            <input 
                                name="password"
                                value={formData.password} 
                                onChange={handleInputChange} 
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-500 pr-10" 
                                id="password" 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password" 
                                required 
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? <FaEyeSlash className="text-gray-500" /> : <FaEye className="text-gray-500" />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Solve this: {captcha.num1} + {captcha.num2} = ?
                        </label>
                        <input
                            name="captchaAnswer"
                            value={formData.captchaAnswer}
                            onChange={handleInputChange}
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

           
            </div>
        </div>
    );
}

export default Logins;