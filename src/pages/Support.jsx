// src/pages/Settings.js
import Sidebar from './Sidebar';
import React from 'react';

const Support = () => {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow p-5">
                <h1 className="text-2xl font-bold mb-4">Support</h1>
                <p>Manage your application support here.</p>
            </div>
        </div>
    );
};

export default Support;
