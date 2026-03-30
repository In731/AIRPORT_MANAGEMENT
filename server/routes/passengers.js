const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// GET /api/passengers
router.get('/', async (req, res) => {
    let connection;
    try {
        const { type, status, pass_status, nationality } = req.query;
        connection = await db.getConnection();
        const sql = `BEGIN Get_Filtered_Passengers(:p_type, :p_status, :p_pass_status, :p_nationality, :cursor); END;`;
        const binds = {
            p_type: type || null,
            p_status: status || null,
            p_pass_status: pass_status || null,
            p_nationality: nationality || null,
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

// GET /api/passengers/:id
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT p.Passenger_ID as "PASSENGER_ID",
                   p.First_Name as "FIRST_NAME", p.Last_Name as "LAST_NAME",
                   p.First_Name || ' ' || p.Last_Name AS "FULL_NAME",
                   p.Gender as "GENDER", p.Date_of_Birth as "DATE_OF_BIRTH", p.Nationality as "NATIONALITY",
                   p.Phone_Number as "PHONE_NUMBER", p.Email as "EMAIL",
                   pp.Passport_Number as "PASSPORT_NUMBER", pp.Country_of_Issue as "COUNTRY_OF_ISSUE",
                   pp.Issue_Date as "ISSUE_DATE",
                   pp.Expiry_Date as "EXPIRY_DATE", pp.Passport_Type as "PASSPORT_TYPE",
                   CASE
                     WHEN pp.Expiry_Date < SYSDATE THEN 'Expired'
                     WHEN pp.Expiry_Date < SYSDATE + 180 THEN 'Expiring Soon'
                     ELSE 'Valid'
                   END AS "PASSPORT_STATUS",
                   ir.Immigration_Status as "IMMIGRATION_STATUS", ir.Movement_Type as "MOVEMENT_TYPE",
                   ir.From_Country as "FROM_COUNTRY", ir.To_Country as "TO_COUNTRY", ir.Entry_Date as "ENTRY_DATE"
            FROM Passenger p
            LEFT JOIN Passport pp ON p.Passenger_ID = pp.Passenger_ID
            LEFT JOIN Immigration_Record ir ON p.Passenger_ID = ir.Passenger_ID
            WHERE p.Passenger_ID = :id
            ORDER BY p.Last_Name
        `;
        const result = await connection.execute(sql, { id: req.params.id });
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Passenger not found' });
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

// POST /api/passengers
router.post('/', async (req, res) => {
    let connection;
    try {
        const { firstName, lastName, gender, dob, phone, email, nationality, passportNumber, countryOfIssue, issueDate, expiryDate, passportType } = req.body;
        connection = await db.getConnection();
        
        // Disable autoCommit for transaction
        const oldAutoCommit = connection.autoCommit;
        
        const sql1 = `
            INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality)
            VALUES (:firstName, :lastName, :gender, TO_DATE(:dob,'YYYY-MM-DD'), :phone, :email, :nationality)
            RETURNING Passenger_ID INTO :newId
        `;
        const binds1 = {
            firstName, lastName, gender, dob, phone, email, nationality,
            newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };
        const result1 = await connection.execute(sql1, binds1, { autoCommit: false });
        const newPassengerId = result1.outBinds.newId[0];

        const sql2 = `
            INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type)
            VALUES (:passportNumber, :newPassengerId, :countryOfIssue, TO_DATE(:issueDate,'YYYY-MM-DD'), TO_DATE(:expiryDate,'YYYY-MM-DD'), :passportType)
        `;
        const binds2 = {
            passportNumber, newPassengerId, countryOfIssue, issueDate, expiryDate, passportType
        };
        await connection.execute(sql2, binds2, { autoCommit: false });
        
        await connection.commit();
        res.json({ message: 'Passenger added successfully', passengerId: newPassengerId });
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

// POST /api/passengers/immigration
router.post('/immigration', async (req, res) => {
    let connection;
    try {
        const { passengerId, passportNumber, movementType, fromCountry, toCountry, immigrationStatus, entryDate } = req.body;
        connection = await db.getConnection();
        const sql = `
            INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date)
            VALUES (:passengerId, :passportNumber, :movementType, :fromCountry, :toCountry, :immigrationStatus, TO_DATE(:entryDate,'YYYY-MM-DD'))
        `;
        const binds = {
            passengerId, passportNumber, movementType, fromCountry, toCountry, immigrationStatus, entryDate
        };
        await connection.execute(sql, binds, { autoCommit: true });
        res.json({ message: 'Immigration record added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// DELETE /api/passengers/:id
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        connection = await db.getConnection();
        
        // Disable autoCommit for transaction
        await connection.execute(`BEGIN NULL; END;`, [], { autoCommit: false });
        
        // 1. Delete Boarding Passes
        await connection.execute(`DELETE FROM Boarding_Pass WHERE Passenger_ID = :id`, { id });
        
        // 2. Delete Immigration Records
        await connection.execute(`DELETE FROM Immigration_Record WHERE Passenger_ID = :id`, { id });
        
        // 3. Delete Passport
        await connection.execute(`DELETE FROM Passport WHERE Passenger_ID = :id`, { id });
        
        // 4. Delete Passenger
        const result = await connection.execute(`DELETE FROM Passenger WHERE Passenger_ID = :id`, { id });
        
        await connection.commit();
        
        if (result.rowsAffected > 0) {
            res.json({ message: 'Passenger deleted completely' });
        } else {
            res.status(404).json({ error: 'Passenger not found' });
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

// GET /api/passengers/nationalities/all
router.get('/nationalities/all', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `SELECT DISTINCT Nationality FROM Passenger WHERE Nationality IS NOT NULL ORDER BY Nationality`;
        const result = await connection.execute(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
    }
});

module.exports = router;
