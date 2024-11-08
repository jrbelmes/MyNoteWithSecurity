import React, { useState, useEffect } from 'react';
import { FaCar, FaPlus, FaTools, FaCogs, FaListAlt, FaUserShield, FaEye } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Master = () => {
  const navigate = useNavigate();
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddMakeModalOpen, setIsAddMakeModalOpen] = useState(false);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false);
  const [isAddUserLevelModalOpen, setIsAddUserLevelModalOpen] = useState(false);
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  
  const [categoryName, setCategoryName] = useState('');
  const [makeName, setMakeName] = useState('');
  const [modelName, setModelName] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [userLevelName, setUserLevelName] = useState('');
  const [userLevelDesc, setUserLevelDesc] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [conditionName, setConditionName] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [categories, setCategories] = useState([]);
  const [makes, setMakes] = useState([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const fetchCategoriesAndMakes = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/vehicle_master.php', {
        operation: 'fetchCategoriesAndMakes',
      });
      const data = response.data;

      if (data.status === 'success') {
        setCategories(data.categories);
        setMakes(data.makes);
      } else {
        setMessage(`Error fetching data: ${data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error fetching data.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndMakes();
  }, []);

  const handleSaveData = async (operation, data) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/vehicle_master.php', {
        operation,
        json: JSON.stringify(data),
      });

      if (response.data.status === 'success') {
        const name = operation === 'saveCategoryData' 
          ? 'Category' 
          : operation === 'saveMakeData' 
          ? 'Make' 
          : operation === 'saveModelData' 
          ? 'Model'
          : operation === 'saveEquipmentCategory'
          ? 'Equipment'
          : operation === 'saveUserLevelData'
          ? 'User Level' 
          : operation === 'saveDepartmentData'
          ? 'Department'
          : operation === 'saveConditionData'
          ? 'Condition'
          : 'Position';

        setMessage(`${name} added successfully!`);
        setIsSuccess(true);
        setPopupMessage(`Successfully added ${name}!`);
        fetchCategoriesAndMakes();
        resetForm();

        setTimeout(() => {
          setPopupMessage('');
        }, 3000);
      } else {
        setMessage(`Error: ${response.data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error(`Error adding ${operation}:`, error);
      setMessage(`Error adding ${operation}.`);
      setIsSuccess(false);
    }
  };

  const resetForm = () => {
    setCategoryName('');
    setMakeName('');
    setModelName('');
    setEquipmentName('');
    setPositionName('');
    setUserLevelName('');
    setUserLevelDesc('');
    setDepartmentName('');
    setSelectedCategory('');
    setSelectedMake('');
    setIsAddCategoryModalOpen(false);
    setIsAddMakeModalOpen(false);
    setIsAddModelModalOpen(false);
    setIsAddEquipmentModalOpen(false);
    setIsAddPositionModalOpen(false);
    setIsAddUserLevelModalOpen(false);
    setIsAddDepartmentModalOpen(false);
    setIsAddConditionModalOpen(false);
    setMessage('');
  };

  const handleSaveCategoryData = (e) => {
    e.preventDefault();
    handleSaveData('saveCategoryData', { vehicle_category_name: categoryName });
  };

  const handleSaveMakeData = (e) => {
    e.preventDefault();
    handleSaveData('saveMakeData', { vehicle_make_name: makeName });
  };

  const handleSaveModelData = (e) => {
    e.preventDefault();
    if (!selectedCategory || !selectedMake) {
      setMessage('Please select both a category and a make.');
      setIsSuccess(false);
      return;
    }
    handleSaveData('saveModelData', { name: modelName, category_id: selectedCategory, make_id: selectedMake });
  };

  const handleSaveEquipmentData = (e) => {
    e.preventDefault();
    handleSaveData('saveEquipmentCategory', { equipments_category_name: equipmentName });
  };

  const handleSavePositionData = (e) => {
    e.preventDefault();
    handleSaveData('savePosition', { position_name: positionName });
  };

  const handleSaveUserLevelData = (e) => {
    e.preventDefault();
    handleSaveData('saveUserLevelData', { user_level_name: userLevelName, user_level_desc: userLevelDesc });
  };

  const handleSaveDepartmentData = async (e) => {
    e.preventDefault();
    handleSaveData('saveDepartmentData', { departments_name: departmentName });
  };

  const handleSaveConditionData = (e) => {
    e.preventDefault();
    if (!conditionName.trim()) {
      setMessage('Condition name is required.');
      setIsSuccess(false);
      return;
    }
    handleSaveData('saveConditionData', { condition_name: conditionName.trim() });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-100 to-white">
      <Sidebar />
      <div className="flex-grow p-8 overflow-y-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-green-800"
        >
          Vehicle Master Dashboard
        </motion.h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { title: 'Vehicle Category', icon: <FaCar />, action: () => setIsAddCategoryModalOpen(true), viewPath: '/vehicleCategory' },
            { title: 'Vehicle Make', icon: <FaTools />, action: () => setIsAddMakeModalOpen(true), viewPath: '/vehiclemake' },
            { title: 'Vehicle Model', icon: <FaCogs />, action: () => setIsAddModelModalOpen(true), viewPath: '/vehiclemodel' },
            { title: 'Departments', icon: <FaListAlt />, action: () => setIsAddDepartmentModalOpen(true), viewPath: '/departments' },
            { title: 'Equipments', icon: <FaListAlt />, action: () => setIsAddEquipmentModalOpen(true), viewPath: '/equipmentCat' },
            { title: 'Position', icon: <FaCar />, action: () => setIsAddPositionModalOpen(true), viewPath: '/position' },
            { title: 'Condition', icon: <FaCogs />, action: () => setIsAddConditionModalOpen(true), viewPath: '/condition' },
          ].map((card, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-green-400 to-green-600">
                <div className="text-white text-3xl mb-2">{card.icon}</div>
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              </div>
              <div className="p-4 flex justify-between">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { card.action(); setMessage(''); }} 
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300"
                >
                  <FaPlus />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(card.viewPath)} 
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300"
                >
                  <FaEye />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal for Adding Category */}
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Vehicle Category</h2>
              <form onSubmit={handleSaveCategoryData}>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Make */}
        {isAddMakeModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Vehicle Make</h2>
              <form onSubmit={handleSaveMakeData}>
                <input
                  type="text"
                  value={makeName}
                  onChange={(e) => setMakeName(e.target.value)}
                  placeholder="Enter make name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Model */}
        {isAddModelModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Vehicle Model</h2>
              <form onSubmit={handleSaveModelData}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.vehicle_category_id} value={category.vehicle_category_id}>
                      {category.vehicle_category_name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                >
                  <option value="">Select Make</option>
                  {makes.map((make) => (
                    <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                      {make.vehicle_make_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Enter model name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Equipment */}
        {isAddEquipmentModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Equipment Category</h2>
              <form onSubmit={handleSaveEquipmentData}>
                <input
                  type="text"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder="Enter equipment name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Position */}
        {isAddPositionModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Position</h2>
              <form onSubmit={handleSavePositionData}>
                <input
                  type="text"
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  placeholder="Enter position name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding User Level */}
        {isAddUserLevelModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add User Level</h2>
              <form onSubmit={handleSaveUserLevelData}>
                <input
                  type="text"
                  value={userLevelName}
                  onChange={(e) => setUserLevelName(e.target.value)}
                  placeholder="Enter user level name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <textarea
                  value={userLevelDesc}
                  onChange={(e) => setUserLevelDesc(e.target.value)}
                  placeholder="Enter user level description"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Department */}
        {isAddDepartmentModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Department</h2>
              <form onSubmit={handleSaveDepartmentData}>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Condition */}
        {isAddConditionModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Condition</h2>
              <form onSubmit={handleSaveConditionData}>
                <input
                  type="text"
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                  placeholder="Enter condition name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="mr-2 py-2 px-4 bg-gray-500 text-white rounded">Cancel</button>
                  <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {popupMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg"
          >
            {popupMessage}
          </motion.div>
        )}

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg"
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Master;
