import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaUndoAlt, FaSpinner } from 'react-icons/fa';
import Sidebar from './Sidebar';
import Sidebar1 from './sidebarpersonel';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ReleaseAndReturn = () => {
    const [releaseFacilities, setReleaseFacilities] = useState([]);
    const [returnFacilities, setReturnFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const user_id = localStorage.getItem('user_id');

    useEffect(() => {
        if (user_id !== '100' && user_id !== '1' && user_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_id, navigate]);

    const fetchReleaseFacilities = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', 
                JSON.stringify({ operation: 'fetchAllReleaseFacilities' }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.status === 'success') {
                setReleaseFacilities(response.data.data);
            } else {
                setError('Error fetching released facilities: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Fetch release facilities error:', error);
            setError('An error occurred while fetching released facilities.');
        }
    }, []);

    const fetchReturnFacilities = useCallback(async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', 
                JSON.stringify({ operation: 'fetchAllReturnedFacilities' }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.status === 'success') {
                setReturnFacilities(response.data.data);
            } else {
                setError('Error fetching returned facilities: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Fetch return facilities error:', error);
            setError('An error occurred while fetching returned facilities.');
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchReleaseFacilities(), fetchReturnFacilities()]);
            setLoading(false);
        };

        fetchData();
    }, [fetchReleaseFacilities, fetchReturnFacilities]);

    return (
        <div className="flex h-screen bg-gradient-to-br from-white to-green-100">
            {user_id === '100' && <Sidebar />}
            {user_id === '1' && <Sidebar1 />}
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-3xl font-semibold text-green-800 mb-6"
                        >
                            Facility Management
                        </motion.h1>
                        
                        <AnimatePresence>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                            >
                                {/* Released Facilities Card */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white rounded-lg shadow-md overflow-hidden"
                                >
                                    <div className="px-6 py-4 bg-green-600">
                                        <h2 className="text-xl font-semibold text-white flex items-center">
                                            <FaCheckCircle className="mr-2" />
                                            Released Facilities
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        {loading ? (
                                            <div className="flex justify-center items-center h-64">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <FaSpinner className="text-green-500 text-4xl" />
                                                </motion.div>
                                            </div>
                                        ) : error ? (
                                            <div className="text-red-500 text-center">{error}</div>
                                        ) : Array.isArray(releaseFacilities) && releaseFacilities.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Released By</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {releaseFacilities.map((facility) => (
                                                            <tr key={facility.reservation_id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{facility.reservation_name}</div>
                                                                    <div className="text-sm text-gray-500">{facility.reservation_event_title}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {facility.admin_name || facility.personnel_name || 'N/A'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                        {facility.type}
                                                                    </span>
                                                                    <div className="text-sm text-gray-900 mt-1">
                                                                        {facility.type === 'Vehicle' && facility.vehicle_license}
                                                                        {facility.type === 'Equipment' && facility.equipment}
                                                                        {facility.type === 'Venue' && facility.venue_name}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 italic text-center">No released facilities found</p>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Returned Facilities Card */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white rounded-lg shadow-md overflow-hidden"
                                >
                                    <div className="px-6 py-4 bg-green-600">
                                        <h2 className="text-xl font-semibold text-white flex items-center">
                                            <FaUndoAlt className="mr-2" />
                                            Returned Facilities
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        {loading ? (
                                            <div className="flex justify-center items-center h-64">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <FaSpinner className="text-green-500 text-4xl" />
                                                </motion.div>
                                            </div>
                                        ) : error ? (
                                            <div className="text-red-500 text-center">{error}</div>
                                        ) : Array.isArray(returnFacilities) && returnFacilities.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned By</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {returnFacilities.map((facility) => (
                                                            <tr key={facility.return_checklist_id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{facility.reservation_name}</div>
                                                                    <div className="text-sm text-gray-500">{facility.reservation_event_title}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {facility.admin_name || facility.personnel_name || 'N/A'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                        {facility.type}
                                                                    </span>
                                                                    <div className="text-sm text-gray-900 mt-1">
                                                                        {facility.type === 'Vehicle' && facility.vehicle_license}
                                                                        {facility.type === 'Equipment' && facility.equipment}
                                                                        {facility.type === 'Venue' && facility.venue_name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        facility.condition_name === 'Good' ? 'bg-green-100 text-green-800' :
                                                                        facility.condition_name === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {facility.condition_name}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 italic text-center">No returned facilities found</p>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ReleaseAndReturn;
