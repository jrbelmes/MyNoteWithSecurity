import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigateTo = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!firstName || !lastName || !contactNumber || !username || !password || !confirmPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return; 
        }

        setLoading(true);

        const url = 'http://localhost/gsd/register.php'; 
        const jsonData = {
            jo_personel_fname: firstName,
            jo_personel_lname: lastName,
            jo_personel_contact: contactNumber, 
            username: username,
            password: password,
        };

        const formData = new FormData();
        formData.append("json", JSON.stringify(jsonData));
        formData.append("operation", "registerPersonnel");

        console.log(jsonData);

        try {
            const res = await axios.post(url, formData);
            const data = res.data;

            if (data.status === 'success') {
                toast.success("Registration Successful!");
                navigateTo('/gsd'); 
            } else {
                toast.error(data.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Registration error:", error.response ? error.response.data : error.message);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col justify-center items-center h-screen bg-gray-100'>
            <div className='flex justify-center items-center mb-5'>
                <h1 className='text-4xl text-blue-600 font-bold'>Create a Personal Account</h1>
            </div>

            <div className="w-full max-w-4xl">
                <form className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4" onSubmit={handleRegister}>
                    <div className="grid grid-cols-1 gap-4">
                        {/* First Name */}
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="firstName">
                                First Name
                            </label>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-blue-500"
                                id="firstName"
                                type="text"
                                placeholder="Enter your first name"
                                required
                            />
                        </div>

                        {/* Last Name */}
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="lastName">
                                Last Name
                            </label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-blue-500"
                                id="lastName"
                                type="text"
                                placeholder="Enter your last name"
                                required
                            />
                        </div>

                        {/* Contact Number */}
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="contactNumber">
                                Personal Contact
                            </label>
                            <input
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-blue-500"
                                id="contactNumber"
                                type="text"
                                placeholder="Enter your contact number"
                                required
                            />
                        </div>

                        {/* Username */}
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

                        {/* Password */}
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-blue-500"
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <input
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring focus:ring-blue-500"
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <button
                            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </div>

                    <div className="flex items-center justify-center mt-4">
                        <a className="inline-block align-baseline font-semibold text-sm text-blue-500 hover:text-blue-800" onClick={() => navigateTo('/')}>
                            Already have an account? Log in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;
