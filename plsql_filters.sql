--------------------------------------------------------------------------------
-- PL/SQL Filtering Procedures for Airport Management System
-- Run this block in your FreeSQL / SQL*Plus / SQL Developer environment
--------------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE Get_Filtered_Flights (
    p_status   IN VARCHAR2,
    p_airline  IN VARCHAR2,
    p_aircraft IN VARCHAR2,
    p_cursor   OUT SYS_REFCURSOR
) 
AS
BEGIN
    OPEN p_cursor FOR
        SELECT f.Flight_ID as "FLIGHT_ID", 
               f.Flight_Number as "FLIGHT_NUMBER", 
               a.Airline_Name as "AIRLINE_NAME", 
               a.Airline_Code as "AIRLINE_CODE",
               ac.Aircraft_Model as "AIRCRAFT_MODEL", 
               ac.Capacity as "CAPACITY", 
               f.Departure_Airport as "DEPARTURE_AIRPORT", 
               f.Arrival_Airport as "ARRIVAL_AIRPORT", 
               f.Departure_Time as "DEPARTURE_TIME", 
               f.Arrival_Time as "ARRIVAL_TIME", 
               f.Flight_Status as "FLIGHT_STATUS",
               COUNT(bp.BoardingPass_ID) AS "PASSENGERS_BOOKED"
        FROM Flight f
        JOIN Airline a ON f.Airline_ID = a.Airline_ID
        JOIN Aircraft ac ON f.Aircraft_ID = ac.Aircraft_ID
        LEFT JOIN Boarding_Pass bp ON f.Flight_ID = bp.Flight_ID
        WHERE (p_status IS NULL OR p_status = '' OR p_status = 'All' OR f.Flight_Status = p_status)
          AND (p_airline IS NULL OR p_airline = '' OR p_airline = 'All' OR a.Airline_Code = p_airline)
          AND (p_aircraft IS NULL OR p_aircraft = '' OR p_aircraft = 'All' OR ac.Aircraft_Model = p_aircraft)
        GROUP BY f.Flight_ID, f.Flight_Number, a.Airline_Name, a.Airline_Code,
                 ac.Aircraft_Model, ac.Capacity, f.Departure_Airport,
                 f.Arrival_Airport, f.Departure_Time, f.Arrival_Time, f.Flight_Status
        ORDER BY f.Departure_Time;
END;
/

CREATE OR REPLACE PROCEDURE Get_Filtered_Passengers (
    p_passport_type  IN VARCHAR2,
    p_immig_status   IN VARCHAR2,
    p_pass_status    IN VARCHAR2,
    p_nationality    IN VARCHAR2,
    p_cursor         OUT SYS_REFCURSOR
) 
AS
BEGIN
    OPEN p_cursor FOR
        SELECT p.Passenger_ID as "PASSENGER_ID",
               p.First_Name || ' ' || p.Last_Name AS "FULL_NAME",
               p.Gender as "GENDER", 
               p.Date_of_Birth as "DATE_OF_BIRTH", 
               p.Nationality as "NATIONALITY",
               p.Phone_Number as "PHONE_NUMBER", 
               p.Email as "EMAIL",
               pp.Passport_Number as "PASSPORT_NUMBER", 
               pp.Country_of_Issue as "COUNTRY_OF_ISSUE",
               pp.Expiry_Date as "EXPIRY_DATE", 
               pp.Passport_Type as "PASSPORT_TYPE",
               CASE
                 WHEN pp.Expiry_Date < SYSDATE THEN 'Expired'
                 WHEN pp.Expiry_Date < SYSDATE + 180 THEN 'Expiring Soon'
                 ELSE 'Valid'
               END AS "PASSPORT_STATUS",
               ir.Immigration_Status as "IMMIGRATION_STATUS", 
               ir.Movement_Type as "MOVEMENT_TYPE",
               ir.From_Country as "FROM_COUNTRY", 
               ir.To_Country as "TO_COUNTRY", 
               ir.Entry_Date as "ENTRY_DATE"
        FROM Passenger p
        LEFT JOIN Passport pp ON p.Passenger_ID = pp.Passenger_ID
        LEFT JOIN Immigration_Record ir ON p.Passenger_ID = ir.Passenger_ID
        WHERE (p_passport_type IS NULL OR p_passport_type = '' OR p_passport_type = 'All' OR pp.Passport_Type = p_passport_type)
          AND (p_immig_status IS NULL OR p_immig_status = '' OR p_immig_status = 'All' OR ir.Immigration_Status = p_immig_status)
          AND (p_nationality IS NULL OR p_nationality = '' OR p_nationality = 'All' OR p.Nationality = p_nationality)
          AND (p_pass_status IS NULL OR p_pass_status = '' OR p_pass_status = 'All' 
               OR (p_pass_status = 'Expired' AND pp.Expiry_Date < SYSDATE)
               OR (p_pass_status = 'Expiring Soon' AND pp.Expiry_Date >= SYSDATE AND pp.Expiry_Date < SYSDATE + 180)
               OR (p_pass_status = 'Valid' AND pp.Expiry_Date >= SYSDATE + 180))
        ORDER BY p.Last_Name;
END;
/

CREATE OR REPLACE PROCEDURE Get_Filtered_Boarding (
    p_terminal  IN VARCHAR2,
    p_status    IN VARCHAR2,
    p_cursor    OUT SYS_REFCURSOR
) 
AS
BEGIN
    OPEN p_cursor FOR
        SELECT bp.BoardingPass_ID as "BOARDINGPASS_ID",
               p.First_Name || ' ' || p.Last_Name AS "PASSENGER_NAME",
               f.Flight_Number as "FLIGHT_NUMBER", 
               al.Airline_Name as "AIRLINE_NAME",
               g.Gate_Number as "GATE_NUMBER", 
               g.Terminal as "TERMINAL", 
               g.Gate_Status as "GATE_STATUS",
               bp.Seat_Number as "SEAT_NUMBER", 
               bp.Boarding_Time as "BOARDING_TIME", 
               bp.Boarding_Group as "BOARDING_GROUP",
               f.Flight_Status as "FLIGHT_STATUS", 
               f.Departure_Airport as "DEPARTURE_AIRPORT", 
               f.Arrival_Airport as "ARRIVAL_AIRPORT",
               f.Departure_Time as "DEPARTURE_TIME"
        FROM Boarding_Pass bp
        JOIN Passenger p ON bp.Passenger_ID = p.Passenger_ID
        JOIN Flight f ON bp.Flight_ID = f.Flight_ID
        JOIN Gate g ON bp.Gate_ID = g.Gate_ID
        JOIN Airline al ON f.Airline_ID = al.Airline_ID
        WHERE (p_terminal IS NULL OR p_terminal = '' OR p_terminal = 'All' OR g.Terminal = p_terminal)
          AND (p_status IS NULL OR p_status = '' OR p_status = 'All' OR f.Flight_Status = p_status)
        ORDER BY bp.Boarding_Time;
END;
/

CREATE OR REPLACE PROCEDURE Get_Filtered_Staff (
    p_dept       IN VARCHAR2,
    p_shift      IN VARCHAR2,
    p_attendance IN VARCHAR2,
    p_salary_op  IN VARCHAR2,
    p_salary_val IN NUMBER,
    p_cursor     OUT SYS_REFCURSOR
) 
AS
BEGIN
    OPEN p_cursor FOR
        SELECT s.Staff_ID as "STAFF_ID",
               s.First_Name || ' ' || s.Last_Name AS "FULL_NAME",
               s.Department as "DEPARTMENT", 
               s.Role as "ROLE", 
               s.Salary as "SALARY",
               sh.Shift_Name as "SHIFT_NAME", 
               sh.Start_Time || ' - ' || sh.End_Time AS "SHIFT_TIMING",
               gt.Team_Name as "TEAM_NAME",
               NVL(att.Attendance_Status, 'Absent') AS "TODAY_ATTENDANCE"
        FROM Airport_Staff s
        LEFT JOIN Shift sh ON s.Shift_ID = sh.Shift_ID
        LEFT JOIN Ground_Service_Team gt ON s.Team_ID = gt.Team_ID
        LEFT JOIN Attendance att ON s.Staff_ID = att.Staff_ID AND att.Attend_Date = TRUNC(SYSDATE)
        WHERE (p_dept IS NULL OR p_dept = '' OR p_dept = 'All' OR s.Department = p_dept)
          AND (p_shift IS NULL OR p_shift = '' OR p_shift = 'All' OR sh.Shift_Name = p_shift)
          AND (p_attendance IS NULL OR p_attendance = '' OR p_attendance = 'All' 
               OR (p_attendance = 'Present' AND att.Attendance_Status IN ('Present', 'Late'))
               OR (p_attendance = 'Absent' AND (att.Attendance_Status = 'Absent' OR att.Attendance_ID IS NULL)))
          AND (p_salary_val IS NULL 
               OR (p_salary_op = '<' AND s.Salary < p_salary_val)
               OR (p_salary_op = '>' AND s.Salary > p_salary_val))
        ORDER BY s.Department, s.Last_Name;
END;
/
