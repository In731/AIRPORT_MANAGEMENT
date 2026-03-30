------------------------------------------------------------
-- AIRPORT MANAGEMENT SYSTEM: COMPREHENSIVE DUMMY DATA SEED
-- FIXED FOREIGN KEY RESOLUTION USING SUBQUERIES
------------------------------------------------------------

-- 1. SHIFT
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Morning', '06:00', '14:00');
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Evening', '14:00', '22:00');
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Night', '22:00', '06:00');
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Morning', '05:00', '13:00');
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Evening', '15:00', '23:00');
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Night', '21:00', '05:00');
INSERT INTO Shift (Shift_Name, Start_Time, End_Time) VALUES ('Morning', '07:00', '15:00');

-- 2. GROUND_SERVICE_TEAM
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Baggage Logic Alpha', 'John Doe');
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Security Unit 7', 'Sarah Connor');
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Maintenance Crew B', 'Mike Ross');
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Catering Support', 'Rachel Zane');
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Gate Management Delta', 'Harvey Specter');
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Fueling Ops', 'Louis Litt');
INSERT INTO Ground_Service_Team (Team_Name, Team_Lead) VALUES ('Emergency Response', 'Donna Paulsen');

-- 3. AIRLINE
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('Emirates', 'EK', 'UAE', '+971-4-123456');
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('Delta Airlines', 'DL', 'USA', '+1-800-DELTA');
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('Singapore Airlines', 'SQ', 'Singapore', '+65-6223-8888');
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('Air India', 'AI', 'India', '+91-11-23456789');
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('British Airways', 'BA', 'UK', '+44-20-1234-5678');
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('Lufthansa', 'LH', 'Germany', '+49-69-123456');
INSERT INTO Airline (Airline_Name, Airline_Code, Country, Contact_Number) VALUES ('Qatar Airways', 'QR', 'Qatar', '+974-4449-6000');

-- 4. AIRCRAFT (Dynamic resolution by Airline_Code)
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'EK' FETCH FIRST 1 ROW ONLY), 'Airbus A380', 525, 2018, 'Active');
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'DL' FETCH FIRST 1 ROW ONLY), 'Boeing 737-800', 160, 2015, 'Active');
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'SQ' FETCH FIRST 1 ROW ONLY), 'Airbus A350', 300, 2020, 'Under Maintenance');
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'AI' FETCH FIRST 1 ROW ONLY), 'Boeing 787 Dreamliner', 250, 2019, 'Active');
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'BA' FETCH FIRST 1 ROW ONLY), 'Airbus A320neo', 180, 2021, 'Active');
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'LH' FETCH FIRST 1 ROW ONLY), 'Boeing 777-300ER', 350, 2017, 'Active');
INSERT INTO Aircraft (Airline_ID, Aircraft_Model, Capacity, Manufacturing_Year, Maintenance_Status) 
VALUES ((SELECT Airline_ID FROM Airline WHERE Airline_Code = 'QR' FETCH FIRST 1 ROW ONLY), 'Airbus A321', 200, 2016, 'Retired');

-- 5. GATE
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('A1', 'Terminal 1', 'Available');
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('A2', 'Terminal 1', 'Occupied');
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('B1', 'Terminal 2', 'Available');
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('B2', 'Terminal 2', 'Available');
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('C1', 'Terminal 3', 'Occupied');
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('C2', 'Terminal 3', 'Available');
INSERT INTO Gate (Gate_Number, Terminal, Gate_Status) VALUES ('D1', 'Terminal 4', 'Available');

-- 6. RUNWAY
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('09L', 3000, 'Asphalt', 'Active');
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('09R', 3200, 'Concrete', 'Active');
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('27L', 2800, 'Asphalt', 'Closed');
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('27R', 3500, 'Concrete', 'Under Maintenance');
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('18', 2500, 'Asphalt', 'Active');
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('36', 2500, 'Asphalt', 'Active');
INSERT INTO Runway (Runway_Number, Length, Surface_Type, Runway_Status) VALUES ('01L', 4000, 'Concrete', 'Active');

-- 7. FLIGHT (Dynamic resolution by Airline_Code and Aircraft_Model)
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('EK202', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'EK' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Airbus A380' FETCH FIRST 1 ROW ONLY), 'DXB', 'JFK', TO_TIMESTAMP('2024-05-10 08:30:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-10 20:45:00', 'YYYY-MM-DD HH24:MI:SS'), 'On Time');
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('DL101', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'DL' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Boeing 737-800' FETCH FIRST 1 ROW ONLY), 'ATL', 'LHR', TO_TIMESTAMP('2024-05-10 10:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-10 22:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'Delayed');
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('SQ308', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'SQ' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Airbus A350' FETCH FIRST 1 ROW ONLY), 'SIN', 'SYD', TO_TIMESTAMP('2024-05-11 01:15:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-11 11:50:00', 'YYYY-MM-DD HH24:MI:SS'), 'On Time');
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('AI444', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'AI' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Boeing 787 Dreamliner' FETCH FIRST 1 ROW ONLY), 'DEL', 'BOM', TO_TIMESTAMP('2024-05-11 07:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-11 09:15:00', 'YYYY-MM-DD HH24:MI:SS'), 'On Time');
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('BA175', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'BA' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Airbus A320neo' FETCH FIRST 1 ROW ONLY), 'LHR', 'EWR', TO_TIMESTAMP('2024-05-11 14:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-11 17:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'Cancelled');
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('LH400', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'LH' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Boeing 777-300ER' FETCH FIRST 1 ROW ONLY), 'FRA', 'JFK', TO_TIMESTAMP('2024-05-11 11:30:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-11 23:55:00', 'YYYY-MM-DD HH24:MI:SS'), 'On Time');
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Departure_Airport, Arrival_Airport, Departure_Time, Arrival_Time, Flight_Status) 
VALUES ('QR701', (SELECT Airline_ID FROM Airline WHERE Airline_Code = 'QR' FETCH FIRST 1 ROW ONLY), (SELECT Aircraft_ID FROM Aircraft WHERE Aircraft_Model = 'Airbus A321' FETCH FIRST 1 ROW ONLY), 'DOH', 'JFK', TO_TIMESTAMP('2024-05-12 02:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2024-05-12 14:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'On Time');

-- 8. PASSENGER
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Arjun', 'Mehta', 'Male', TO_DATE('1990-05-15', 'YYYY-MM-DD'), '9876543210', 'arjun@example.com', 'Indian');
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Emma', 'Watson', 'Female', TO_DATE('1992-04-15', 'YYYY-MM-DD'), '1234567890', 'emma@example.com', 'British');
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Robert', 'Downey', 'Male', TO_DATE('1965-04-04', 'YYYY-MM-DD'), '5550123456', 'tony@stark.com', 'American');
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Priya', 'Sharma', 'Female', TO_DATE('1995-12-10', 'YYYY-MM-DD'), '9988776655', 'priya@example.com', 'Indian');
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Hans', 'Muller', 'Male', TO_DATE('1985-07-22', 'YYYY-MM-DD'), '4915123456', 'hans@gmail.de', 'German');
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Yuki', 'Tanaka', 'Other', TO_DATE('1998-11-20', 'YYYY-MM-DD'), '8190123456', 'yuki@jpmail.jp', 'Japanese');
INSERT INTO Passenger (First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Email, Nationality) VALUES ('Elena', 'Sofia', 'Female', TO_DATE('1993-01-30', 'YYYY-MM-DD'), '3461234567', 'elena@esp.es', 'Spanish');

-- 9. PASSPORT (Dynamic resolution by Passenger Email)
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('L1234567', (SELECT Passenger_ID FROM Passenger WHERE Email = 'arjun@example.com' FETCH FIRST 1 ROW ONLY), 'India', TO_DATE('2015-05-15', 'YYYY-MM-DD'), TO_DATE('2025-05-14', 'YYYY-MM-DD'), 'Regular');
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('UK998877', (SELECT Passenger_ID FROM Passenger WHERE Email = 'emma@example.com' FETCH FIRST 1 ROW ONLY), 'UK', TO_DATE('2018-04-15', 'YYYY-MM-DD'), TO_DATE('2028-04-14', 'YYYY-MM-DD'), 'Regular');
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('US555012', (SELECT Passenger_ID FROM Passenger WHERE Email = 'tony@stark.com' FETCH FIRST 1 ROW ONLY), 'USA', TO_DATE('2010-01-01', 'YYYY-MM-DD'), TO_DATE('2024-12-31', 'YYYY-MM-DD'), 'Diplomatic');
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('L5566778', (SELECT Passenger_ID FROM Passenger WHERE Email = 'priya@example.com' FETCH FIRST 1 ROW ONLY), 'India', TO_DATE('2020-10-10', 'YYYY-MM-DD'), TO_DATE('2030-10-09', 'YYYY-MM-DD'), 'Regular');
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('DE123456', (SELECT Passenger_ID FROM Passenger WHERE Email = 'hans@gmail.de' FETCH FIRST 1 ROW ONLY), 'Germany', TO_DATE('2016-07-20', 'YYYY-MM-DD'), TO_DATE('2026-07-19', 'YYYY-MM-DD'), 'Official');
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('JP901234', (SELECT Passenger_ID FROM Passenger WHERE Email = 'yuki@jpmail.jp' FETCH FIRST 1 ROW ONLY), 'Japan', TO_DATE('2019-11-15', 'YYYY-MM-DD'), TO_DATE('2029-11-14', 'YYYY-MM-DD'), 'Regular');
INSERT INTO Passport (Passport_Number, Passenger_ID, Country_of_Issue, Issue_Date, Expiry_Date, Passport_Type) 
VALUES ('ES346123', (SELECT Passenger_ID FROM Passenger WHERE Email = 'elena@esp.es' FETCH FIRST 1 ROW ONLY), 'Spain', TO_DATE('2014-01-20', 'YYYY-MM-DD'), TO_DATE('2025-01-19', 'YYYY-MM-DD'), 'Regular');

-- 10. IMMIGRATION_RECORD (Dynamic resolution by Passenger Email)
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'arjun@example.com' FETCH FIRST 1 ROW ONLY), 'L1234567', 'Entry', 'India', 'UAE', 'Cleared', TO_DATE('2024-05-10', 'YYYY-MM-DD'));
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'emma@example.com' FETCH FIRST 1 ROW ONLY), 'UK998877', 'Entry', 'UK', 'USA', 'Cleared', TO_DATE('2024-05-10', 'YYYY-MM-DD'));
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'tony@stark.com' FETCH FIRST 1 ROW ONLY), 'US555012', 'Exit', 'USA', 'Spain', 'Cleared', TO_DATE('2024-05-10', 'YYYY-MM-DD'));
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'priya@example.com' FETCH FIRST 1 ROW ONLY), 'L5566778', 'Entry', 'India', 'UK', 'Pending', TO_DATE('2024-05-11', 'YYYY-MM-DD'));
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'hans@gmail.de' FETCH FIRST 1 ROW ONLY), 'DE123456', 'Entry', 'Germany', 'Japan', 'Cleared', TO_DATE('2024-05-11', 'YYYY-MM-DD'));
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'yuki@jpmail.jp' FETCH FIRST 1 ROW ONLY), 'JP901234', 'Exit', 'Japan', 'Spain', 'Rejected', TO_DATE('2024-05-11', 'YYYY-MM-DD'));
INSERT INTO Immigration_Record (Passenger_ID, Passport_Number, Movement_Type, From_Country, To_Country, Immigration_Status, Entry_Date) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'elena@esp.es' FETCH FIRST 1 ROW ONLY), 'ES346123', 'Entry', 'Spain', 'Germany', 'Cleared', TO_DATE('2024-05-12', 'YYYY-MM-DD'));

-- 11. AIRPORT_STAFF (Dynamic resolution by Shift_Time and Team_Lead)
INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('James', 'Bond', 'Security', 'Officer', '0070070077', '007@mi6.uk', 85000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '06:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'Sarah Connor' FETCH FIRST 1 ROW ONLY));

INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('Peter', 'Parker', 'Ground Service', 'Porter', '5550010001', 'peter@dailybugle.com', 45000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '14:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'John Doe' FETCH FIRST 1 ROW ONLY));

INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('Tony', 'Stark', 'Engineering', 'Manager', '5559998888', 'ceo@stark.com', 120000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '22:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'Mike Ross' FETCH FIRST 1 ROW ONLY));

INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('Bruce', 'Wayne', 'Operations', 'Lead', '5551112222', 'wayne@enterprise.com', 110000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '05:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'Harvey Specter' FETCH FIRST 1 ROW ONLY));

INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('Clark', 'Kent', 'Terminal Service', 'Desk Agent', '5552223333', 'kent@dailyplanet.com', 50000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '15:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'Rachel Zane' FETCH FIRST 1 ROW ONLY));

INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('Diana', 'Prince', 'Logistics', 'Fueling Spec', '5554445555', 'diana@themyscira.com', 65000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '21:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'Louis Litt' FETCH FIRST 1 ROW ONLY));

INSERT INTO Airport_Staff (First_Name, Last_Name, Department, Role, Phone_Number, Email, Salary, Shift_ID, Team_ID) 
VALUES ('Barry', 'Allen', 'Safety', 'Paramedic', '5556667777', 'barry@star.labs', 75000, 
(SELECT Shift_ID FROM Shift WHERE Start_Time = '07:00' FETCH FIRST 1 ROW ONLY), 
(SELECT Team_ID FROM Ground_Service_Team WHERE Team_Lead = 'Donna Paulsen' FETCH FIRST 1 ROW ONLY));

-- 12. DEPARTMENT (Dynamic resolution by Staff Email)
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Security', (SELECT Staff_ID FROM Airport_Staff WHERE Email = '007@mi6.uk' FETCH FIRST 1 ROW ONLY));
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Ground Service', (SELECT Staff_ID FROM Airport_Staff WHERE Email = 'peter@dailybugle.com' FETCH FIRST 1 ROW ONLY));
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Engineering', (SELECT Staff_ID FROM Airport_Staff WHERE Email = 'ceo@stark.com' FETCH FIRST 1 ROW ONLY));
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Operations', (SELECT Staff_ID FROM Airport_Staff WHERE Email = 'wayne@enterprise.com' FETCH FIRST 1 ROW ONLY));
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Terminal Service', (SELECT Staff_ID FROM Airport_Staff WHERE Email = 'kent@dailyplanet.com' FETCH FIRST 1 ROW ONLY));
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Logistics', (SELECT Staff_ID FROM Airport_Staff WHERE Email = 'diana@themyscira.com' FETCH FIRST 1 ROW ONLY));
INSERT INTO Department (Department_Name, Department_Head_ID) VALUES ('Safety', (SELECT Staff_ID FROM Airport_Staff WHERE Email = 'barry@star.labs' FETCH FIRST 1 ROW ONLY));

-- 13. STAFF_ASSIGNMENT
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = '007@mi6.uk' FETCH FIRST 1 ROW ONLY), 'Immigration', 'Terminal 1 Hall', SYSTIMESTAMP - INTERVAL '1' DAY, SYSTIMESTAMP + INTERVAL '8' HOUR);
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'peter@dailybugle.com' FETCH FIRST 1 ROW ONLY), 'Baggage', 'Belt 4', SYSTIMESTAMP - INTERVAL '2' HOUR, SYSTIMESTAMP + INTERVAL '6' HOUR);
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'ceo@stark.com' FETCH FIRST 1 ROW ONLY), 'Fueling', 'Apron B', SYSTIMESTAMP - INTERVAL '5' HOUR, SYSTIMESTAMP + INTERVAL '4' HOUR);
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'wayne@enterprise.com' FETCH FIRST 1 ROW ONLY), 'Gate Duty', 'Gate A1', SYSTIMESTAMP, SYSTIMESTAMP + INTERVAL '8' HOUR);
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'kent@dailyplanet.com' FETCH FIRST 1 ROW ONLY), 'Gate Duty', 'Gate B2', SYSTIMESTAMP + INTERVAL '2' HOUR, SYSTIMESTAMP + INTERVAL '10' HOUR);
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'diana@themyscira.com' FETCH FIRST 1 ROW ONLY), 'Fueling', 'Apron C', SYSTIMESTAMP - INTERVAL '1' HOUR, SYSTIMESTAMP + INTERVAL '7' HOUR);
INSERT INTO Staff_Assignment (Staff_ID, Task_Type, Assigned_Location, Assignment_Start, Assignment_End) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'barry@star.labs' FETCH FIRST 1 ROW ONLY), 'Gate Duty', 'Check-in Row D', SYSTIMESTAMP - INTERVAL '10' MINUTE, SYSTIMESTAMP + INTERVAL '6' HOUR);

-- 14. ATTENDANCE
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = '007@mi6.uk' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), SYSTIMESTAMP - INTERVAL '1' HOUR, 'Present');
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'peter@dailybugle.com' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), SYSTIMESTAMP - INTERVAL '30' MINUTE, 'Late');
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'ceo@stark.com' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), SYSTIMESTAMP - INTERVAL '4' HOUR, 'Present');
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'wayne@enterprise.com' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), NULL, 'Absent');
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'kent@dailyplanet.com' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), SYSTIMESTAMP - INTERVAL '2' HOUR, 'Present');
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'diana@themyscira.com' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), SYSTIMESTAMP - INTERVAL '5' HOUR, 'Present');
INSERT INTO Attendance (Staff_ID, Attend_Date, Check_In_Time, Attendance_Status) 
VALUES ((SELECT Staff_ID FROM Airport_Staff WHERE Email = 'barry@star.labs' FETCH FIRST 1 ROW ONLY), TRUNC(SYSDATE), SYSTIMESTAMP - INTERVAL '15' MINUTE, 'Present');

-- 15. BOARDING_PASS (Dynamic resolution for Passenger, Flight, Gate)
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'arjun@example.com' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'EK202' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'A1' FETCH FIRST 1 ROW ONLY), '12A', SYSTIMESTAMP + INTERVAL '1' HOUR, 'Zone 1');
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'emma@example.com' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'DL101' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'A2' FETCH FIRST 1 ROW ONLY), '24C', SYSTIMESTAMP + INTERVAL '2' HOUR, 'Zone 2');
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'tony@stark.com' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'SQ308' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'B1' FETCH FIRST 1 ROW ONLY), '01F', SYSTIMESTAMP - INTERVAL '30' MINUTE, 'Business');
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'priya@example.com' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'AI444' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'B2' FETCH FIRST 1 ROW ONLY), '15B', SYSTIMESTAMP + INTERVAL '4' HOUR, 'Zone 3');
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'hans@gmail.de' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'BA175' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'C1' FETCH FIRST 1 ROW ONLY), '33A', SYSTIMESTAMP + INTERVAL '5' HOUR, 'Zone 4');
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'yuki@jpmail.jp' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'LH400' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'C2' FETCH FIRST 1 ROW ONLY), '18D', SYSTIMESTAMP + INTERVAL '3' HOUR, 'Zone 2');
INSERT INTO Boarding_Pass (Passenger_ID, Flight_ID, Gate_ID, Seat_Number, Boarding_Time, Boarding_Group) 
VALUES ((SELECT Passenger_ID FROM Passenger WHERE Email = 'elena@esp.es' FETCH FIRST 1 ROW ONLY), (SELECT Flight_ID FROM Flight WHERE Flight_Number = 'QR701' FETCH FIRST 1 ROW ONLY), (SELECT Gate_ID FROM Gate WHERE Gate_Number = 'D1' FETCH FIRST 1 ROW ONLY), '08E', SYSTIMESTAMP + INTERVAL '6' HOUR, 'Premium');

COMMIT;
