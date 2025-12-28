import { supabase } from '../lib/supabaseClient';

// Fetches all garages with optional filters
export const fetchGarages = async (city = '', minRating = 0) => {
    let query = supabase.from('garages').select('*');

    if (city) {
        query = query.ilike('city', `%${city}%`);
    }
    if (minRating > 0) {
        query = query.gte('rating', minRating);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Fetches garages that offer a specific service
export const fetchGaragesByService = async (serviceId) => {
    const { data, error } = await supabase
        .from('garage_services')
        .select(`
            price,
            garages (
                id,
                name,
                address,
                city,
                rating
            )
        `)
        .eq('service_id', serviceId)
        .eq('is_available', true);

    if (error) throw error;

    // Transform to flat structure
    return data.map(item => ({
        ...item.garages,
        price: item.price // Include the price for this service at this garage
    }));
};

// Fetches details for a specific garage
export const fetchGarageDetails = async (garageId) => {
    const { data, error } = await supabase
        .from('garages')
        .select('*')
        .eq('id', garageId)
        .single();

    if (error) throw error;
    return data;
};

// Fetches services offered by a specific garage
export const fetchGarageServices = async (garageId) => {
    const { data, error } = await supabase
        .from('garage_services')
        .select(`
            id,
            price,
            services (
                id,
                name,
                description,
                category
            )
        `)
        .eq('garage_id', garageId)
        .eq('is_available', true);

    if (error) throw error;

    // Transform to flat structure expected by frontend
    return data.map(item => ({
        id: item.services.id, // Use the service ID as the main ID for selection
        garage_service_id: item.id, // Keep the link ID just in case
        name: item.services.name,
        description: item.services.description,
        category: item.services.category,
        price: item.price
    }));
};

// Creates a new booking
export const createBooking = async (bookingDetails) => {
    const { data, error } = await supabase
        .from('bookings')
        .insert([bookingDetails])
        .select();

    if (error) throw error;
    return data;
};

// Fetches all bookings for a specific user
export const fetchUserBookings = async (userId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            garages (name, address),
            services (name),
            cars (make, model, license_plate)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Updates the status of a booking
export const updateBookingStatus = async (bookingId, status) => {
    const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select();

    if (error) throw error;
    return data;
};

// Fetches profile information for a user
export const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

// Updates profile information for a user
export const updateProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

    if (error) throw error;
    return data;
};

// Fetches the garage owned by a specific owner
export const fetchOwnerGarage = async (ownerId) => {
    const { data, error } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', ownerId)
        .single();

    if (error) {
        // If no garage found, return null instead of throwing error (common case for new owners)
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
};

// Updates garage details
export const updateGarageDetails = async (garageId, updates) => {
    const { data, error } = await supabase
        .from('garages')
        .update(updates)
        .eq('id', garageId)
        .select();

    if (error) throw error;
    return data;
};

// Fetches bookings for a specific garage
export const fetchGarageBookings = async (garageId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            profiles:user_id (full_name, email, phone),
            services (name),
            cars (make, model, license_plate)
        `)
        .eq('garage_id', garageId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to match expected structure (profiles -> users)
    return data.map(booking => ({
        ...booking,
        users: booking.profiles // Alias profiles to users for frontend compatibility
    }));
};

// Adds a new service to a garage
export const addGarageService = async (serviceDetails) => {
    // This is a bit complex because we need to link a service to a garage.
    // For now, assuming we are linking an existing service or creating a new one?
    // The schema has 'services' and 'garage_services'.
    // If the UI allows creating a NEW service type, we'd insert into 'services' first.
    // But typically, an owner selects from existing services or we create a custom one.
    // For simplicity, let's assume we are just inserting into garage_services 
    // and we might need to create the service definition if it doesn't exist.

    // However, based on the mock implementation, it just pushed to a list.
    // Let's assume the UI passes { garage_id, service_id, price }.

    const { data, error } = await supabase
        .from('garage_services')
        .insert([serviceDetails])
        .select();

    if (error) throw error;
    return data;
};

// Updates an existing service for a garage
export const updateGarageService = async (garageServiceId, updates) => {
    const { data, error } = await supabase
        .from('garage_services')
        .update(updates)
        .eq('id', garageServiceId)
        .select();

    if (error) throw error;
    return data;
};

// Deletes a service from a garage
export const deleteGarageService = async (garageServiceId) => {
    const { error } = await supabase
        .from('garage_services')
        .delete()
        .eq('id', garageServiceId);

    if (error) throw error;
    return null;
};

// Fetches vehicles for a specific user
export const fetchUserVehicles = async (userId) => {
    const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data;
};

// Creates a new garage
export const createGarage = async (garageDetails) => {
    const { data, error } = await supabase
        .from('garages')
        .insert([garageDetails])
        .select();

    if (error) throw error;
    return data;
};
