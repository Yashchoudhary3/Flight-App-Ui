/* eslint-disable no-restricted-globals */
// This file is a Web Worker for filtering and sorting flights

self.onmessage = function (e) {
  const { flights, action, payload } = e.data;

  let result = [];
  if (action === 'filter') {
    // Example: filter by airline or class
    result = flights.filter(flight => {
      let match = true;
      if (payload.airline) match = match && flight.airline === payload.airline;
      if (payload.class) match = match && flight.class === payload.class;
      return match;
    });
  } else if (action === 'sort') {
    // Example: sort by price, duration, etc.
    result = [...flights].sort((a, b) => {
      if (payload.key === 'price') return a.price - b.price;
      if (payload.key === 'duration') return a.duration - b.duration;
      return 0;
    });
  }
  // You can add more actions as needed

  self.postMessage(result);
  // Log for testing
  console.log('[flightWorker] Processed action:', action, 'Payload:', payload, 'Result count:', result.length);
}; 