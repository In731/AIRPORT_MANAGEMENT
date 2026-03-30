const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// GET /api/flights
router.get('/', async (req, res) => {
    let connection;
    try {
        const { status, airline, aircraft } = req.query;
        connection = await db.getConnection();
        const sql = `BEGIN Get_Filtered_Flights(:status, :airline, :aircraft, :cursor); END;`;
        const binds = {
            status: status || null,
            airline: airline || null,
            aircraft: aircraft || null,
            cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
        };
        
        const result = await connection.execute(sql, binds);
        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows();
        await resultSet.close();
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/flights/:id
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT f.Flight_ID as "FLIGHT_ID", f.Flight_Number as "FLIGHT_NUMBER", 
                   a.Airline_Name as "AIRLINE_NAME", a.Airline_Code as "AIRLINE_CODE",
                   ac.Aircraft_Model as "AIRCRAFT_MODEL", ac.Capacity as "CAPACITY", 
                   f.Departure_Airport as "DEPARTURE_AIRPORT", f.Arrival_Airport as "ARRIVAL_AIRPORT", 
                   f.Departure_Time as "DEPARTURE_TIME", f.Arrival_Time as "ARRIVAL_TIME", 
                   f.Flight_Status as "FLIGHT_STATUS",
                   COUNT(bp.BoardingPass_ID) AS "PASSENGERS_BOOKED"
            FROM Flight f
            JOIN Airline a ON f.Airline_ID = a.Airline_ID
            JOIN Aircraft ac ON f.Aircraft_ID = ac.Aircraft_ID
            LEFT JOIN Boarding_Pass bp ON f.Flight_ID = bp.Flight_ID
            WHERE f.Flight_ID = :id
            GROUP BY f.Flight_ID, f.Flight_Number, a.Airline_Name, a.Airline_Code,
                     ac.Aircraft_Model, ac.Capacity, f.Departure_Airport,
                     f.Arrival_Airport, f.Departure_Time, f.Arrival_Time, f.Flight_Status
            ORDER BY f.Departure_Time
        `;
        const result = await connection.execute(sql, { id: req.params.id });
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Flight not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// POST /api/flights
router.post('/', async (req, res) => {
    let connection;
    try {
        const { flightNumber, airlineId, aircraftId, departureAirport, arrivalAirport, departureTime, arrivalTime, flightStatus } = req.body;
        connection = await db.getConnection();
        const sql = `
            INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status)
            VALUES (:flightNumber, :airlineId, :aircraftId, :departureAirport, :arrivalAirport, TO_TIMESTAMP(:departureTime,'YYYY-MM-DD"T"HH24:MI'), TO_TIMESTAMP(:arrivalTime,'YYYY-MM-DD"T"HH24:MI'), :flightStatus)
        `;
        const binds = {
            flightNumber, airlineId, aircraftId, departureAirport, arrivalAirport, departureTime, arrivalTime, flightStatus
        };
        const result = await connection.execute(sql, binds, { autoCommit: true });
        res.json({ message: 'Flight added successfully', rowsAffected: result.rowsAffected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// PUT /api/flights/:id/status
router.put('/:id/status', async (req, res) => {
    let connection;
    try {
        const { status } = req.body;
        const id = req.params.id;
        connection = await db.getConnection();
        const sql = `
            UPDATE Flight SET Flight_Status = :status WHERE Flight_ID = :id
        `;
        const result = await connection.execute(sql, { status, id }, { autoCommit: true });
        res.json({ message: 'Flight status updated successfully', rowsAffected: result.rowsAffected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/flights/airlines/all (Using a separate route logic to avoid conflict)
router.get('/airlines/all', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `SELECT * FROM Airline ORDER BY Airline_Name`;
        const result = await connection.execute(sql);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/flights/aircraft/all
router.get('/aircraft/all', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `SELECT * FROM Aircraft ORDER BY Aircraft_Model`;
        const result = await connection.execute(sql);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// DELETE /api/flights/:id
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        connection = await db.getConnection();
        
        // Disable autoCommit for transaction
        await connection.execute(`BEGIN NULL; END;`, [], { autoCommit: false });
        
        // 1. Delete Boarding Passes for this flight
        await connection.execute(`DELETE FROM Boarding_Pass WHERE Flight_ID = :id`, { id });
        
        // 2. Delete Flight
        const result = await connection.execute(`DELETE FROM Flight WHERE Flight_ID = :id`, { id });
        
        await connection.commit();
        
        if (result.rowsAffected > 0) {
            res.json({ message: 'Flight deleted completely' });
        } else {
            res.status(404).json({ error: 'Flight not found' });
        }
    } catch (err) {
        console.error(err);
        if (connection) {
            try { await connection.rollback(); } catch(rollErr) { console.error(rollErr); }
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;
