INSERT INTO public.apartment (houseid, building, floor, area, status, type, apartment_number)
VALUES
    (1, 'BlueMoon Tower', 1, 50.0, 'EMPTY', 'NORMAL', 'A-101')
ON CONFLICT (houseid) DO UPDATE
SET building = EXCLUDED.building,
    floor = EXCLUDED.floor,
    area = EXCLUDED.area,
    status = EXCLUDED.status,
    type = EXCLUDED.type,
    apartment_number = EXCLUDED.apartment_number;

INSERT INTO public.resident (residentid, houseid, name, phonenumber, email, state, is_host)
VALUES
    (1, 1, 'Bich Tran', '0987654321', 'bich.tran@email.com', 'THUONG_TRU', true)
ON CONFLICT (residentid) DO UPDATE
SET houseid = EXCLUDED.houseid,
    name = EXCLUDED.name,
    phonenumber = EXCLUDED.phonenumber,
    email = EXCLUDED.email,
    state = EXCLUDED.state,
    is_host = EXCLUDED.is_host;

INSERT INTO public.useraccount (accountid, residentid, password, role, email)
VALUES
    (1, NULL, '123456', 'ADMIN', 'admin@bluemoon.com'),
    (2, 1, 'MySecretPassword123', 'RESIDENT', 'bich.tran@email.com'),
    (3, NULL, 'Password123!', 'ADMIN', 'admin@test.com')
ON CONFLICT (email) DO UPDATE
SET residentid = EXCLUDED.residentid,
    password = EXCLUDED.password,
    role = EXCLUDED.role;

SELECT setval('public.apartment_houseid_seq', GREATEST((SELECT COALESCE(MAX(houseid), 1) FROM public.apartment), 1), true);
SELECT setval('public.resident_residentid_seq', GREATEST((SELECT COALESCE(MAX(residentid), 1) FROM public.resident), 1), true);
SELECT setval('public.useraccount_accountid_seq', GREATEST((SELECT COALESCE(MAX(accountid), 1) FROM public.useraccount), 1), true);

INSERT INTO public.vehicles (license_plate, vehicle_type, brand, model, color, owner_id, created_at, updated_at)
VALUES
    ('30A-123.45', 'CAR', 'Toyota', 'Camry', 'Black', 1, NOW(), NOW()),
    ('29B-678.90', 'MOTORBIKE', 'Honda', 'Vision', 'Red', 2, NOW(), NOW()),
    ('30E-555.55', 'CAR', 'Mercedes', 'C300', 'White', 3, NOW(), NOW())
ON CONFLICT (license_plate) DO NOTHING;

INSERT INTO public.vehicle_registrations (resident_id, vehicle_type, license_plate, brand, model, color, subscription_type, status, vehicle_id, created_at, updated_at)
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
FROM public.vehicles v
WHERE v.license_plate IN ('30A-123.45', '29B-678.90', '30E-555.55')
AND NOT EXISTS (SELECT 1 FROM public.vehicle_registrations vr WHERE vr.license_plate = v.license_plate);

INSERT INTO public.parking_access_logs (license_plate, vehicle_type, access_type, subscription_type, vehicle_id, entry_time, exit_time, created_at)
SELECT
    v.license_plate,
    v.vehicle_type,
    'IN',
    'MONTHLY',
    v.id,
    NOW() - INTERVAL '2 hours',
    NULL,
    NOW() - INTERVAL '2 hours'
FROM public.vehicles v
WHERE v.license_plate = '30A-123.45';

INSERT INTO public.parking_access_logs (license_plate, vehicle_type, access_type, subscription_type, vehicle_id, entry_time, exit_time, created_at)
SELECT
    v.license_plate,
    v.vehicle_type,
    'OUT',
    'MONTHLY',
    v.id,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
FROM public.vehicles v
WHERE v.license_plate = '29B-678.90';

INSERT INTO public.face_registration (user_id, name, image_url, registered_at)
VALUES
    ('1', 'Nguyen Van A', '/uploads/faces/mock_face_1.jpg', NOW()),
    ('2', 'Tran Thi B', '/uploads/faces/mock_face_2.jpg', NOW()),
    ('3', 'Le Van C', '/uploads/faces/mock_face_3.jpg', NOW());

INSERT INTO public.building_access_log (access_point_id, user_id, user_name, access_type, timestamp, success, snapshot_url)
VALUES
    (1, '1', 'Nguyen Van A', 'IN', NOW() - INTERVAL '10 minutes', true, '/uploads/snapshots/mock_snap_1.jpg'),
    (1, '2', 'Tran Thi B', 'IN', NOW() - INTERVAL '30 minutes', true, '/uploads/snapshots/mock_snap_2.jpg'),
    (1, '999', 'Unknown', 'IN', NOW() - INTERVAL '1 hour', false, '/uploads/snapshots/mock_snap_3.jpg');