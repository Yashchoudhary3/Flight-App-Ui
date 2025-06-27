const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Store SSE clients
const flightSSEClients = [];

// Validation middleware
const validateFlightSearch = [
  query('from').optional().isString(),
  query('to').optional().isString(),
  query('date').optional().isISO8601(),
  query('returnDate').optional().isISO8601(),
  query('passengers').optional().isInt({ min: 1, max: 10 }),
  query('class').optional().isIn(['economy', 'premium_economy', 'business', 'first']),
];

const validateFlightCreate = [
  body('flightNumber').isString().isLength({ min: 3 }),
  body('airline').isString().notEmpty(),
  body('from_airport').isString().notEmpty(),
  body('to_airport').isString().notEmpty(),
  body('departureTime').isISO8601(),
  body('arrivalTime').isISO8601(),
  body('duration').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('seats').isInt({ min: 1 }),
  body('class').isIn(['economy', 'business', 'first'])
];

// Search flights (supports round-trip)
router.get('/', validateFlightSearch, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      from,
      to,
      date,
      returnDate,
      passengers = 1,
      class: flightClass,
      sort = 'departure_time',
      order = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    // Outbound flights
    let outboundQuery = supabase
      .from('flights')
      .select('*', { count: 'exact' })
      .gte('departure_time', new Date().toISOString());

    if (from) outboundQuery = outboundQuery.ilike('from_airport', `%${from}%`);
    if (to) outboundQuery = outboundQuery.ilike('to_airport', `%${to}%`);
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      outboundQuery = outboundQuery
        .gte('departure_time', searchDate.toISOString())
        .lt('departure_time', nextDay.toISOString());
    }
    if (flightClass) outboundQuery = outboundQuery.eq('class', flightClass);
    if (passengers) outboundQuery = outboundQuery.gte('available_seats', passengers);
    outboundQuery = outboundQuery.order(sort, { ascending: order === 'asc' });
    const offset = (page - 1) * limit;
    outboundQuery = outboundQuery.range(offset, offset + limit - 1);

    const { data: outboundFlights, error: outboundError, count } = await outboundQuery;
    if (outboundError) {
      return res.status(500).json({ error: 'Failed to fetch flights' });
    }

    // Round-trip: find return flights
    let returnFlights = [];
    if (returnDate && from && to) {
      let returnQuery = supabase
        .from('flights')
        .select('*')
        .gte('departure_time', new Date().toISOString());
      // Swap from/to for return
      returnQuery = returnQuery.ilike('from_airport', `%${to}%`).ilike('to_airport', `%${from}%`);
      const searchReturnDate = new Date(returnDate);
      const nextReturnDay = new Date(searchReturnDate);
      nextReturnDay.setDate(nextReturnDay.getDate() + 1);
      returnQuery = returnQuery
        .gte('departure_time', searchReturnDate.toISOString())
        .lt('departure_time', nextReturnDay.toISOString());
      if (flightClass) returnQuery = returnQuery.eq('class', flightClass);
      if (passengers) returnQuery = returnQuery.gte('available_seats', passengers);
      returnQuery = returnQuery.order(sort, { ascending: order === 'asc' });
      const { data: returnData, error: returnError } = await returnQuery;
      if (!returnError) returnFlights = returnData;
    }

    res.json({
      flights: outboundFlights,
      returnFlights,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Failed to search flights' });
  }
});

// SSE endpoint for real-time flight status
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  flightSSEClients.push(res);

  req.on('close', () => {
    const idx = flightSSEClients.indexOf(res);
    if (idx !== -1) flightSSEClients.splice(idx, 1);
  });
});

// Get flight by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: flight, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json({ flight });

  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({ error: 'Failed to get flight' });
  }
});

// Create new flight (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), validateFlightCreate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      flightNumber,
      airline,
      from_airport,
      to_airport,
      departureTime,
      arrivalTime,
      duration,
      price,
      seats,
      class: flightClass
    } = req.body;

    // Check if flight number already exists
    const { data: existingFlight } = await supabase
      .from('flights')
      .select('id')
      .eq('flight_number', flightNumber)
      .eq('departure_time', departureTime)
      .single();

    if (existingFlight) {
      return res.status(400).json({ error: 'Flight already exists' });
    }

    const { data: flight, error } = await supabase
      .from('flights')
      .insert({
        flight_number: flightNumber,
        airline,
        from_airport,
        to_airport,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        duration,
        price,
        total_seats: seats,
        available_seats: seats,
        class: flightClass,
        status: 'scheduled',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create flight' });
    }

    res.status(201).json({
      message: 'Flight created successfully',
      flight
    });

  } catch (error) {
    console.error('Create flight error:', error);
    res.status(500).json({ error: 'Failed to create flight' });
  }
});

// Update flight (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    const { data: flight, error } = await supabase
      .from('flights')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Broadcast the updated flight to SSE clients
    broadcastFlightUpdate(flight);

    res.json({
      message: 'Flight updated successfully',
      flight
    });

  } catch (error) {
    console.error('Update flight error:', error);
    res.status(500).json({ error: 'Failed to update flight' });
  }
});

// Delete flight (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if flight has any bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('flight_id', id);

    if (bookings && bookings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete flight with existing bookings' 
      });
    }

    const { error } = await supabase
      .from('flights')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete flight' });
    }

    res.json({ message: 'Flight deleted successfully' });

  } catch (error) {
    console.error('Delete flight error:', error);
    res.status(500).json({ error: 'Failed to delete flight' });
  }
});

// Get popular routes
router.get('/popular/routes', async (req, res) => {
  try {
    const { data: routes, error } = await supabase
      .from('flights')
      .select('from, to, count')
      .select('from, to')
      .gte('departure_time', new Date().toISOString())
      .limit(10);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch popular routes' });
    }

    // Count occurrences of each route
    const routeCounts = {};
    routes.forEach(flight => {
      const route = `${flight.from} - ${flight.to}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    const popularRoutes = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ popularRoutes });

  } catch (error) {
    console.error('Popular routes error:', error);
    res.status(500).json({ error: 'Failed to fetch popular routes' });
  }
});

// Function to broadcast flight updates
function broadcastFlightUpdate(flight) {
  const data = `data: ${JSON.stringify(flight)}\n\n`;
  console.log('Broadcasting flight update:', data);
  flightSSEClients.forEach((client) => client.write(data));
}

module.exports = { router, broadcastFlightUpdate }; 