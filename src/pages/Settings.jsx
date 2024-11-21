// src/pages/Settings.js
import Sidebar from './Sidebar';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const user_level_id = localStorage.getItem('user_level_id');
    const navigate = useNavigate();

    const [smtpSettings, setSmtpSettings] = useState({
        host: '',
        port: '',
        username: '',
        password: '',
        encryption: 'tls',
        fromEmail: ''
    });
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSmtpSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // TODO: Implement API call to save SMTP settings
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast.success('SMTP settings saved successfully');
        } catch (error) {
            toast.error('Failed to save SMTP settings');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow p-5">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <h2 className="text-xl font-semibold mb-4">SMTP Configuration</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                                <input
                                    type="text"
                                    name="host"
                                    value={smtpSettings.host}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Port</label>
                                <input
                                    type="number"
                                    name="port"
                                    value={smtpSettings.port}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={smtpSettings.username}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={smtpSettings.password}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Encryption</label>
                                <select
                                    name="encryption"
                                    value={smtpSettings.encryption}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="tls">TLS</option>
                                    <option value="ssl">SSL</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">From Email</label>
                                <input
                                    type="email"
                                    name="fromEmail"
                                    value={smtpSettings.fromEmail}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
