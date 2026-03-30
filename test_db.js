const oracledb = require('oracledb');
require('dotenv').config();

// Try standard port TCP
async function runTest() {
    try {
        const conn1 = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: "badpassword123",
            connectString: process.env.DB_CONNECTION_STRING
        });
        console.log("TCP 1521 WORKED. Version:", oracledb.versionString);
        await conn1.close();
        return;
    } catch(e) {
        console.log("TCP 1521 FAILED:", e.message);
    }
}
runTest();
