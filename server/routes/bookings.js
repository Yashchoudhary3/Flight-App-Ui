const express = require("express");
const { body, validationResult } = require("express-validator");
const { supabase } = require("../config/supabase");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { sendBookingConfirmation } = require("../utils/email");

const router = express.Router();

// Add a simple logger utility at the top
const logger = {
  info: (...args) => console.log("[INFO]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};

// Validation middleware
const validateBooking = [
  body("flightId").isUUID(),
  body("passengers").isArray({ min: 1, max: 10 }),
  body("passengers.*.firstName").isString().notEmpty(),
  body("passengers.*.lastName").isString().notEmpty(),
  body("passengers.*.dateOfBirth").optional().isString(),
  body("passengers.*.passportNumber").optional().isString(),
  body("contactEmail").isEmail(),
  body("contactPhone").isMobilePhone(),
  body("seatPreference").optional().isIn(["window", "aisle", "middle"]),
];

// Get user's bookings
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        flights (
          id,
          flight_number,
          airline,
          from_airport,
          to_airport,
          from_location,
          to_location,
          departure_time,
          arrival_time,
          duration,
          class,
          status
        )
      `
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Fetch bookings error:", error, "User:", req.user.id);
      return res
        .status(500)
        .json({ error: "Failed to fetch bookings", details: error.message });
    }

    res.json({ bookings });
  } catch (error) {
    logger.error("Get bookings error (catch):", error, "User:", req.user?.id);
    res
      .status(500)
      .json({ error: "Failed to fetch bookings", details: error.message });
  }
});

// Get booking by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("Requested booking id:", id, "User:", req.user.id);

    // Step 1: Try fetching just the booking
    let { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();
    logger.info("Booking found (no join):", booking);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found (no join)" });
    }

    // Step 2: Try fetching with flights join
    let { data: bookingWithFlight, error: errorFlight } = await supabase
      .from("bookings")
      .select(
        `
        *,
        flights (
          flight_number,
          airline,
          from,
          to,
          departure_time,
          arrival_time,
          duration,
          class,
          price
        )
      `
      )
      .eq("id", id)
      .single();
    logger.info("Booking with flight:", bookingWithFlight);

    // Step 3: Try fetching with passengers join
    let { data: bookingWithPassengers, error: errorPassengers } = await supabase
      .from("bookings")
      .select(
        `
        *,
        passengers (*)
      `
      )
      .eq("id", id)
      .single();
    logger.info("Booking with passengers:", bookingWithPassengers);

    // Step 4: Try fetching with both joins
    let { data: bookingFull, error: errorFull } = await supabase
      .from("bookings")
      .select(
        `
        *,
        flights (
          flight_number,
          airline,
          from,
          to,
          departure_time,
          arrival_time,
          duration,
          class,
          price
        ),
        passengers (*)
      `
      )
      .eq("id", id)
      .single();
    logger.info("Booking with flights and passengers:", bookingFull);

    // Use the most complete booking that is not null
    const result =
      bookingFull || bookingWithPassengers || bookingWithFlight || booking;

    // Check if user owns this booking or is admin
    if (result.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ booking: result });
  } catch (error) {
    logger.error("Get booking error:", error);
    res.status(500).json({ error: "Failed to get booking" });
  }
});

// Create new booking
router.post("/", authenticateToken, validateBooking, async (req, res) => {
  logger.info("POST /api/bookings called", {
    user: req.user?.id,
    body: req.body,
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error("Validation failed", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      flightId,
      passengers,
      contactEmail,
      contactPhone,
      seatPreference,
      specialRequests,
    } = req.body;

    logger.info("Looking up flight", { flightId });
    const { data: flight, error: flightError } = await supabase
      .from("flights")
      .select("*")
      .eq("id", flightId)
      .single();

    if (flightError || !flight) {
      logger.error("Flight not found or DB error", { flightError, flight });
      return res.status(404).json({ error: "Flight not found" });
    }

    logger.info("Checking available seats", {
      available: flight.available_seats,
      requested: passengers.length,
    });
    if (flight.available_seats < passengers.length) {
      logger.error("Not enough seats", {
        available: flight.available_seats,
        requested: passengers.length,
      });
      return res.status(400).json({
        error: `Only ${flight.available_seats} seats available`,
      });
    }

    logger.info("Checking flight departure time", {
      departure_time: flight.departure_time,
    });
    if (new Date(flight.departure_time) <= new Date()) {
      logger.error("Cannot book past flights", {
        departure_time: flight.departure_time,
      });
      return res.status(400).json({ error: "Cannot book past flights" });
    }

    // Calculate total price
    const totalPrice = flight.price * passengers.length;
    logger.info("Total price calculated", { totalPrice });

    // Generate booking reference
    const bookingReference = generateBookingReference();
    logger.info("Generated booking reference", { bookingReference });

    // Start transaction
    logger.info("Creating booking record");
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: req.user.id,
        flight_id: flightId,
        booking_reference: bookingReference,
        total_price: totalPrice,
        passenger_count: passengers.length,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        seat_preference: seatPreference,
        special_requests: specialRequests,
        status: "confirmed",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      logger.error("Failed to create booking", { bookingError });
      return res.status(500).json({ error: "Failed to create booking" });
    }

    logger.info("Creating passenger records", {
      bookingId: booking.id,
      passengers,
    });
    const passengerData = passengers.map((passenger) => ({
      booking_id: booking.id,
      first_name: passenger.firstName,
      last_name: passenger.lastName,
      ...(passenger.dateOfBirth
        ? { date_of_birth: passenger.dateOfBirth }
        : {}),
      passport_number: passenger.passportNumber,
      seat_number: null, // Will be assigned later
    }));

    const { error: passengerError } = await supabase
      .from("passengers")
      .insert(passengerData);

    if (passengerError) {
      logger.error("Passenger creation failed", {
        passengerError,
        passengerData,
      });
      // Rollback booking if passenger creation fails
      await supabase.from("bookings").delete().eq("id", booking.id);
      return res
        .status(500)
        .json({
          error: "Failed to create passenger records",
          details: passengerError.message,
          data: passengerData,
        });
    }

    logger.info("Updating available seats", {
      flightId,
      newAvailable: flight.available_seats - passengers.length,
    });
    const { error: updateError } = await supabase
      .from("flights")
      .update({
        available_seats: flight.available_seats - passengers.length,
      })
      .eq("id", flightId);

    if (updateError) {
      logger.error("Failed to update available seats", { updateError });
    }

    logger.info("Booking created successfully", {
      booking,
      passengers: passengerData,
    });
    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        ...booking,
        passengers: passengerData,
      },
    });

    // Send booking confirmation email (do not block response)
    logger.info("Sending booking confirmation email", { contactEmail });
    sendBookingConfirmation(
      contactEmail,
      "Your Flight Booking Confirmation",
      `<h2>Booking Confirmed!</h2>
       <p>Thank you for booking with us.</p>
       <p>Flight: ${flight.flight_number} (${flight.airline})</p>
       <p>From: ${flight.from_location} (${flight.from_airport})</p>
       <p>To: ${flight.to_location} (${flight.to_airport})</p>
       <p>Departure: ${new Date(flight.departure_time).toLocaleString()}</p>
       <p>Booking Reference: <b>${booking.booking_reference}</b></p>
       <p>We wish you a pleasant journey!</p>`
    ).catch((err) => {
      logger.error("Failed to send booking confirmation email", { err });
    });
  } catch (error) {
    logger.error("Create booking error (catch)", { error, stack: error.stack });
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Update booking status
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (
        !["pending", "confirmed", "cancelled", "completed"].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const { data: booking, error } = await supabase
        .from("bookings")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({
        message: "Booking status updated",
        booking,
      });
    } catch (error) {
      logger.error("Update booking status error:", error);
      res.status(500).json({ error: "Failed to update booking status" });
    }
  }
);

// Cancel booking
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user owns this booking or is admin
    if (booking.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel completed booking" });
    }

    // Get flight to check departure time
    const { data: flight } = await supabase
      .from("flights")
      .select("departure_time, available_seats")
      .eq("id", booking.flight_id)
      .single();

    if (flight && new Date(flight.departure_time) <= new Date()) {
      return res
        .status(400)
        .json({ error: "Cannot cancel booking for departed flight" });
    }

    // Restore available seats (fetch, add, update)
    if (flight) {
      const newSeats = (flight.available_seats || 0) + booking.passenger_count;
      const { error: seatError } = await supabase
        .from("flights")
        .update({ available_seats: newSeats })
        .eq("id", booking.flight_id);
      if (seatError) {
        logger.error("Failed to restore available seats:", seatError);
      }
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);
    if (deleteError) {
      return res.status(500).json({ error: "Failed to delete booking" });
    }

    res.json({ message: "Booking cancelled and deleted successfully" });
  } catch (error) {
    logger.error("Cancel booking error:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Get all bookings (Admin only)
router.get("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = supabase.from("bookings").select(
      `
        *,
        users (first_name, last_name, email),
        flights (flight_number, airline, from, to, departure_time)
      `,
      { count: "exact" }
    );

    if (status) {
      query = query.eq("status", status);
    }

    const offset = (page - 1) * limit;
    const {
      data: bookings,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error("Get all bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Update booking and passenger details
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { passengers, passenger_count } = req.body;

    logger.info("PATCH /api/bookings/:id called", {
      id,
      passenger_count,
      passengers,
    });

    // Fetch booking to check ownership
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();
    if (bookingError || !booking) {
      logger.error("Booking not found", { bookingError });
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.user_id !== req.user.id && req.user.role !== "admin") {
      logger.error("Access denied", {
        user: req.user.id,
        bookingUser: booking.user_id,
      });
      return res.status(403).json({ error: "Access denied" });
    }

    // If passenger_count is changed, recalculate total_price
    if (passenger_count && passenger_count !== booking.passenger_count) {
      logger.info("Passenger count changed, recalculating total_price");
      // Fetch flight price
      const { data: flight, error: flightError } = await supabase
        .from("flights")
        .select("price")
        .eq("id", booking.flight_id)
        .single();
      if (flightError || !flight) {
        logger.error("Flight not found for price update", { flightError });
        return res.status(404).json({ error: "Flight not found" });
      }
      const newTotalPrice = flight.price * passenger_count;
      logger.info("Updating booking with new passenger_count and total_price", {
        passenger_count,
        newTotalPrice,
      });
      await supabase
        .from("bookings")
        .update({
          passenger_count,
          total_price: newTotalPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } else {
      logger.info("Passenger count not changed, just updating updated_at");
      await supabase
        .from("bookings")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);
    }

    // Update each passenger (update existing, add new, delete removed)
    if (Array.isArray(passengers)) {
      logger.info("Updating passengers", { passengers });
      // 1. Get all current passengers for this booking
      const { data: currentPassengers, error: fetchPassengersError } =
        await supabase.from("passengers").select("id").eq("booking_id", id);

      if (fetchPassengersError) {
        logger.error("Failed to fetch current passengers", {
          fetchPassengersError,
        });
        return res
          .status(500)
          .json({ error: "Failed to fetch current passengers" });
      }

      const incomingIds = passengers.filter((p) => p.id).map((p) => p.id);
      const currentIds = (currentPassengers || []).map((p) => p.id);

      // 2. Update existing passengers
      const updatePromises = passengers
        .filter((p) => p.id)
        .map(async (p) => {
          const { data, error } = await supabase
            .from("passengers")
            .update({
              first_name: p.first_name,
              last_name: p.last_name,
              passport_number: p.passport_number,
            })
            .eq("id", p.id);

          if (error) {
            logger.error(`❌ Error updating ${p.id}:`, error.message);
          } else {
            logger.info(`✅ Updated passenger ${p.id}`, data);
          }

          return { data, error };
        });

      logger.info("My Console Log", { passengers });

      // 3. Insert new passengers
      const insertPromises = passengers
        .filter((p) => !p.id)
        .map((p) =>
          supabase.from("passengers").insert({
            booking_id: id,
            first_name: p.first_name,
            last_name: p.last_name,
            passport_number: p.passport_number,
            created_at: new Date().toISOString(),
          })
        );

      // 4. Delete removed passengers
      const toDelete = currentIds.filter((id) => !incomingIds.includes(id));
      let deletePromise = Promise.resolve();
      if (toDelete.length > 0) {
        logger.info("Deleting passengers", { toDelete });
        deletePromise = supabase.from("passengers").delete().in("id", toDelete);
      }

      // Wait for all DB operations to finish
      await Promise.all([...updatePromises, ...insertPromises, deletePromise]);
    }

    // Return updated booking with passengers
    const { data: updatedBooking, error: updatedError } = await supabase
      .from("bookings")
      .select(`*, passengers (*)`)
      .eq("id", id)
      .single();
    if (updatedError || !updatedBooking) {
      logger.error("Failed to fetch updated booking", { updatedError });
      return res.status(500).json({ error: "Failed to fetch updated booking" });
    }
    logger.info("Returning updated booking", updatedBooking.passengers);
    res.json({ booking: updatedBooking });
  } catch (error) {
    logger.error("Modify booking error:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// Helper function to generate booking reference
function generateBookingReference() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;
