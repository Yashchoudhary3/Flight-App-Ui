import { useEffect } from 'react';

export function useFlightStatusRealtime(onStatusUpdate) {
  useEffect(() => {
    const evtSource = new EventSource('http://localhost:5000/api/flights/stream');
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