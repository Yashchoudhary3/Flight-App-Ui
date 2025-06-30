import { useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function useFlightStatusRealtime(onStatusUpdate) {
  useEffect(() => {
    const evtSource = new EventSource(`${API_URL}api/flights/stream`);
    evtSource.onmessage = (event) => {
      console.log('SSE received:', event.data);
      const updatedFlight = JSON.parse(event.data);
      onStatusUpdate(updatedFlight);
    };
    return () => {
      evtSource.close();
    };
  }, [onStatusUpdate]);
} 