-- Migration script for Vehicle and Parking Management Feature
-- Run this script after backing up your database

-- 1. Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    owner_id INTEGER REFERENCES resident(residentid) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create parking_cards table
CREATE TABLE IF NOT EXISTS parking_cards (
    id BIGSERIAL PRIMARY KEY,
    card_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create parking_subscriptions table
CREATE TABLE IF NOT EXISTS parking_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_fee DECIMAL(15, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create parking_access_logs table
CREATE TABLE IF NOT EXISTS parking_access_logs (
    id BIGSERIAL PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    access_type VARCHAR(10) NOT NULL,
    subscription_type VARCHAR(20),
    vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
    card_number VARCHAR(50),
    fee DECIMAL(15, 2),
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    entry_image_url VARCHAR(500),
    exit_image_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create vehicle_registrations table
CREATE TABLE IF NOT EXISTS vehicle_registrations (
    id BIGSERIAL PRIMARY KEY,
    resident_id INTEGER NOT NULL REFERENCES resident(residentid) ON DELETE CASCADE,
    vehicle_type VARCHAR(20) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    subscription_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    id_card_image_url VARCHAR(500),
    vehicle_registration_image_url VARCHAR(500),
    vehicle_image_url VARCHAR(500),
    reviewed_by INTEGER REFERENCES useraccount(accountid) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    admin_notes TEXT,
    vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
    parking_card_id BIGINT REFERENCES parking_cards(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create parking_pricing table
CREATE TABLE IF NOT EXISTS parking_pricing (
    id BIGSERIAL PRIMARY KEY,
    vehicle_type VARCHAR(20) NOT NULL UNIQUE,
    monthly_fee DECIMAL(15, 2) NOT NULL,
    daily_fee DECIMAL(15, 2) NOT NULL,
    hourly_fee DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_cards_card_number ON parking_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_parking_cards_vehicle_id ON parking_cards(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parking_subscriptions_vehicle_id ON parking_subscriptions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parking_access_logs_license_plate ON parking_access_logs(license_plate);
CREATE INDEX IF NOT EXISTS idx_parking_access_logs_created_at ON parking_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_parking_access_logs_access_type ON parking_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_registrations_resident_id ON vehicle_registrations(resident_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_registrations_status ON vehicle_registrations(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_registrations_license_plate ON vehicle_registrations(license_plate);

-- 8. Insert default pricing data
INSERT INTO parking_pricing (vehicle_type, monthly_fee, daily_fee, hourly_fee)
VALUES 
    ('MOTORBIKE', 100000, 5000, 3000),
    ('CAR', 1500000, 50000, 20000)
ON CONFLICT (vehicle_type) DO NOTHING;

-- 9. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parking_cards_updated_at ON parking_cards;
CREATE TRIGGER update_parking_cards_updated_at
    BEFORE UPDATE ON parking_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parking_subscriptions_updated_at ON parking_subscriptions;
CREATE TRIGGER update_parking_subscriptions_updated_at
    BEFORE UPDATE ON parking_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_registrations_updated_at ON vehicle_registrations;
CREATE TRIGGER update_vehicle_registrations_updated_at
    BEFORE UPDATE ON vehicle_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parking_pricing_updated_at ON parking_pricing;
CREATE TRIGGER update_parking_pricing_updated_at
    BEFORE UPDATE ON parking_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Done!
-- Check the tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vehicles', 'parking_cards', 'parking_subscriptions', 
                   'parking_access_logs', 'vehicle_registrations', 'parking_pricing');
