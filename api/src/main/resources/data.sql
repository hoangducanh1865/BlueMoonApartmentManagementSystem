UPDATE public.vehicle_registrations
SET reviewed_by = NULL
WHERE reviewed_by IN (
    SELECT accountid
    FROM public.useraccount
    WHERE email <> 'hoangducanh.1865@gmail.com'
);

DELETE FROM public.refreshtoken
WHERE accountid IN (
    SELECT accountid
    FROM public.useraccount
    WHERE email <> 'hoangducanh.1865@gmail.com'
);

DELETE FROM public.useraccount
WHERE email <> 'hoangducanh.1865@gmail.com';

INSERT INTO public.useraccount (residentid, password, role, email)
VALUES (
    NULL,
    '$2a$10$TJJcsEPKd59eMxApr1tr0OHKnHDAgUJQPNEX9G5J/1j1t2hHX5PPe',
    'ADMIN',
    'hoangducanh.1865@gmail.com'
)
ON CONFLICT (email) DO UPDATE
SET residentid = NULL,
    password = EXCLUDED.password,
    role = 'ADMIN';

SELECT setval(
    'public.useraccount_accountid_seq',
    GREATEST((SELECT COALESCE(MAX(accountid), 1) FROM public.useraccount), 1),
    true
);
