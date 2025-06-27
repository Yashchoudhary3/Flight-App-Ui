import React, { useEffect, useState } from 'react';
import { bookingsAPI, flightsAPI } from '../services/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useFlightStatusRealtime } from '../hooks/useFlightStatusRealtime';

function getTimeStatus(departureTime) {
  const now = new Date();
  const dep = new Date(departureTime);
  if (dep < now) return { status: 'departed', text: 'Departed' };
  const diffMs = dep - now;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs / (1000 * 60)) % 60);
  return {
    status: 'upcoming',
    text: `Departs in ${diffH > 0 ? diffH + 'h ' : ''}${diffM}m`,
  };
}

const MyBookings = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [modifyData, setModifyData] = useState({});
  const [showCancel, setShowCancel] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: '/my-bookings' } });
      return;
    }
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await bookingsAPI.getMyBookings();
        let bookingsData = res.data.bookings || [];
        // Fetch latest flight data for each booking
        bookingsData = await Promise.all(bookingsData.map(async (booking) => {
          if (booking.flight_id) {
            try {
              const flightRes = await flightsAPI.getById(booking.flight_id);
              return { ...booking, flights: flightRes.data.flight };
            } catch {
              return booking;
            }
          }
          return booking;
        }));
        setBookings(bookingsData);
      } catch (err) {
        toast.error('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [isAuthenticated, navigate]);

  useFlightStatusRealtime((updatedFlight) => {
    setBookings((prev) => {
      const updated = prev.map(b =>
        b.flights && b.flights.id === updatedFlight.id
          ? { ...b, flights: { ...b.flights, ...updatedFlight } }
          : b
      );
      console.log('Bookings after SSE update:', updated);
      return updated;
    });
  });

  const handleShowTicket = (booking) => {
    setSelectedBooking(booking);
    setShowTicket(true);
  };

  const handleModify = async (booking) => {
    setModalLoading(true);
    try {
      const res = await bookingsAPI.getById(booking.id);
      const fullBooking = res.data.booking;
      setSelectedBooking(fullBooking);
      setModifyData({
        id: fullBooking.id,
        passengers: (fullBooking.passengers && fullBooking.passengers.length > 0)
          ? fullBooking.passengers.map(p => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              passport_number: p.passport_number || '',
            }))
          : [{ first_name: '', last_name: '', passport_number: '' }],
        passenger_count: fullBooking.passenger_count,
      });
      setShowModify(true);
    } catch (err) {
      toast.error('Failed to load booking details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancel = (booking) => {
    setSelectedBooking(booking);
    setShowCancel(true);
  };

  const confirmCancel = async () => {
    try {
      await bookingsAPI.cancelBooking(selectedBooking.id);
      toast.success('Booking cancelled');
      setBookings((prev) => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b));
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setShowCancel(false);
      setSelectedBooking(null);
    }
  };

  const handleModifySave = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    console.log('Saving booking changes:', modifyData);
    try {
      if (!modifyData.id) {
        toast.error('No booking selected');
        setModalLoading(false);
        return;
      }
      await bookingsAPI.modifyBooking(modifyData.id, modifyData);
      toast.success('Booking updated');
      setShowModify(false);
      setSelectedBooking(null);
      // Optionally refetch bookings
      const res = await bookingsAPI.getMyBookings();
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error('Failed to update booking');
      console.error('Modify booking error:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadTicket = () => {
    window.print(); // For now, use print dialog for download
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center text-gray-500">No bookings found.</div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const flightStatus = booking.flights?.status;
            const timeStatus = getTimeStatus(booking.flights?.departure_time);
            // Calculate total price as passenger_count * ticket price if available
            const ticketPrice = booking.flights?.price || 0;
            const total = ticketPrice && booking.passenger_count ? (booking.passenger_count * ticketPrice) : booking.total_price;
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                
                <div className="flex-1">
                  <div className="flex flex-wrap gap-4 items-center mb-2">
                    <span className="font-semibold text-primary-700">{booking.flights?.flight_number}</span>
                    <span className="text-gray-600">{booking.flights?.airline}</span>
                    <span className="text-gray-500">{booking.flights?.class && booking.flights.class.charAt(0).toUpperCase() + booking.flights.class.slice(1)}</span>
                    {/* Show time left badge only if status is 'scheduled' */}
                    {flightStatus === 'scheduled' && (
                      <span className={`text-xs px-2 py-1 rounded ml-2 ${timeStatus.status === 'departed' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>{timeStatus.text}</span>
                    )}
                    {/* Always show flight status badge (live) */}
                    <span
                      className={`text-xs px-2 py-1 rounded ml-2 font-semibold uppercase tracking-wider ${
                        flightStatus === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : flightStatus === 'delayed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : flightStatus === 'departed'
                          ? 'bg-gray-200 text-gray-700'
                          : flightStatus === 'arrived'
                          ? 'bg-green-100 text-green-700'
                          : flightStatus === 'scheduled'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {flightStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-6 items-center text-sm text-gray-700 mb-1">
                    <span>From: <span className="font-medium">{booking.flights?.from_location} ({booking.flights?.from_airport})</span></span>
                    <span>To: <span className="font-medium">{booking.flights?.to_location} ({booking.flights?.to_airport})</span></span>
                    <span>Departs: <span className="font-medium">{booking.flights?.departure_time && new Date(booking.flights.departure_time).toLocaleString()}</span></span>
                    <span>Arrives: <span className="font-medium">{booking.flights?.arrival_time && new Date(booking.flights.arrival_time).toLocaleString()}</span></span>
                    <span>Passengers: <span className="font-medium">{booking.passenger_count}</span></span>
                    <span>Total: <span className="font-medium">${total}</span></span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Booking Ref: {booking.booking_reference}</div>
                </div>
                {/* Only show action buttons if status is 'scheduled' */}
                {flightStatus === 'scheduled' && (
                  <div className="flex flex-row gap-3 mt-4 md:mt-0 md:ml-4">
                    <button title="View E-Ticket" className="p-2 rounded hover:bg-gray-100" onClick={() => handleShowTicket(booking)}><FaEye /></button>
                    <button title="Modify Booking" className="p-2 rounded hover:bg-gray-100" onClick={() => handleModify(booking)} disabled={flightStatus !== 'scheduled'}><FaEdit /></button>
                    <button title="Cancel Booking" className="p-2 rounded hover:bg-gray-100" onClick={() => handleCancel(booking)} disabled={flightStatus !== 'scheduled'}><FaTrash /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* E-Ticket Modal */}
      {showTicket && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-0 relative print:w-full print:max-w-full">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl" onClick={() => setShowTicket(false)}>&times;</button>
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-400 rounded-t-xl px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-white tracking-wider">E-Ticket</div>
                <div className="text-xs text-blue-100">Booking Ref: <span className="font-mono">{selectedBooking.booking_reference}</span></div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold text-lg">{selectedBooking.flights?.airline}</div>
                <div className="text-blue-100 text-xs">{selectedBooking.flights?.flight_number}</div>
              </div>
            </div>
            {/* Ticket Body */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">From</div>
                  <div className="font-bold text-black text-lg">{selectedBooking.flights?.from_location} <span className="text-xs font-normal">({selectedBooking.flights?.from_airport})</span></div>
                  <div className="text-xs text-gray-500">Departure</div>
                  <div className="text-black">{selectedBooking.flights?.departure_time && new Date(selectedBooking.flights.departure_time).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl text-blue-700 font-bold">✈️</div>
                  <div className="text-xs text-gray-400">{selectedBooking.flights?.class?.toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">To</div>
                  <div className="font-bold text-black text-lg">{selectedBooking.flights?.to_location} <span className="text-xs font-normal">({selectedBooking.flights?.to_airport})</span></div>
                  <div className="text-xs text-gray-500">Arrival</div>
                  <div className="text-black">{selectedBooking.flights?.arrival_time && new Date(selectedBooking.flights.arrival_time).toLocaleString()}</div>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-300 my-4"></div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-semibold text-black capitalize">{selectedBooking.status}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Paid</div>
                  <div className="font-semibold text-black">${selectedBooking.total_price}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Passengers</div>
                  <div className="font-semibold text-black">{selectedBooking.passenger_count}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Class</div>
                  <div className="font-semibold text-black">{selectedBooking.flights?.class?.toUpperCase()}</div>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-300 my-4"></div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Passenger Details</div>
                <ul className="list-none pl-0">
                  {(selectedBooking.passengers && selectedBooking.passengers.length > 0 ? selectedBooking.passengers : [{ first_name: 'N/A', last_name: '', passport_number: '' }]).map((p, idx) => (
                    <li key={p.id || idx} className="mb-1 text-black flex items-center gap-2">
                      <span className="font-semibold">{p.first_name} {p.last_name}</span>
                      {p.passport_number && <span className="text-xs text-gray-500">Passport: {p.passport_number}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 print:hidden" onClick={handleDownloadTicket}>Download E-Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {showModify && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-0 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl" onClick={() => { setShowModify(false); setSelectedBooking(null); }}>&times;</button>
            <div className="bg-gradient-to-r from-blue-700 to-blue-400 rounded-t-xl px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-wider">Modify Booking</h2>
              <div className="text-blue-100 text-xs">Booking Ref: <span className="font-mono">{selectedBooking.booking_reference}</span></div>
            </div>
            {modalLoading ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : (
            <form className="px-6 py-6" onSubmit={handleModifySave}>
              <div className="mb-6">
                <label className="block text-black font-semibold mb-1">Number of Passengers</label>
                <input type="number" min="1" max="10" value={modifyData.passenger_count} onChange={e => setModifyData(d => ({ ...d, passenger_count: e.target.value }))} className="border px-2 py-2 rounded w-full text-black font-medium" />
              </div>
              <div className="mb-2">
                <div className="text-black font-semibold mb-2">Passenger Details</div>
                {(modifyData.passengers && modifyData.passengers.length > 0 ? modifyData.passengers : [{ first_name: '', last_name: '', passport_number: '' }]).map((p, idx) => (
                  <div key={p.id || idx} className="mb-4 pb-4 border-b border-dashed border-gray-300 last:border-b-0 last:pb-0">
                    <div className="flex gap-2 mb-2">
                      <div className="w-1/2">
                        <label className="block text-xs text-gray-600 mb-1">First Name</label>
                        <input type="text" value={p.first_name} onChange={e => setModifyData(d => { const arr = [...d.passengers]; arr[idx].first_name = e.target.value; return { ...d, passengers: arr }; })} className="border px-2 py-1 rounded w-full text-black" />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                        <input type="text" value={p.last_name} onChange={e => setModifyData(d => { const arr = [...d.passengers]; arr[idx].last_name = e.target.value; return { ...d, passengers: arr }; })} className="border px-2 py-1 rounded w-full text-black" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Passport Number</label>
                      <input type="text" placeholder="Passport Number" value={p.passport_number} onChange={e => setModifyData(d => { const arr = [...d.passengers]; arr[idx].passport_number = e.target.value; return { ...d, passengers: arr }; })} className="border px-2 py-1 rounded w-full text-black" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="bg-gray-200 text-black px-4 py-2 rounded" onClick={() => { setShowModify(false); setSelectedBooking(null); }}>Cancel</button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">Save Changes</button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancel && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowCancel(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-black">Cancel Booking</h2>
            <p className="mb-4 text-black">Are you sure you want to cancel this booking?</p>
            <div className="flex justify-end gap-2">
              <button className="bg-gray-200 text-black px-4 py-2 rounded" onClick={() => setShowCancel(false)}>No</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={confirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings; 