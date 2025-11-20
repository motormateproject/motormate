-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to ensure a clean slate)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS garage_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS garages CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    is_garage_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cars Table
CREATE TABLE cars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Garages Table
CREATE TABLE garages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Can be null if admin managed
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Services Table
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL,
    category TEXT, -- e.g., 'Maintenance', 'Repair', 'Wash'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Garage Services (Many-to-Many)
CREATE TABLE garage_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL, -- Specific price for this garage
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(garage_id, service_id)
);

-- 6. Bookings Table
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Reviews Table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Contact Messages Table
CREATE TABLE contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- INDEXES FOR PERFORMANCE ---
-- Adding indexes on foreign keys and frequently queried columns to improve performance
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_garages_owner_id ON garages(owner_id);
CREATE INDEX idx_garage_services_garage_id ON garage_services(garage_id);
CREATE INDEX idx_garage_services_service_id ON garage_services(service_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_garage_id ON bookings(garage_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_car_id ON bookings(car_id);
CREATE INDEX idx_bookings_status ON bookings(status); -- Useful for filtering by status
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_garage_id ON reviews(garage_id);


-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Profiles: Users can view and edit their own profile. Public can view basic info (optional, but good for reviews).
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cars: Users can only view and edit their own cars.
CREATE POLICY "Users can view own cars" ON cars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cars" ON cars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cars" ON cars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cars" ON cars FOR DELETE USING (auth.uid() = user_id);

-- Garages: Public can view all garages. Owners can edit their own.
CREATE POLICY "Garages are viewable by everyone" ON garages FOR SELECT USING (true);
CREATE POLICY "Owners can update own garage" ON garages FOR UPDATE USING (auth.uid() = owner_id);

-- Services: Public can view. Only admins (or seed script) insert/update.
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);

-- Garage Services: Public can view. Owners can manage.
CREATE POLICY "Garage services are viewable by everyone" ON garage_services FOR SELECT USING (true);

-- Bookings: Users can view their own bookings. Garage owners can view bookings for their garage.
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Garage owners can view bookings for their garage" ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM garages WHERE id = bookings.garage_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Garage owners can update bookings for their garage" ON bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM garages WHERE id = bookings.garage_id AND owner_id = auth.uid())
);

-- Reviews: Public can view. Users can create.
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contact Messages: Public can insert. Only admins view (simplified here to allow insert).
CREATE POLICY "Anyone can insert contact messages" ON contact_messages FOR INSERT WITH CHECK (true);


-- --- TRIGGERS FOR USER SIGNUP ---

-- Function to handle new user signup (automatically creates a profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, is_garage_owner)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email,
    COALESCE((new.raw_user_meta_data->>'is_garage_owner')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- --- MOCK DATA INSERTION ---

-- 1. Mock Garages (Owner ID set to NULL since we are not creating mock users)
INSERT INTO garages (id, owner_id, name, address, city, rating, description, image_url) VALUES
('11111111-1111-1111-1111-111111111111', '32279f33-c318-494d-acd6-a6b9cfbaab6d', 'Sharma Auto Works', '123 MG Road, Andheri West', 'Mumbai', 4.5, 'Expert car servicing and repairs with over 20 years of experience. We specialize in Maruti and Hyundai.', 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=800&auto=format&fit=crop'),
('22222222-2222-2222-2222-222222222222', NULL, 'Bangalore Car Care', '45 Indiranagar, 100ft Road', 'Bangalore', 4.2, 'Premium car wash and detailing services. Best in class equipment.', 'https://images.unsplash.com/photo-1597687210387-e45e74d4da4e?q=80&w=800&auto=format&fit=crop'),
('33333333-3333-3333-3333-333333333333', NULL, 'Delhi Motors', '88 Connaught Place', 'Delhi', 3.8, 'Affordable and quick repairs for all car brands. 24/7 breakdown assistance available.', 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop'),
('44444444-4444-4444-4444-444444444444', NULL, 'Pune Pitstop', '12 FC Road', 'Pune', 4.7, 'Specialists in engine diagnostics, tuning, and performance upgrades.', 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800&auto=format&fit=crop'),
('55555555-5555-5555-5555-555555555555', NULL, 'Chennai Express Service', '34 Anna Salai', 'Chennai', 4.0, 'Reliable service for your daily commute vehicle. Quick turnaround time.', 'https://images.unsplash.com/photo-1632823471565-1ec2a1ad4015?q=80&w=800&auto=format&fit=crop');

-- 2. Mock Services (Standard Categories)
INSERT INTO services (id, name, description, base_price, category) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'General Maintenance', 'Complete checkup including oil change, filter replacement, and fluid top-up.', 2500.00, 'Maintenance'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Full Body Wash', 'Exterior foam wash, interior vacuum cleaning, and dashboard polishing.', 800.00, 'Wash'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tire & Wheel Care', 'Wheel alignment, balancing, and tire rotation.', 1200.00, 'Maintenance'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Engine Diagnostics', 'Computerized engine scanning and error code diagnosis.', 1500.00, 'Repair'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'AC & Heating', 'AC gas refill, filter cleaning, and cooling coil inspection.', 1800.00, 'Maintenance'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Detailing & Polishing', 'Complete interior and exterior detailing with ceramic coating options.', 4500.00, 'Wash');

-- 3. Link Services to Garages (Garage Services) with Specific Prices
-- Linking ALL services to ALL garages with slight price variations to simulate realism

-- Garage 1: Sharma Auto Works (Mumbai) - Slightly more expensive
INSERT INTO garage_services (garage_id, service_id, price) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2800.00), -- General Maintenance
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 900.00),  -- Full Body Wash
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1300.00), -- Tire & Wheel Care
('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1600.00), -- Engine Diagnostics
('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2000.00), -- AC & Heating
('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5000.00); -- Detailing & Polishing

-- Garage 2: Bangalore Car Care (Bangalore) - Competitive pricing
INSERT INTO garage_services (garage_id, service_id, price) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2600.00),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 850.00),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1250.00),
('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1550.00),
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1900.00),
('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4800.00);

-- Garage 3: Delhi Motors (Delhi) - Budget friendly
INSERT INTO garage_services (garage_id, service_id, price) VALUES
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2200.00),
('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 700.00),
('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1000.00),
('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1400.00),
('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1600.00),
('33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4000.00);

-- Garage 4: Pune Pitstop (Pune) - Premium for performance, standard for others
INSERT INTO garage_services (garage_id, service_id, price) VALUES
('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2700.00),
('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 800.00),
('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1200.00),
('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1800.00), -- Higher for diagnostics
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1800.00),
('44444444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4600.00);

-- Garage 5: Chennai Express Service (Chennai) - Standard
INSERT INTO garage_services (garage_id, service_id, price) VALUES
('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2400.00),
('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 750.00),
('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1100.00),
('55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1450.00),
('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1700.00),
('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4300.00);

-- Mock Contact Messages (No user ID required)
INSERT INTO contact_messages (name, email, message) VALUES
('John Doe', 'john@example.com', 'Do you offer ceramic coating?'),
('Jane Smith', 'jane@example.com', 'I need to reschedule my appointment.');

-- --- BACKFILL EXISTING USERS ---
-- This ensures that if you are already signed up, a profile is created for you now.
INSERT INTO public.profiles (id, email, full_name, phone, is_garage_owner)
SELECT 
    id, 
    email,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'phone',
    COALESCE((raw_user_meta_data->>'is_garage_owner')::boolean, false)
FROM auth.users
ON CONFLICT (id) DO NOTHING;
