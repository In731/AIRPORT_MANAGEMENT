const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// GET /api/staff
router.get('/', async (req, res) => {
    let connection;
    try {
        let { dept, shift, attendance, salary_op, salary_val } = req.query;
        if (!salary_val) salary_val = null;
        else salary_val = Number(salary_val);

        connection = await db.getConnection();
        const sql = `BEGIN Get_Filtered_Staff(:p_dept, :p_shift, :p_attendance, :p_salary_op, :p_salary_val, :cursor); END;`;
        const binds = {
            p_dept: dept || null,
            p_shift: shift || null,
            p_attendance: attendance || null,
            p_salary_op: salary_op || null,
            p_salary_val: salary_val,
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

// GET /api/staff/:id
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT s.Staff_ID as "STAFF_ID",
                   s.First_Name || ' ' || s.Last_Name AS "FULL_NAME",
                   s.Department as "DEPARTMENT", s.Role as "ROLE", s.Phone_Number as "PHONE_NUMBER", 
                   s.Email as "EMAIL", s.Salary as "SALARY",
                   sh.Shift_Name as "SHIFT_NAME", sh.Start_Time as "START_TIME", sh.End_Time as "END_TIME",
                   gt.Team_Name as "TEAM_NAME"
            FROM Airport_Staff s
            LEFT JOIN Shift sh ON s.Shift_ID = sh.Shift_ID
            LEFT JOIN Ground_Service_Team gt ON s.Team_ID = gt.Team_ID
            WHERE s.Staff_ID = :id
            ORDER BY s.Department, s.Last_Name
        `;
        const result = await connection.execute(sql, { id: req.params.id });
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Staff member not found' });
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

// POST /api/staff
router.post('/', async (req, res) => {
    let connection;
    try {
        const { firstName, lastName, department, role, phone, email, salary, shiftId, teamId } = req.body;
        connection = await db.getConnection();
        const sql = `
            INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID)
            VALUES (:firstName, :lastName, :department, :role, :phone, :email, :salary, :shiftId, :teamId)
            RETURNING Staff_ID INTO :newId
        `;
        const binds = {
            firstName, lastName, department, role, phone, email, salary, shiftId, teamId: teamId || null,
            newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };
        const result = await connection.execute(sql, binds, { autoCommit: true });
        res.json({ message: 'Staff member added successfully', staffId: result.outBinds.newId[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/staff/shifts/all
router.get('/shifts/all', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `SELECT * FROM Shift ORDER BY Shift_ID`;
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

// GET /api/staff/teams/all
router.get('/teams/all', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `SELECT * FROM Ground_Service_Team ORDER BY Team_Name`;
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

// POST /api/staff/attendance
router.post('/attendance', async (req, res) => {
    let connection;
    try {
        const { staffId, status } = req.body; // status: Present, Absent, Late
        connection = await db.getConnection();
        
        // Check if record exists for Staff_ID + today's date
        const checkSql = `
            SELECT Attendance_ID as "ATTENDANCE_ID" FROM Attendance 
            WHERE Staff_ID = :staffId AND Attend_Date = TRUNC(SYSDATE)
        `;
        const checkResult = await connection.execute(checkSql, { staffId });

        if (checkResult.rows.length === 0) {
            // INSERT with Check_In_Time = SYSTIMESTAMP
            const sql = `
                INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status)
                VALUES (:staffId, TRUNC(SYSDATE), SYSTIMESTAMP, :status)
            `;
            await connection.execute(sql, { staffId, status }, { autoCommit: true });
        } else {
            // UPDATE Attendance_Status + Check_In_Time
            const sql = `
                UPDATE Attendance 
                SET Attendance_Status = :status, Check_In_Time = SYSTIMESTAMP
                WHERE Staff_ID = :staffId AND Attend_Date = TRUNC(SYSDATE)
            `;
            await connection.execute(sql, { staffId, status }, { autoCommit: true });
        }

        res.json({ message: 'Attendance recorded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/staff/attendance/today
router.get('/attendance/today', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT Attendance_Status as "ATTENDANCE_STATUS", COUNT(*) AS "TOTAL"
            FROM Attendance
            WHERE Attend_Date = TRUNC(SYSDATE)
            GROUP BY Attendance_Status
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

// POST /api/staff/assignments
router.post('/assignments', async (req, res) => {
    let connection;
    try {
        const { staffId, taskType, assignedLocation, assignmentStart, assignmentEnd } = req.body;
        connection = await db.getConnection();
        const sql = `
            INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End)
            VALUES (:staffId, :taskType, :assignedLocation, TO_TIMESTAMP(:assignmentStart,'YYYY-MM-DD"T"HH24:MI'), TO_TIMESTAMP(:assignmentEnd,'YYYY-MM-DD"T"HH24:MI'))
        `;
        const binds = {
            staffId, taskType, assignedLocation, assignmentStart, assignmentEnd
        };
        await connection.execute(sql, binds, { autoCommit: true });
        res.json({ message: 'Assignment created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

// GET /api/staff/assignments/active
router.get('/assignments/active', async (req, res) => {
    let connection;
    try {
        const staffIdStr = req.query.staffId;
        connection = await db.getConnection();
        let sql = `
            SELECT sa.Assignment_ID as "ASSIGNMENT_ID", sa.Task_Type as "TASK_TYPE", sa.Assigned_Location as "ASSIGNED_LOCATION",
                   sa.Assignment_Start as "ASSIGNMENT_START", sa.Assignment_End as "ASSIGNMENT_END",
                   s.First_Name || ' ' || s.Last_Name AS "STAFF_NAME", s.Staff_ID as "STAFF_ID"
            FROM Staff_Assignment sa
            JOIN Airport_Staff s ON sa.Staff_ID = s.Staff_ID
            WHERE SYSTIMESTAMP BETWEEN sa.Assignment_Start AND sa.Assignment_End
        `;
        let binds = {};
        if (staffIdStr) {
            sql += ` AND sa.Staff_ID = :staffId`;
            binds.staffId = staffIdStr;
        }

        const result = await connection.execute(sql, binds);
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

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        connection = await db.getConnection();
        
        // 1. Delete Attendance details
        await connection.execute(`DELETE FROM Attendance WHERE Staff_ID = :id`, { id }, { autoCommit: true });
        
        // 2. Delete Staff_Assignment details
        await connection.execute(`DELETE FROM Staff_Assignment WHERE Staff_ID = :id`, { id }, { autoCommit: true });
        
        // 3. Update Department Head if applicable
        await connection.execute(`UPDATE Department SET Department_Head_ID = NULL WHERE Department_Head_ID = :id`, { id }, { autoCommit: true });
        
        // 4. Delete the Staff member
        const result = await connection.execute(`DELETE FROM Airport_Staff WHERE Staff_ID = :id`, { id }, { autoCommit: true });
        
        if (result.rowsAffected > 0) {
            res.json({ message: 'Staff member deleted completely' });
        } else {
            res.status(404).json({ error: 'Staff member not found' });
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
