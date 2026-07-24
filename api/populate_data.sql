-- Populate Vehicles
INSERT INTO vehicles (license_plate, vehicle_type, brand, model, color, owner_id, created_at, updated_at)
VALUES 
('30A-123.45', 'CAR', 'Toyota', 'Camry', 'Black', 1, NOW(), NOW()),
('29B-678.90', 'MOTORBIKE', 'Honda', 'Vision', 'Red', 2, NOW(), NOW()),
('30E-555.55', 'CAR', 'Mercedes', 'C300', 'White', 3, NOW(), NOW())
ON CONFLICT (license_plate) DO NOTHING;

-- Populate Vehicle Registrations
INSERT INTO vehicle_registrations (resident_id, vehicle_type, license_plate, brand, model, color, subscription_type, status, vehicle_id, created_at, updated_at)
SELECT 
    v.owner_id, 
    v.vehicle_type, 
    v.license_plate, 
    v.brand, 
    v.model, 
    v.color, 
    'MONTHLY', 
    'APPROVED', 
    v.id, 
    NOW(), 
    NOW()
FROM vehicles v
WHERE v.license_plate IN ('30A-123.45', '29B-678.90', '30E-555.55')
AND NOT EXISTS (SELECT 1 FROM vehicle_registrations vr WHERE vr.license_plate = v.license_plate);

-- Populate Parking Access Logs
INSERT INTO parking_access_logs (license_plate, vehicle_type, access_type, subscription_type, vehicle_id, entry_time, exit_time, created_at)
SELECT 
    v.license_plate, 
    v.vehicle_type, 
    'IN', 
    'MONTHLY', 
    v.id, 
    NOW() - INTERVAL '2 hours', 
    NULL, 
    NOW() - INTERVAL '2 hours'
FROM vehicles v
WHERE v.license_plate = '30A-123.45';

INSERT INTO parking_access_logs (license_plate, vehicle_type, access_type, subscription_type, vehicle_id, entry_time, exit_time, created_at)
SELECT 
    v.license_plate, 
    v.vehicle_type, 
    'OUT', 
    'MONTHLY', 
    v.id, 
    NOW() - INTERVAL '4 hours', 
    NOW() - INTERVAL '1 hour', 
    NOW() - INTERVAL '1 hour'
FROM vehicles v
WHERE v.license_plate = '29B-678.90';

-- Populate Face Registration (Mock Data)
-- Note: user_id here is assumed to be the string version of residentid
INSERT INTO face_registration (user_id, name, image_url, registered_at)
VALUES 
('1', 'Nguyen Van A', '/uploads/faces/mock_face_1.jpg', NOW()),
('2', 'Tran Thi B', '/uploads/faces/mock_face_2.jpg', NOW()),
('3', 'Le Van C', '/uploads/faces/mock_face_3.jpg', NOW());

-- Populate Building Access Logs
INSERT INTO building_access_log (access_point_id, user_id, user_name, access_type, timestamp, success, snapshot_url)
VALUES 
(1, '1', 'Nguyen Van A', 'IN', NOW() - INTERVAL '10 minutes', true, '/uploads/snapshots/mock_snap_1.jpg'),
(1, '2', 'Tran Thi B', 'IN', NOW() - INTERVAL '30 minutes', true, '/uploads/snapshots/mock_snap_2.jpg'),
(1, '999', 'Unknown', 'IN', NOW() - INTERVAL '1 hour', false, '/uploads/snapshots/mock_snap_3.jpg');
