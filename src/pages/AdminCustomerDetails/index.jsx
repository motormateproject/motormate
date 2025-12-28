import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, Calendar, ArrowLeft } from 'feather-icons-react';

const AdminCustomerDetails = () => {
    const { userId } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [cars, setCars] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || user.role === 'authenticated' && profile?.role !== 'garage_owner') {
            // Basic auth check, though protected route should handle
        }

        const fetchDetails = async () => {
            setLoading(true);
            try {
                // 1. Fetch Customer Profile
                const { data: customerData, error: customerError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (customerError) throw customerError;
                setCustomer(customerData);

                // 2. Fetch Customer Cars
                const { data: carsData, error: carsError } = await supabase
                    .from('cars')
                    .select('*')
                    .eq('user_id', userId);

                if (carsError) throw carsError;
                setCars(carsData);

                // 3. Fetch Bookings (for this garage owner only? or all? 
                // Usually a garage owner should only see bookings related to THEIR garage.
                // But request says "all details of customer". 
                // However, seeing bookings at OTHER garages is a privacy violation.
                // I will restrict it to bookings at the current logged-in owner's garage.)

                // First get owner's garage id
                const { data: ownerGarage } = await supabase
                    .from('garages')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (ownerGarage) {
                    const { data: bookingsData, error: bookingsError } = await supabase
                        .from('bookings')
                        .select(`
                            *,
                            services (name),
                            cars (make, model, license_plate)
                        `)
                        .eq('user_id', userId)
                        .eq('garage_id', ownerGarage.id) // Security scope
                        .order('booking_date', { ascending: false });

                    if (bookingsError) throw bookingsError;
                    setBookings(bookingsData);
                }

            } catch (err) {
                console.error(err);
                setError('Failed to load customer details.');
            } finally {
                setLoading(false);
            }
        };

        if (userId && user) {
            fetchDetails();
        }
    }, [userId, user, profile]);

    if (loading) return <div style={{ padding: '20px' }}>Loading customer details...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!customer) return <div style={{ padding: '20px' }}>Customer not found.</div>;

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px' }}
            >
                <ArrowLeft size={16} /> Back
            </button>

            {/* Customer Profile Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        borderRadius: '50%', backgroundColor: '#eee',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <User size={40} color="#666" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>{customer.full_name || 'Unknown Name'}</h1>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', color: '#555' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={16} /> {customer.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Phone size={16} /> {customer.phone || 'No phone'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} /> {customer.address_text ? customer.address_text : (customer.latitude ? 'Location Coordinates Saved' : 'No address saved')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                {/* Cars Section */}
                <div className="card">
                    <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Vehicles</h2>
                    {cars.length === 0 ? (
                        <p style={{ color: '#888' }}>No vehicles registered.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cars.map(car => (
                                <div key={car.id} style={{
                                    padding: '10px', border: '1px solid #eee', borderRadius: '8px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <strong>{car.year} {car.make} {car.model}</strong>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Plate: {car.license_plate}</div>
                                    </div>
                                    {car.rc_image_url && (
                                        <a href={car.rc_image_url} target="_blank" rel="noopener noreferrer" style={{
                                            fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'underline'
                                        }}>
                                            View RC
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bookings History (Restricted to this garage) */}
                <div className="card">
                    <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Booking History (Your Garage)</h2>
                    {bookings.length === 0 ? (
                        <p style={{ color: '#888' }}>No previous bookings.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                            {bookings.map(booking => (
                                <div key={booking.id} style={{
                                    padding: '12px', background: '#f9f9f9', borderRadius: '8px',
                                    fontSize: '14px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <strong>{booking.services?.name}</strong>
                                        <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                                    </div>
                                    <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Calendar size={12} /> {new Date(booking.booking_date).toLocaleDateString()}
                                    </div>
                                    <div style={{ marginTop: '5px', fontSize: '13px' }}>
                                        Car: {booking.cars?.make} {booking.cars?.model}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCustomerDetails;
