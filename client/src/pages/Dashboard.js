import React, { useState } from 'react';
import Profile from './Profile';
import MyBookings from './MyBookings';

const Dashboard = () => {
  const [section, setSection] = useState('profile');

  const renderSection = () => {
    switch (section) {
      case 'profile':
        return <Profile />;
      case 'bookings':
        return <MyBookings />;
      default:
        return <Profile />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col space-y-4">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <button className={`text-left px-4 py-2 rounded ${section === 'profile' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setSection('profile')}>Profile</button>
        <button className={`text-left px-4 py-2 rounded ${section === 'bookings' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setSection('bookings')}>My Bookings</button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        {renderSection()}
      </main>
    </div>
  );
};

export default Dashboard; 