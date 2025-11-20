// Utility functions for calendar integration

/**
 * Generate iCalendar (.ics) file content
 * @param {Object} event - Event details
 * @returns {string} iCalendar formatted string
 */
export const generateICS = (event) => {
    const {
        title,
        description,
        location,
        startDate,
        startTime,
        endDate,
        endTime,
        url
    } = event;

    // Format dates for iCalendar (YYYYMMDDTHHMMSS)
    const formatDateTime = (date, time) => {
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dtStart = formatDateTime(startDate, startTime);
    const dtEnd = endDate && endTime
        ? formatDateTime(endDate, endTime)
        : formatDateTime(startDate, addHours(startTime, 2)); // Default 2 hours duration

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Motor Mate//Booking Reminder//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `UID:${Date.now()}@motormate.com`,
        `SUMMARY:${escapeICSText(title)}`,
        description ? `DESCRIPTION:${escapeICSText(description)}` : '',
        location ? `LOCATION:${escapeICSText(location)}` : '',
        url ? `URL:${url}` : '',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT24H', // Reminder 24 hours before
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICSText('Reminder: ' + title)}`,
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT2H', // Reminder 2 hours before
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICSText('Reminder: ' + title)}`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    return icsContent;
};

/**
 * Escape special characters for iCalendar format
 * @param {string} text
 * @returns {string}
 */
const escapeICSText = (text) => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
};

/**
 * Add hours to a time string
 * @param {string} time - Time in HH:MM format
 * @param {number} hours - Hours to add
 * @returns {string} New time in HH:MM format
 */
const addHours = (time, hours) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h + hours, m);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Download iCalendar file
 * @param {string} icsContent - iCalendar formatted string
 * @param {string} filename - Name of the file to download
 */
export const downloadICS = (icsContent, filename = 'booking-reminder.ics') => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

/**
 * Generate Google Calendar URL
 * @param {Object} event - Event details
 * @returns {string} Google Calendar URL
 */
export const generateGoogleCalendarURL = (event) => {
    const {
        title,
        description,
        location,
        startDate,
        startTime,
        endDate,
        endTime
    } = event;

    const formatGoogleDateTime = (date, time) => {
        return `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
    };

    const start = formatGoogleDateTime(startDate, startTime);
    const end = endDate && endTime
        ? formatGoogleDateTime(endDate, endTime)
        : formatGoogleDateTime(startDate, addHours(startTime, 2));

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${start}/${end}`,
        details: description || '',
        location: location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar URL
 * @param {Object} event - Event details
 * @returns {string} Outlook Calendar URL
 */
export const generateOutlookCalendarURL = (event) => {
    const {
        title,
        description,
        location,
        startDate,
        startTime,
        endDate,
        endTime
    } = event;

    const formatOutlookDateTime = (date, time) => {
        return new Date(`${date}T${time}`).toISOString();
    };

    const start = formatOutlookDateTime(startDate, startTime);
    const end = endDate && endTime
        ? formatOutlookDateTime(endDate, endTime)
        : formatOutlookDateTime(startDate, addHours(startTime, 2));

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: title,
        body: description || '',
        location: location || '',
        startdt: start,
        enddt: end,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Create booking reminder event object
 * @param {Object} booking - Booking details
 * @returns {Object} Event object for calendar
 */
export const createBookingEvent = (booking) => {
    const serviceName = booking.services?.name || booking.serviceName || 'Car Service';
    const garageName = booking.garages?.name || booking.garageName || 'Garage';
    const garageAddress = booking.garages?.address || booking.garageAddress || '';
    const garageCity = booking.garages?.city || booking.garageCity || '';
    const carInfo = booking.cars
        ? `${booking.cars.make} ${booking.cars.model} (${booking.cars.license_plate})`
        : '';

    return {
        title: `Car Service: ${serviceName}`,
        description: `Service: ${serviceName}\nGarage: ${garageName}\n${carInfo ? `Vehicle: ${carInfo}\n` : ''}Status: ${booking.status || 'Pending'}\n\nPlease arrive on time for your appointment.`,
        location: `${garageName}, ${garageAddress}, ${garageCity}`,
        startDate: booking.booking_date,
        startTime: booking.booking_time || '09:00',
        endDate: booking.booking_date,
        endTime: null, // Will default to 2 hours after start
        url: window.location.origin + '/my-bookings'
    };
};
