-- Kubota Rental Platform Database Initialization
-- This script runs when PostgreSQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS kubota_rental;

-- Use the database
\c kubota_rental;

-- Create user if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'kubota_user') THEN

      CREATE ROLE kubota_user LOGIN PASSWORD 'kubota_password';
   END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE kubota_rental TO kubota_user;

-- Create tables for rental platform
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    daily_rate DECIMAL(10,2) NOT NULL,
    weekly_rate DECIMAL(10,2),
    monthly_rate DECIMAL(10,2),
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    specifications JSONB,
    images TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    rental_period_days INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_available ON equipment(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment_id ON bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- Insert sample data for development
INSERT INTO equipment (name, model, category, description, daily_rate, weekly_rate, monthly_rate, specifications) VALUES
('Kubota SVL75-2', 'SVL75-2', 'Compact Track Loader', 'High-performance compact track loader perfect for construction and landscaping', 250.00, 1500.00, 5000.00, '{"engine": "Kubota V3307-CR-TE4", "horsepower": "74.3 HP", "operating_weight": "9039 lbs", "bucket_capacity": "0.47 yd³"}'::jsonb),
('Kubota KX057-4', 'KX057-4', 'Mini Excavator', 'Versatile mini excavator for tight spaces and precision work', 300.00, 1800.00, 6000.00, '{"engine": "Kubota V2607-CR-E4", "horsepower": "47.6 HP", "operating_weight": "12300 lbs", "dig_depth": "12 ft 10 in"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Grant permissions on tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kubota_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kubota_user;

COMMIT;
