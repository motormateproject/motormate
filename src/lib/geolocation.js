// Utility functions for geolocation

/**
 * Get user's current location
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred.';
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Sort garages by distance from user location
 * @param {Array} garages - Array of garage objects
 * @param {Object} userLocation - User's location {latitude, longitude}
 * @returns {Array} Sorted array of garages with distance property
 */
export const sortGaragesByDistance = (garages, userLocation) => {
    if (!userLocation || !garages) return garages;

    return garages
        .map((garage) => {
            // If garage has coordinates, calculate distance
            if (garage.latitude && garage.longitude) {
                const distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    garage.latitude,
                    garage.longitude
                );
                return { ...garage, distance: distance.toFixed(2) };
            }
            return { ...garage, distance: null };
        })
        .sort((a, b) => {
            // Sort by distance, nulls at the end
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return parseFloat(a.distance) - parseFloat(b.distance);
        });
};
