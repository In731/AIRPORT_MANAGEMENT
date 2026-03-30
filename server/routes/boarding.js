const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// GET /api/boarding
router.get('/', async (req, res) => {
    let connection;
    try {
        const { terminal, status } = req.query;
        connection = await db.getConnection();
        const sql = `BEGIN Get_Filtered_Boarding(:p_term, :p_status, :cursor); END;`;
        const binds = {
            p_term: terminal || null,
            p_status: status || null,
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

// POST /api/boarding
router.post('/', async (req, res) => {
    let connection;
    try {
        const { passengerId, flightId, gateId, seatNumber, boardingTime, boardingGroup } = req.body;
        connection = await db.getConnection();
        const sql = `
            INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group)
            VALUES (:passengerId, :flightId, :gateId, :seatNumber, TO_TIMESTAMP(:boardingTime,'YYYY-MM-DD"T"HH24:MI'), :boardingGroup)
        `;
        const binds = {
            passengerId, flightId, gateId, seatNumber, boardingTime, boardingGroup
        };
        await connection.execute(sql, binds, { autoCommit: true });
        res.json({ message: 'Boarding pass issued successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/boarding/gates/all
router.get('/gates/all', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT g.Gate_ID as "GATE_ID", g.Gate_Number as "GATE_NUMBER", g.Terminal as "TERMINAL", g.Gate_Status as "GATE_STATUS",
                   COUNT(bp.BoardingPass_ID) AS "PASSENGER_COUNT"
            FROM Gate g
            LEFT JOIN Boarding_Pass bp ON g.Gate_ID = bp.Gate_ID
            GROUP BY g.Gate_ID, g.Gate_Number, g.Terminal, g.Gate_Status
            ORDER BY g.Terminal, g.Gate_Number
        `;
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

// PUT /api/boarding/gates/:id/status
router.put('/gates/:id/status', async (req, res) => {
    let connection;
    try {
        const { status } = req.body;
        const id = req.params.id;
        connection = await db.getConnection();
        const sql = `
            UPDATE Gate SET Gate_Status = :status WHERE Gate_ID = :id
        `;
        await connection.execute(sql, { status, id }, { autoCommit: true });
        res.json({ message: 'Gate status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// DELETE /api/boarding/:id
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        connection = await db.getConnection();
        const sql = `
            DELETE FROM Boarding_Pass WHERE BoardingPass_ID = :id
        `;
        const result = await connection.execute(sql, { id }, { autoCommit: true });
        
        if (result.rowsAffected > 0) {
            res.json({ message: 'Boarding pass deleted successfully' });
        } else {
            res.status(404).json({ error: 'Boarding pass not found' });
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

module.exports = router;
