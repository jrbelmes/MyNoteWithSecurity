// src/pages/Settings.js
import Sidebar from './Sidebar';
import React from 'react';

const Settings = () => {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow p-5">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <p>Manage your application settings here.</p>
            </div>
        </div>
    );
};

export default Settings;
