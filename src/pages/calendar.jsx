import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { useNavigate } from 'react-router-dom';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
    'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const categories = [
    { id: 'default', name: 'Default', color: '#4ade80' },
    { id: 'meeting', name: 'Meeting', color: '#22c55e' },
    { id: 'personal', name: 'Personal', color: '#16a34a' },
    { id: 'work', name: 'Work', color: '#15803d' },
    { id: 'important', name: 'Important', color: '#dc2626' },
    { id: 'holiday', name: 'Holiday', color: '#6366f1' },
];

const ModernCalendar = () => {

    const navigate = useNavigate();
    const user_level_id = localStorage.getItem('user_level_id');
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: new Date(),
        end: new Date(),
        category: 'default',
        description: '',
    });

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const handleSelectSlot = ({ start, end }) => {
        setNewEvent({
            title: '',
            start,
            end,
            category: 'default',
            description: '',
        });
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setNewEvent(event);
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const eventToAdd = {
            ...newEvent,
            id: selectedEvent ? selectedEvent.id : Date.now(),
        };

        if (selectedEvent) {
            const updatedEvents = events.map(event =>
                event.id === selectedEvent.id ? eventToAdd : event
            );
            setEvents(updatedEvents);
        } else {
            setEvents([...events, eventToAdd]);
        }
        handleCloseModal();
        toast.success(`Event ${selectedEvent ? 'updated' : 'created'} successfully!`);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setNewEvent({
            title: '',
            start: new Date(),
            end: new Date(),
            category: 'default',
            description: '',
        });
    };

    const handleDeleteEvent = () => {
        if (selectedEvent) {
            const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
            setEvents(updatedEvents);
            handleCloseModal();
            toast.success('Event deleted successfully!');
        }
    };

    const eventStyleGetter = (event) => {
        const category = categories.find(cat => cat.id === event.category);
        return {
            style: {
                backgroundColor: category?.color || '#4ade80',
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0',
                display: 'block',
            }
        };
    };

    return (
        <div className="h-screen bg-white p-6">
            <div className="h-full">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    className="rounded-lg shadow-lg"
                />
            </div>

            {/* Event Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={handleCloseModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                                        {selectedEvent ? 'Edit Event' : 'Create New Event'}
                                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                            <FaTimes />
                                        </button>
                                    </Dialog.Title>

                                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Event Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Category</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                value={newEvent.category}
                                                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows="3"
                                                value={newEvent.description}
                                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                            />
                                        </div>

                                        {selectedEvent && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteEvent}
                                                className="w-full bg-red-500 text-white rounded-md py-2 hover:bg-red-600 transition-colors duration-300"
                                            >
                                                <FaTrash className="inline mr-2" /> Delete Event
                                            </button>
                                        )}

                                        <div className="mt-4 flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                onClick={handleCloseModal}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                                            >
                                                {selectedEvent ? 'Update' : 'Create'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            
            <ToastContainer />
        </div>
    );
};

export default ModernCalendar;