const db = require('./server/db');

async function seedMoreData() {
    let connection;
    try {
        connection = await db.getConnection();
        console.log("Connected. Seeding Airlines, Aircraft, and Gates...");

        // Insert Airlines
        const airlines = [
            { name: 'Emirates', code: 'EK' },
            { name: 'Delta Airlines', code: 'DL' },
            { name: 'Singapore Airlines', code: 'SQ' }
        ];
        for (const a of airlines) {
            try {
                await connection.execute(`
                    INSERT INTO Airline (Airline_Name, Airline_Code)
                    SELECT :aName, :aCode FROM dual
                    WHERE NOT EXISTS (SELECT 1 FROM Airline WHERE Airline_Name = :aName)
                `, { aName: a.name, aCode: a.code }, { autoCommit: true });
            } catch (e) { console.error(e.message); }
        }

        // Fetch Airline IDs to insert corresponding Aircraft
        const resAirlines = await connection.execute(`SELECT Airline_ID, Airline_Name FROM Airline`);
        const airlineMap = {};
        resAirlines.rows.forEach(r => airlineMap[r.AIRLINE_NAME] = r.AIRLINE_ID);

        // Insert Aircraft
        const aircrafts = [
            { model: 'Airbus A380', al: 'Emirates', cap: 515, yr: 2015 },
            { model: 'Airbus A321', al: 'Delta Airlines', cap: 191, yr: 2018 },
            { model: 'Boeing 777', al: 'Singapore Airlines', cap: 264, yr: 2019 }
        ];
        for (const ac of aircrafts) {
            if (airlineMap[ac.al]) {
                try {
                    await connection.execute(`
                        INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status)
                        SELECT :alId, :model, :cap, :yr, 'Active' FROM dual
                        WHERE NOT EXISTS (SELECT 1 FROM Aircraft WHERE Airline_ID = :alId AND Aircraft_Model = :model)
                    `, { alId: airlineMap[ac.al], model: ac.model, cap: ac.cap, yr: ac.yr }, { autoCommit: true });
                } catch (e) { console.error(e.message); }
            }
        }

        // Insert Gates
        const gates = [
            { term: 'Terminal 1', num: 'A1', status: 'Available' },
            { term: 'Terminal 1', num: 'A2', status: 'Available' },
            { term: 'Terminal 2', num: 'B1', status: 'Available' }
        ];
        for (const g of gates) {
            try {
                await connection.execute(`
                    INSERT INTO Gate (Terminal, Gate_Number, Gate_Status)
                    SELECT :term, :num, :status FROM dual
                    WHERE NOT EXISTS (SELECT 1 FROM Gate WHERE Terminal = :term AND Gate_Number = :num)
                `, { term: g.term, num: g.num, status: g.status }, { autoCommit: true });
            } catch (e) { console.error(e.message); }
        }

        // Fetch an Aircraft ID and Airline ID to insert a dummy flight
        const resAc = await connection.execute(`SELECT Aircraft_ID, Airline_ID FROM Aircraft FETCH FIRST 1 ROWS ONLY`);
        if(resAc.rows.length > 0) {
            const acId = resAc.rows[0].AIRCRAFT_ID;
            const alId = resAc.rows[0].AIRLINE_ID;
            
            try {
                await connection.execute(`
                    INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status)
                    SELECT 'EK202', :alId, :acId, 'DXB', 'JFK', SYSTIMESTAMP + INTERVAL '2' HOUR, SYSTIMESTAMP + INTERVAL '16' HOUR, 'On Time' FROM dual
                    WHERE NOT EXISTS (SELECT 1 FROM Flight WHERE Flight_Number = 'EK202')
                `, { alId: alId, acId: acId }, { autoCommit: true });
            } catch(e) { console.error(e.message); }
        }

        console.log("Seeding complete! Airlines, Aircraft, Gates, and Flight populated.");

    } catch (err) {
        console.error("Database error during seeding:", err);
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) {}
        }
        process.exit(0);
    }
}

seedMoreData();
