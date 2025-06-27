import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Plane, 
  Search, 
  Calendar, 
  Users, 
  MapPin,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Globe
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { flightsAPI } from '../services/api';
import { cacheFlightSearch, getCachedFlightSearch } from '../utils/flightCache';

// Import the worker (Vite/Webpack 5+ syntax)
const flightWorker = new Worker(new URL('../workers/flightWorker.js', import.meta.url));

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departureDate: new Date(),
    returnDate: null,
    tripType: 'one-way',
    cabinClass: 'economy',
    passengers: { adults: 1, children: 0, infants: 0 }
  });
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);

  useEffect(() => {
    // Fetch all flights on mount
    const fetchAllFlights = async () => {
      setLoading(true);
      try {
        const res = await flightsAPI.getAll();
        setFlights(res.data.flights || []);
        setReturnFlights([]);
      } catch (err) {
        toast.error('Failed to fetch flights');
      } finally {
        setLoading(false);
      }
    };
    fetchAllFlights();
  }, []);

  const handlePassengerChange = (type, delta) => {
    setSearchForm((prev) => {
      const updated = { ...prev.passengers, [type]: Math.max(0, prev.passengers[type] + delta) };
      // At least 1 adult
      if (type === 'adults' && updated.adults < 1) updated.adults = 1;
      return { ...prev, passengers: updated };
    });
  };

  // Helper to create a unique key for each search
  function getQueryKey(params) {
    return JSON.stringify(params);
  }

  // Helper to format date as local YYYY-MM-DD
  function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFlights([]);
    setReturnFlights([]);
    try {
      const params = {
        from_location: searchForm.from,
        to_location: searchForm.to,
        date: formatDateLocal(searchForm.departureDate),
        class: searchForm.cabinClass,
        passengers: searchForm.passengers.adults + searchForm.passengers.children + searchForm.passengers.infants,
      };
      if (searchForm.tripType === 'round-trip' && searchForm.returnDate) {
        params.returnDate = formatDateLocal(searchForm.returnDate);
      }
      const queryKey = getQueryKey(params);
      // Try to get cached results first
      const cached = await getCachedFlightSearch(queryKey);
      if (cached) {
        setFlights(cached.flights || []);
        setReturnFlights(cached.returnFlights || []);
        setLoading(false);
        return;
      }
      // If not cached, fetch from API
      const res = await flightsAPI.search(params);
      setFlights(res.data.flights || []);
      setReturnFlights(res.data.returnFlights || []);
      // Cache the results
      await cacheFlightSearch(queryKey, res.data);
    } catch (err) {
      toast.error('Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (flightId) => {
    if (!isAuthenticated) {
      toast.info('Please log in to book a flight.');
      return;
    }
    const passengersCount = searchForm.passengers.adults + searchForm.passengers.children + searchForm.passengers.infants;
    navigate(`/booking/${flightId}`, { state: { passengersCount } });
  };

  const passengerSummary = `${searchForm.passengers.adults} Adult${searchForm.passengers.adults > 1 ? 's' : ''}` +
    (searchForm.passengers.children ? `, ${searchForm.passengers.children} Child${searchForm.passengers.children > 1 ? 'ren' : ''}` : '') +
    (searchForm.passengers.infants ? `, ${searchForm.passengers.infants} Infant${searchForm.passengers.infants > 1 ? 's' : ''}` : '');

  const features = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Your data is protected with bank-level security'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for your peace of mind'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Access to flights from over 500+ airlines worldwide'
    },
    {
      icon: Star,
      title: 'Best Prices',
      description: 'Guaranteed best prices with price match promise'
    }
  ];

  // Web Worker helpers for filtering and sorting
  function filterFlightsWithWorker(flights, filterOptions) {
    return new Promise((resolve) => {
      flightWorker.onmessage = (e) => resolve(e.data);
      flightWorker.postMessage({ flights, action: 'filter', payload: filterOptions });
    });
  }

  function sortFlightsWithWorker(flights, sortKey) {
    return new Promise((resolve) => {
      flightWorker.onmessage = (e) => resolve(e.data);
      flightWorker.postMessage({ flights, action: 'sort', payload: { key: sortKey } });
    });
  }

  // Example usage (uncomment to use):
  // useEffect(() => {
  //   if (flights.length > 0) {
  //     filterFlightsWithWorker(flights, { airline: 'IndiGo', class: 'economy' }).then(filtered => {
  //       setFlights(filtered);
  //     });
  //     // sortFlightsWithWorker(flights, 'price').then(sorted => setFlights(sorted));
  //   }
  // }, [flights]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover the World
              <br />
              <span className="text-primary-200">One Flight at a Time</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto">
              Book your next adventure with confidence. Find the best deals on flights worldwide.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="card bg-white/95 backdrop-blur-sm">
              <div className="card-body">
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* From */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="City (e.g. New York)"
                          value={searchForm.from}
                          onChange={(e) => setSearchForm({ ...searchForm, from: e.target.value })}
                          className="input pl-10 text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    {/* To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="City (e.g. London)"
                          value={searchForm.to}
                          onChange={(e) => setSearchForm({ ...searchForm, to: e.target.value })}
                          className="input pl-10 text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Trip Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                      <select
                        value={searchForm.tripType}
                        onChange={e => setSearchForm({ ...searchForm, tripType: e.target.value, returnDate: null })}
                        className="input text-gray-900"
                      >
                        <option value="one-way">One-way</option>
                        <option value="round-trip">Round-trip</option>
                      </select>
                    </div>

                    {/* Cabin Class */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cabin Class</label>
                      <select
                        value={searchForm.cabinClass}
                        onChange={e => setSearchForm({ ...searchForm, cabinClass: e.target.value })}
                        className="input text-gray-900"
                      >
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                    </div>

                    {/* Departure Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departure
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <DatePicker
                          selected={searchForm.departureDate}
                          onChange={(date) => setSearchForm({ ...searchForm, departureDate: date })}
                          minDate={new Date()}
                          className="input pl-10 text-gray-900"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>

                    {/* Return Date (if round-trip) */}
                    {searchForm.tripType === 'round-trip' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Return</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <DatePicker
                            selected={searchForm.returnDate}
                            onChange={(date) => setSearchForm({ ...searchForm, returnDate: date })}
                            minDate={searchForm.departureDate}
                            className="input pl-10 text-gray-900"
                            placeholderText="Select date"
                          />
                        </div>
                      </div>
                    )}

                    {/* Passengers */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                      <button
                        type="button"
                        className="input text-left w-full text-gray-900"
                        onClick={() => setShowPassengerDropdown(v => !v)}
                      >
                        <Users className="inline h-5 w-5 mr-2 text-gray-400" />
                        {passengerSummary}
                      </button>
                      {showPassengerDropdown && (
                        <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-gray-900">
                          {['adults', 'children', 'infants'].map(type => (
                            <div key={type} className="flex items-center justify-between mb-2">
                              <span className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                              <div className="flex items-center space-x-2">
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => handlePassengerChange(type, -1)}>-</button>
                                <span>{searchForm.passengers[type]}</span>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => handlePassengerChange(type, 1)}>+</button>
                              </div>
                            </div>
                          ))}
                          <button type="button" className="btn btn-primary btn-sm w-full mt-2" onClick={() => setShowPassengerDropdown(false)}>Done</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg flex items-center space-x-2"
                      disabled={loading}
                    >
                      {loading ? <span className="loading-spinner h-5 w-5"></span> : <Search className="h-5 w-5" />}
                      <span>Search Flights</span>
                    </button>
                  </div>

                  {/* Search Results Section (inside card, below button) */}
                  {(flights.length > 0 || returnFlights.length > 0 || (!loading && flights.length === 0 && returnFlights.length === 0)) && (
                    <div className="mt-8">
                      {flights.length > 0 && (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          <h2 className="text-xl font-bold mb-4 text-gray-900">Available Flights</h2>
                          {flights.map(flight => (
                            <div key={flight.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between bg-white">
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-4 items-center mb-2">
                                  <span className="font-semibold text-primary-700">{flight.flight_number}</span>
                                  <span className="text-gray-600">{flight.airline}</span>
                                  <span className="text-gray-500">{flight.class && flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}</span>
                                </div>
                                <div className="flex flex-wrap gap-6 items-center text-sm text-gray-700 mb-1">
                                  <span>From: <span className="font-medium">{flight.from_location} ({flight.from_airport})</span></span>
                                  <span>To: <span className="font-medium">{flight.to_location} ({flight.to_airport})</span></span>
                                  <span>Departs: <span className="font-medium">{new Date(flight.departure_time).toLocaleString()}</span></span>
                                  <span>Arrives: <span className="font-medium">{new Date(flight.arrival_time).toLocaleString()}</span></span>
                                  <span>Duration: <span className="font-medium">{flight.duration} min</span></span>
                                  <span>Seats: <span className="font-medium">{flight.available_seats}</span></span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
                                <span className="text-lg font-bold text-primary-700 mb-2">${flight.price}</span>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleBook(flight.id)}
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {returnFlights.length > 0 && (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mt-8">
                          <h2 className="text-xl font-bold mb-4">Return Flights</h2>
                          {returnFlights.map(flight => (
                            <div key={flight.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between bg-white">
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-4 items-center mb-2">
                                  <span className="font-semibold text-primary-700">{flight.flight_number}</span>
                                  <span className="text-gray-600">{flight.airline}</span>
                                  <span className="text-gray-500">{flight.class && flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}</span>
                                </div>
                                <div className="flex flex-wrap gap-6 items-center text-sm text-gray-700 mb-1">
                                  <span>From: <span className="font-medium">{flight.from_location} ({flight.from_airport})</span></span>
                                  <span>To: <span className="font-medium">{flight.to_location} ({flight.to_airport})</span></span>
                                  <span>Departs: <span className="font-medium">{new Date(flight.departure_time).toLocaleString()}</span></span>
                                  <span>Arrives: <span className="font-medium">{new Date(flight.arrival_time).toLocaleString()}</span></span>
                                  <span>Duration: <span className="font-medium">{flight.duration} min</span></span>
                                  <span>Seats: <span className="font-medium">{flight.available_seats}</span></span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
                                <span className="text-lg font-bold text-primary-700 mb-2">${flight.price}</span>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleBook(flight.id)}
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!loading && flights.length === 0 && returnFlights.length === 0) && (
                        <div className="text-center text-gray-400">No flights found. Try searching above.</div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose FlightBook?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide the best booking experience with competitive prices and excellent service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 