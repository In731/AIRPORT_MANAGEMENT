const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config();

// Initialize Oracle Thick Client to support FreeSQL Native Network Encryption
try {
    const clientPath = path.join(__dirname, '..', 'oracle_client', 'instantclient_19_22');
    oracledb.initOracleClient({ libDir: clientPath });
    console.log("Oracle Thick Client initialized successfully.");
} catch (err) {
    console.error("Failed to initialize Oracle Thick Client:", err.message);
}

/*
------------------------------------------------------------
-- ALL ORACLE SQL CREATE TABLE STATEMENTS
------------------------------------------------------------

-- TABLE 1: AIRLINE
CREATE TABLE Airline (
    Airline_ID       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Airline_Name     VARCHAR2(100) NOT NULL,
    Airline_Code     VARCHAR2(10)  NOT NULL,
    Country          VARCHAR2(100),
    Contact_Number   VARCHAR2(20)
);

-- TABLE 2: AIRCRAFT
CREATE TABLE Aircraft (
    Aircraft_ID        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Airline_ID         NUMBER NOT NULL,
    Aircraft_Model     VARCHAR2(100),
    Capacity           NUMBER,
    Manufacturing_Year NUMBER(4),
    Maintenance_Status VARCHAR2(50)
        CHECK (Maintenance_Status IN ('Active','Under Maintenance','Retired')),
    CONSTRAINT fk_aircraft_airline
        FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_ID)
);

-- TABLE 3: GATE
CREATE TABLE Gate (
    Gate_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Gate_Number VARCHAR2(10) NOT NULL,
    Terminal    VARCHAR2(20),
    Gate_Status VARCHAR2(20)
        CHECK (Gate_Status IN ('Available','Occupied'))
);

-- TABLE 4: RUNWAY
CREATE TABLE Runway (
    Runway_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Runway_Number VARCHAR2(10) NOT NULL,
    Length        NUMBER,
    Surface_Type  VARCHAR2(50),
    Runway_Status VARCHAR2(30)
        CHECK (Runway_Status IN ('Active','Closed','Under Maintenance'))
);

-- TABLE 5: FLIGHT
CREATE TABLE Flight (
    Flight_ID         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Flight_Number     VARCHAR2(20) UNIQUE NOT NULL,
    Airline_ID        NUMBER NOT NULL,
    Aircraft_ID       NUMBER NOT NULL,
    Departure_Airport VARCHAR2(100),
    Arrival_Airport   VARCHAR2(100),
    Departure_Time    TIMESTAMP,
    Arrival_Time      TIMESTAMP,
    Flight_Status     VARCHAR2(20)
        CHECK (Flight_Status IN ('On Time','Delayed','Cancelled')),
    CONSTRAINT fk_flight_airline
        FOREIGN KEY (Airline_ID)  REFERENCES Airline(Airline_ID),
    CONSTRAINT fk_flight_aircraft
        FOREIGN KEY (Aircraft_ID) REFERENCES Aircraft(Aircraft_ID)
);

-- TABLE 6: PASSENGER
CREATE TABLE Passenger (
    Passenger_ID  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    First_Name    VARCHAR2(50)  NOT NULL,
    Last_Name     VARCHAR2(50)  NOT NULL,
    Gender        VARCHAR2(10)
        CHECK (Gender IN ('Male','Female','Other')),
    Date_of_Birth DATE,
    Phone_Number  VARCHAR2(20),
    Email         VARCHAR2(100),
    Nationality   VARCHAR2(50)
);

-- TABLE 7: PASSPORT
CREATE TABLE Passport (
    Passport_Number  VARCHAR2(20) PRIMARY KEY,
    Passenger_ID     NUMBER       UNIQUE NOT NULL,
    Country_of_Issue VARCHAR2(50),
    Issue_Date       DATE,
    Expiry_Date      DATE,
    Passport_Type    VARCHAR2(30)
        CHECK (Passport_Type IN ('Regular','Diplomatic','Official','Emergency')),
    CONSTRAINT fk_passport_passenger
        FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_ID)
);

-- TABLE 8: IMMIGRATION_RECORD
CREATE TABLE Immigration_Record (
    Immigration_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Passenger_ID       NUMBER       NOT NULL,
    Passport_Number    VARCHAR2(20) NOT NULL,
    Movement_Type      VARCHAR2(10)
        CHECK (Movement_Type IN ('Entry','Exit')),
    From_Country       VARCHAR2(50),
    To_Country         VARCHAR2(50),
    Immigration_Status VARCHAR2(20)
        CHECK (Immigration_Status IN ('Cleared','Pending','Rejected')),
    Entry_Date         DATE,
    CONSTRAINT fk_immig_passenger
        FOREIGN KEY (Passenger_ID)   REFERENCES Passenger(Passenger_ID),
    CONSTRAINT fk_immig_passport
        FOREIGN KEY (Passport_Number) REFERENCES Passport(Passport_Number)
);

-- TABLE 9: BOARDING_PASS
CREATE TABLE Boarding_Pass (
    BoardingPass_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Passenger_ID    NUMBER       NOT NULL,
    Flight_ID       NUMBER       NOT NULL,
    Gate_ID         NUMBER       NOT NULL,
    Seat_Number     VARCHAR2(10),
    Boarding_Time   TIMESTAMP,
    Boarding_Group  VARCHAR2(10),
    CONSTRAINT fk_bp_passenger
        FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_ID),
    CONSTRAINT fk_bp_flight
        FOREIGN KEY (Flight_ID)    REFERENCES Flight(Flight_ID),
    CONSTRAINT fk_bp_gate
        FOREIGN KEY (Gate_ID)      REFERENCES Gate(Gate_ID)
);

-- TABLE 10: SHIFT
CREATE TABLE Shift (
    Shift_ID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Shift_Name VARCHAR2(20)
        CHECK (Shift_Name IN ('Morning','Evening','Night')),
    Start_Time VARCHAR2(10),
    End_Time   VARCHAR2(10)
);

-- TABLE 11: GROUND_SERVICE_TEAM
CREATE TABLE Ground_Service_Team (
    Team_ID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Team_Name VARCHAR2(100),
    Team_Lead VARCHAR2(100)
);

-- TABLE 12: AIRPORT_STAFF
CREATE TABLE Airport_Staff (
    Staff_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    First_Name   VARCHAR2(50) NOT NULL,
    Last_Name    VARCHAR2(50) NOT NULL,
    Department   VARCHAR2(50),
    Role         VARCHAR2(50),
    Phone_Number VARCHAR2(20),
    Email        VARCHAR2(100),
    Salary       NUMBER(10,2),
    Shift_ID     NUMBER,
    Team_ID      NUMBER,
    CONSTRAINT fk_staff_shift
        FOREIGN KEY (Shift_ID) REFERENCES Shift(Shift_ID),
    CONSTRAINT fk_staff_team
        FOREIGN KEY (Team_ID)  REFERENCES Ground_Service_Team(Team_ID)
);

-- TABLE 13: DEPARTMENT
CREATE TABLE Department (
    Department_ID      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Department_Name    VARCHAR2(100) NOT NULL,
    Department_Head_ID NUMBER,
    CONSTRAINT fk_dept_head
        FOREIGN KEY (Department_Head_ID) REFERENCES Airport_Staff(Staff_ID)
);

-- TABLE 14: STAFF_ASSIGNMENT
CREATE TABLE Staff_Assignment (
    Assignment_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Staff_ID          NUMBER       NOT NULL,
    Task_Type         VARCHAR2(50)
        CHECK (Task_Type IN ('Gate Duty','Fueling','Baggage','Immigration')),
    Assigned_Location VARCHAR2(100),
    Assignment_Start  TIMESTAMP,
    Assignment_End    TIMESTAMP,
    CONSTRAINT fk_assign_staff
        FOREIGN KEY (Staff_ID) REFERENCES Airport_Staff(Staff_ID)
);

-- TABLE 15: ATTENDANCE
CREATE TABLE Attendance (
    Attendance_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Staff_ID          NUMBER       NOT NULL,
    Attend_Date       DATE,
    Check_In_Time     TIMESTAMP,
    Check_Out_Time    TIMESTAMP,
    Attendance_Status VARCHAR2(20)
        CHECK (Attendance_Status IN ('Present','Absent','Late')),
    CONSTRAINT fk_attend_staff
        FOREIGN KEY (Staff_ID) REFERENCES Airport_Staff(Staff_ID)
);

*/

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

async function getConnection() {
    return await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTION_STRING
    });
}

module.exports = {
    getConnection
};
