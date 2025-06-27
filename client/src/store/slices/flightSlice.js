import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { flightsAPI } from '../../services/api';

// Async thunks
export const searchFlights = createAsyncThunk(
  'flights/search',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await flightsAPI.search(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Flight search failed');
    }
  }
);

export const getFlightById = createAsyncThunk(
  'flights/getById',
  async (flightId, { rejectWithValue }) => {
    try {
      const response = await flightsAPI.getById(flightId);
      return response.data.flight;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get flight details');
    }
  }
);

export const getPopularRoutes = createAsyncThunk(
  'flights/getPopularRoutes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await flightsAPI.getPopularRoutes();
      return response.data.popularRoutes;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get popular routes');
    }
  }
);

export const createFlight = createAsyncThunk(
  'flights/create',
  async (flightData, { rejectWithValue }) => {
    try {
      const response = await flightsAPI.create(flightData);
      return response.data.flight;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create flight');
    }
  }
);

export const updateFlight = createAsyncThunk(
  'flights/update',
  async ({ id, flightData }, { rejectWithValue }) => {
    try {
      const response = await flightsAPI.update(id, flightData);
      return response.data.flight;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update flight');
    }
  }
);

export const deleteFlight = createAsyncThunk(
  'flights/delete',
  async (flightId, { rejectWithValue }) => {
    try {
      await flightsAPI.delete(flightId);
      return flightId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete flight');
    }
  }
);

const initialState = {
  flights: [],
  selectedFlight: null,
  popularRoutes: [],
  searchParams: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  loading: false,
  error: null,
  filters: {
    from: '',
    to: '',
    date: '',
    passengers: 1,
    class: 'economy',
    sort: 'departure',
    order: 'asc'
  }
};

const flightSlice = createSlice({
  name: 'flights',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchParams: (state, action) => {
      state.searchParams = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFlights: (state) => {
      state.flights = [];
      state.pagination = initialState.pagination;
    },
    setSelectedFlight: (state, action) => {
      state.selectedFlight = action.payload;
    },
    clearSelectedFlight: (state) => {
      state.selectedFlight = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search flights
      .addCase(searchFlights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchFlights.fulfilled, (state, action) => {
        state.loading = false;
        state.flights = action.payload.flights;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchFlights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get flight by ID
      .addCase(getFlightById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFlightById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedFlight = action.payload;
      })
      .addCase(getFlightById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get popular routes
      .addCase(getPopularRoutes.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPopularRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.popularRoutes = action.payload;
      })
      .addCase(getPopularRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create flight
      .addCase(createFlight.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFlight.fulfilled, (state, action) => {
        state.loading = false;
        state.flights.unshift(action.payload);
      })
      .addCase(createFlight.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update flight
      .addCase(updateFlight.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFlight.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.flights.findIndex(flight => flight.id === action.payload.id);
        if (index !== -1) {
          state.flights[index] = action.payload;
        }
        if (state.selectedFlight?.id === action.payload.id) {
          state.selectedFlight = action.payload;
        }
      })
      .addCase(updateFlight.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete flight
      .addCase(deleteFlight.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFlight.fulfilled, (state, action) => {
        state.loading = false;
        state.flights = state.flights.filter(flight => flight.id !== action.payload);
        if (state.selectedFlight?.id === action.payload) {
          state.selectedFlight = null;
        }
      })
      .addCase(deleteFlight.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setSearchParams, 
  setFilters, 
  clearFlights, 
  setSelectedFlight, 
  clearSelectedFlight 
} = flightSlice.actions;

export default flightSlice.reducer; 