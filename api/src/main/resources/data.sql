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