import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaBuilding, FaIdCard, FaCamera, FaHistory, FaShieldAlt, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';

const AccountSettings = () => {
  // States for account information
  const [activeTab, setActiveTab] = useState('account');
  const [profilePicture, setProfilePicture] = useState(null);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeId: '',
  });

  // States for security
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });
  
  // State for controlling loading state during 2FA toggle
  const [loading2FA, setLoading2FA] = useState(false);
  const navigate = useNavigate();

  // Login history mock data
  const [loginHistory, setLoginHistory] = useState([
    { id: 1, date: '2023-06-15 08:30:22', ipAddress: '192.168.1.1', device: 'Chrome / Windows' },
    { id: 2, date: '2023-06-14 14:15:45', ipAddress: '192.168.1.1', device: 'Safari / iOS' },
    { id: 3, date: '2023-06-10 09:20:33', ipAddress: '192.168.1.2', device: 'Firefox / macOS' },
  ]);

  useEffect(() => {
            const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
            console.log("this is encryptedUserLevel", encryptedUserLevel);
            if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
                localStorage.clear();
                navigate('/gsd');
            }
        }, [navigate]);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      const userId = SecureStorage.getSessionItem('user_id');
      const encryptedUrl = SecureStorage.getLocalItem("url");
      
      if (!userId) {
        console.warn('User ID not found in localStorage');
        return;
      }
      
      if (!encryptedUrl) {
        toast.error('API URL configuration is missing');
        return;
      }
      
      const response = await fetch(`${encryptedUrl}fetchMaster.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fetchUsersById',
          id: userId
        })
      });

      console.log('Response from API:', response);

      const result = await response.json();
      
      if (result.status === 'success' && result.data.length > 0) {
        const userData = result.data[0];
        setFormData({
          firstName: userData.users_fname || '',
          lastName: userData.users_lname || '',
          middleName: userData.users_mname || '',
          email: userData.users_email || '',
          phone: userData.users_contact_number || '',
          department: userData.departments_name || '',
          position: userData.user_level_name || '',
          employeeId: userData.users_school_id || '',
        });
        
        // Set profile picture if available
        if (userData.users_pic) {
          setProfilePicture(`http://localhost/coc/gsd/${userData.users_pic}`);
        }
        
        // Set 2FA status
        setSecurityData(prev => ({
          ...prev,
          twoFactorEnabled: userData.is_2FAactive === "1"
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSecurityInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityData({
      ...securityData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
      toast.success('Profile picture updated');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.');
        return;
      }

      // Here you would save the profile information to your backend
      // Add the API call to update user information here
      console.log('Profile data to save:', formData);
      toast.success('Profile information updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile information');
    }
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    
    // Validate password
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (securityData.newPassword && securityData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    // Here you would save the security settings to your backend
    console.log('Security data to save:', securityData);
    toast.success('Security settings updated successfully');
    
    // Reset password fields
    setSecurityData({
      ...securityData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const toggleTwoFactor = async () => {
    try {
      setLoading2FA(true);
      const userId = localStorage.getItem('user_id');
      const userLevel = localStorage.getItem('user_level_id');
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.');
        return;
      }
      
      const userType = userLevel === '4' ? 'super_admin' : 'admin';
      const newStatus = !securityData.twoFactorEnabled;
      
      const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: newStatus ? 'enable2FA' : 'unenable2FA',
          id: userId,
          userType: userType
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSecurityData(prev => ({
          ...prev,
          twoFactorEnabled: newStatus
        }));
        
        toast.success(
          newStatus 
            ? 'Two-factor authentication enabled' 
            : 'Two-factor authentication disabled'
        );
      } else {
        toast.error('Failed to update two-factor authentication');
      }
    } catch (error) {
      console.error('Error updating 2FA:', error);
      toast.error('Failed to update two-factor authentication');
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-2 px-4 md:px-6 pb-6">
          <div className="md:max-w-10xl md:ml-0 mx-auto md:mx-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Account Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your account details and preferences</p>
            </div>
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
              <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-md">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <FaUser className="text-4xl text-gray-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
                    <label htmlFor="profile-upload" className="w-full h-full rounded-full cursor-pointer flex items-center justify-center">
                      <FaCamera className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <input
                        type="file"
                        id="profile-upload"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{`${formData.firstName} ${formData.lastName}`}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{formData.position}</p>
                  <p className="text-gray-500 dark:text-gray-400">{formData.department}</p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 relative 
                  ${activeTab === 'account' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('account')}
              >
                <div className="flex items-center gap-2">
                  <FaUser className="text-lg" />
                  <span>Account Information</span>
                </div>
                {activeTab === 'account' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
              
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 relative 
                  ${activeTab === 'security' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('security')}
              >
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-lg" />
                  <span>Security Settings</span>
                </div>
                {activeTab === 'security' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              {activeTab === 'account' && (
                <div className="p-6">
                  <form onSubmit={handleSaveProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaUser className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaUser className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaEnvelope className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaPhone className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaBuilding className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> Department
                        </label>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaIdCard className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> Position
                        </label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <FaIdCard className="inline-block mr-2 text-gray-500 dark:text-gray-400" /> Employee ID
                        </label>
                        <input
                          type="text"
                          id="employeeId"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button 
                        type="submit" 
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="space-y-8">
                    {/* Password Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                        <FaKey className="mr-2 text-gray-500 dark:text-gray-400" /> Change Password
                      </h3>
                      <form onSubmit={handleSaveSecurity} className="max-w-md">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword.current ? "text" : "password"}
                                id="currentPassword"
                                name="currentPassword"
                                value={securityData.currentPassword}
                                onChange={handleSecurityInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                                required
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => togglePasswordVisibility('current')}
                              >
                                {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword.new ? "text" : "password"}
                                id="newPassword"
                                name="newPassword"
                                value={securityData.newPassword}
                                onChange={handleSecurityInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                                required
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => togglePasswordVisibility('new')}
                              >
                                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword.confirm ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={securityData.confirmPassword}
                                onChange={handleSecurityInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                                required
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => togglePasswordVisibility('confirm')}
                              >
                                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <button 
                              type="submit" 
                              className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Update Password
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                        <FaShieldAlt className="mr-2 text-gray-500 dark:text-gray-400" /> Two-Factor Authentication
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-100 dark:border-gray-600">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Enhance your account security with 2FA. When enabled:
                          <ul className="list-disc ml-6 mt-2">
                            <li>Receive a unique code via email for each login</li>
                            <li>Protect against unauthorized access even if password is compromised</li>
                            <li>Required for sensitive operations like password changes</li>
                          </ul>
                        </p>
                        
                        <div className="flex items-center justify-between max-w-md bg-white dark:bg-gray-800 p-4 rounded-lg mt-4">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {securityData.twoFactorEnabled 
                                ? 'Your account is protected with an additional layer of security.' 
                                : 'Enable to add an extra layer of security.'}
                            </p>
                          </div>
                          <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                              type="checkbox" 
                              name="twoFactorEnabled" 
                              id="twoFactorEnabled" 
                              checked={securityData.twoFactorEnabled}
                              onChange={toggleTwoFactor}
                              disabled={loading2FA}
                              className="sr-only"
                            />
                            <label 
                              htmlFor="twoFactorEnabled" 
                              className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in
                                ${loading2FA ? 'opacity-60 cursor-wait' : ''}
                                ${securityData.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                              <span 
                                className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in
                                  ${securityData.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountSettings;
