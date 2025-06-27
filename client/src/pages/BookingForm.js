import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { flightsAPI, bookingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { X, User } from 'lucide-react';

const PASSENGER_TYPES = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'infant', label: 'Infant' },
];

const BookingForm = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const initialCount = location.state?.passengersCount || 1;
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    passengers: Array.from({ length: initialCount }, () => ({
      type: 'adult',
      firstName: '',
      lastName: '',
      passportNumber: ''
    })),
    contactEmail: user?.email || '',
    contactPhone: '',
    seatPreference: '',
    specialRequests: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: `/booking/${flightId}` } });
      return;
    }
    const fetchFlight = async () => {
      setLoading(true);
      try {
        const res = await flightsAPI.getById(flightId);
        setFlight(res.data.flight);
      } catch (err) {
        toast.error('Failed to fetch flight details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchFlight();
    // eslint-disable-next-line
  }, [flightId, isAuthenticated]);

  const handlePassengerChange = (idx, field, value) => {
    setForm((prev) => {
      const updated = [...prev.passengers];
      updated[idx][field] = value;
      return { ...prev, passengers: updated };
    });
  };

  const handleAddPassenger = () => {
    if (form.passengers.length >= 10) return;
    setForm((prev) => ({
      ...prev,
      passengers: [
        ...prev.passengers,
        { type: 'adult', firstName: '', lastName: '', passportNumber: '' }
      ]
    }));
  };

  const handleRemovePassenger = (idx) => {
    if (form.passengers.length <= 1) return;
    setForm((prev) => ({ ...prev, passengers: prev.passengers.filter((_, i) => i !== idx) }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Only send seatPreference if selected
      const bookingPayload = {
        flightId,
        passengers: form.passengers.map(({ type, dateOfBirth, ...rest }) => rest), // type and dateOfBirth are for UI only
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        specialRequests: form.specialRequests
      };
      if (form.seatPreference) {
        bookingPayload.seatPreference = form.seatPreference;
      }
      await bookingsAPI.create(bookingPayload);
      toast.success('Booking successful!');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!flight) return null;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Book Flight</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Flight Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div><strong>Flight:</strong> {flight.flight_number} ({flight.airline})</div>
          <div><strong>Class:</strong> {flight.class}</div>
          <div><strong>From:</strong> {flight.from_location} ({flight.from_airport})</div>
          <div><strong>To:</strong> {flight.to_location} ({flight.to_airport})</div>
          <div><strong>Departure:</strong> {new Date(flight.departure_time).toLocaleString()}</div>
          <div><strong>Arrival:</strong> {new Date(flight.arrival_time).toLocaleString()}</div>
          <div><strong>Duration:</strong> {flight.duration} min</div>
          <div><strong>Seats Available:</strong> {flight.available_seats}</div>
          <div><strong>Price:</strong> ${flight.price}</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold mb-4">Passenger Details</h2>
        {form.passengers.map((p, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-2 md:gap-4 mb-2 items-center group">
            <select
              className="input"
              value={p.type}
              onChange={e => handlePassengerChange(idx, 'type', e.target.value)}
              style={{ minWidth: 100 }}
            >
              {PASSENGER_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input type="text" className="input" placeholder="First Name" value={p.firstName} onChange={e => handlePassengerChange(idx, 'firstName', e.target.value)} required />
            <input type="text" className="input" placeholder="Last Name" value={p.lastName} onChange={e => handlePassengerChange(idx, 'lastName', e.target.value)} required />
            <input type="text" className="input" placeholder="Passport Number" value={p.passportNumber} onChange={e => handlePassengerChange(idx, 'passportNumber', e.target.value)} />
            {form.passengers.length > 1 && (
              <div className="flex w-full md:w-auto justify-end">
                <button
                  type="button"
                  className="border border-red-400 text-red-500 bg-white hover:bg-red-50 rounded-full p-1 shadow-md transition group-hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
                  title="Remove Passenger"
                  onClick={() => handleRemovePassenger(idx)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-primary btn-sm flex items-center gap-2 mt-2"
          onClick={handleAddPassenger}
          disabled={form.passengers.length >= 10}
        >
          <User className="h-4 w-4" /> Add Passenger
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="email" className="input" name="contactEmail" placeholder="Contact Email" value={form.contactEmail} onChange={handleChange} required />
          <input type="tel" className="input" name="contactPhone" placeholder="Contact Phone" value={form.contactPhone} onChange={handleChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="input" name="seatPreference" value={form.seatPreference} onChange={handleChange}>
            <option value="">Seat Preference (optional)</option>
            <option value="window">Window</option>
            <option value="aisle">Aisle</option>
            <option value="middle">Middle</option>
          </select>
          <input type="text" className="input" name="specialRequests" placeholder="Special Requests (optional)" value={form.specialRequests} onChange={handleChange} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>{submitting ? 'Booking...' : 'Book Flight'}</button>
      </form>
    </div>
  );
};

export default BookingForm; 