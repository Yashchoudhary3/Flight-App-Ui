import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { usersAPI, flightsAPI } from '../services/api';

const FLIGHT_STATUSES = ['scheduled', 'delayed', 'cancelled', 'departed', 'arrived'];
const USER_ROLES = ['user', 'admin'];

const AdminPanel = () => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleEdits, setRoleEdits] = useState({});
  const [statusEdits, setStatusEdits] = useState({});

  // Fetch users
  useEffect(() => {
    if (tab === 'users') {
      setLoading(true);
      usersAPI.getAll()
        .then(res => setUsers(res.data.users || []))
        .catch(() => toast.error('Failed to fetch users'))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  // Fetch flights
  useEffect(() => {
    if (tab === 'flights') {
      setLoading(true);
      flightsAPI.getAll()
        .then(res => setFlights(res.data.flights || []))
        .catch(() => toast.error('Failed to fetch flights'))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  // Change user role
  const handleRoleChange = (userId, newRole) => {
    setRoleEdits(edits => ({ ...edits, [userId]: newRole }));
  };
  const saveRole = async (userId) => {
    try {
      await usersAPI.updateRole(userId, roleEdits[userId]);
      toast.success('Role updated');
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: roleEdits[userId] } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  // Change flight status
  const handleStatusChange = (flightId, newStatus) => {
    setStatusEdits(edits => ({ ...edits, [flightId]: newStatus }));
  };
  const saveStatus = async (flightId) => {
    try {
      await flightsAPI.updateStatus(flightId, statusEdits[flightId]);
      toast.success('Status updated');
      setFlights(flights => flights.map(f => f.id === flightId ? { ...f, status: statusEdits[flightId] } : f));
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary-700">Admin Panel</h1>
        {/* Modern pill-style tabs */}
        <div className="flex gap-4 mb-10">
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 border-2 focus:outline-none ${
              tab === 'users'
                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                : 'bg-gray-100 text-gray-600 border-transparent hover:bg-primary-50 hover:text-primary-700'
            }`}
            onClick={() => setTab('users')}
          >
            Users
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 border-2 focus:outline-none ${
              tab === 'flights'
                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                : 'bg-gray-100 text-gray-600 border-transparent hover:bg-primary-50 hover:text-primary-700'
            }`}
            onClick={() => setTab('flights')}
          >
            Flights
          </button>
        </div>
        {loading ? <div className="text-center py-10">Loading...</div> : (
          <>
            {tab === 'users' && (
              <>
                <h2 className="text-2xl font-bold mb-6 text-primary-600">All Users</h2>
                <div className="overflow-x-auto rounded-lg shadow">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Name</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Email</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Role</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3 border-b">{user.firstName} {user.lastName}</td>
                          <td className="px-4 py-3 border-b">{user.email}</td>
                          <td className="px-4 py-3 border-b">{user.role}</td>
                          <td className="px-4 py-3 border-b">
                            <select
                              value={roleEdits[user.id] || user.role}
                              onChange={e => handleRoleChange(user.id, e.target.value)}
                              className="border border-gray-300 rounded-lg px-6 py-2 shadow-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all bg-white hover:bg-primary-50 text-base mr-3 appearance-none"
                              style={{ backgroundImage: 'none' }}
                            >
                              {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <button
                              className="ml-3 px-4 py-1.5 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400"
                              onClick={() => saveRole(user.id)}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {tab === 'flights' && (
              <>
                <h2 className="text-2xl font-bold mb-6 text-primary-600">All Flights</h2>
                <div className="overflow-x-auto rounded-lg shadow">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Flight #</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Airline</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">From</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">To</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Status</th>
                        <th className="px-4 py-3 border-b text-left text-sm font-semibold text-primary-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flights.map(flight => (
                        <tr key={flight.id} className="hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3 border-b">{flight.flight_number}</td>
                          <td className="px-4 py-3 border-b">{flight.airline}</td>
                          <td className="px-4 py-3 border-b">{flight.from_location} ({flight.from_airport})</td>
                          <td className="px-4 py-3 border-b">{flight.to_location} ({flight.to_airport})</td>
                          <td className="px-4 py-3 border-b">{flight.status}</td>
                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center gap-3">
                              <select
                                value={statusEdits[flight.id] || flight.status}
                                onChange={e => handleStatusChange(flight.id, e.target.value)}
                                className="border border-gray-300 rounded-lg px-6 py-2 shadow-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all bg-white hover:bg-primary-50 text-base mr-2 appearance-none"
                                style={{ backgroundImage: 'none' }}
                              >
                                {FLIGHT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                              </select>
                              <button
                                className="px-4 py-1.5 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400"
                                onClick={() => saveStatus(flight.id)}
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 