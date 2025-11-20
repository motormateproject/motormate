# Setup Guide for New Features

## 🎯 Quick Start Checklist

### ✅ 1. Email Verification (Already Working)
**Status:** ✅ Ready to use (only checks on first login)

**How it works:**
- Users register → receive verification email
- First login attempt → must verify email
- After verification → can log in freely (no re-verification needed)
- "Resend Verification Email" button available if needed

**No additional setup required!**

---

### ✅ 2. Geolocation for Nearby Garages

**Status:** ⚠️ Needs database update

**Step 1: Run the SQL migration**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `add_geolocation_to_garages.sql`
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run**

**Step 2: Test the feature**
1. Go to the Search page in your app
2. Click **"Find Nearby Garages"** button
3. Allow location access when prompted
4. Garages will be sorted by distance
5. Each garage card will show distance (e.g., "📍 2.5 km away")

**Step 3: Add coordinates for new garages (when adding garages in the future)**
```sql
-- Example: Adding a new garage with coordinates
INSERT INTO garages (owner_id, name, address, city, rating, description, image_url, latitude, longitude)
VALUES (
  'owner-uuid-here',
  'New Garage Name',
  '123 Street Name',
  'City Name',
  4.5,
  'Description here',
  'image-url-here',
  19.0760,  -- Latitude (use Google Maps to find)
  72.8777   -- Longitude (use Google Maps to find)
);
```

**How to find coordinates for a location:**
1. Open Google Maps
2. Search for the address
3. Right-click on the location
4. Click on the coordinates (they'll be copied)
5. First number = Latitude, Second number = Longitude

---

### ✅ 3. Calendar Integration for Booking Reminders

**Status:** ✅ Ready to use (no setup needed)

**How to use:**
1. Go to **My Bookings** page
2. Find any booking
3. Click **"Add to Calendar"** button
4. Choose one of three options:
   - **📅 Google Calendar** - Opens in browser, saves to your Google account
   - **📆 Outlook Calendar** - Opens in browser, saves to your Outlook account
   - **💾 Download .ics file** - Downloads a file you can open with:
     - Apple Calendar (Mac/iPhone)
     - Outlook Desktop
     - Any other calendar app

**What gets added to calendar:**
- ✅ Service name (e.g., "Car Service: General Maintenance")
- ✅ Garage name and full address
- ✅ Your vehicle details
- ✅ Date and time of booking
- ✅ 2 automatic reminders:
  - 24 hours before appointment
  - 2 hours before appointment
- ✅ Link back to your bookings page

**No additional setup required!**

---

## 🔧 Troubleshooting

### Geolocation Issues

**"Location permission denied"**
- User needs to allow location access in browser
- On Chrome: Click the lock icon → Site settings → Location → Allow

**"Garages not showing distance"**
- Make sure you ran the SQL migration
- Check that garages have latitude/longitude values in database
- Run this query to verify:
  ```sql
  SELECT name, latitude, longitude FROM garages;
  ```

**"Distance calculation seems wrong"**
- Verify coordinates are correct (not swapped)
- Latitude should be between -90 and 90
- Longitude should be between -180 and 180

### Calendar Integration Issues

**"Calendar event not showing up"**
- For Google Calendar: Make sure you're logged into Google
- For Outlook: Make sure you're logged into Microsoft account
- For .ics file: Make sure you opened it with a calendar app

**"Reminders not working"**
- Google Calendar: Reminders work automatically
- Outlook: Reminders work automatically
- Apple Calendar: Make sure notifications are enabled for Calendar app

---

## 📊 Feature Summary

| Feature | Status | Setup Required | Works On |
|---------|--------|----------------|----------|
| Email Verification (First Login Only) | ✅ Ready | None | All users |
| Geolocation for Nearby Garages | ⚠️ Needs SQL | Run migration file | Desktop & Mobile |
| Calendar Integration | ✅ Ready | None | All platforms |

---

## 🚀 Next Steps

1. **Run the SQL migration** for geolocation:
   - File: `add_geolocation_to_garages.sql`
   - Location: Supabase SQL Editor

2. **Test all features:**
   - Register a new user → verify email works
   - Search for garages → test location sorting
   - Create a booking → add to calendar

3. **Optional improvements:**
   - Add more garages with coordinates
   - Customize calendar event descriptions
   - Add more reminder times if needed

---

## 📝 Files Modified

### Email Verification
- `src/context/AuthContext.jsx` - Added verification check (first login only)
- `src/pages/Login/index.jsx` - Added resend verification button

### Geolocation
- `src/lib/geolocation.js` - NEW: Geolocation utilities
- `src/pages/Search/index.jsx` - Added location button and sorting
- `add_geolocation_to_garages.sql` - NEW: Database migration

### Calendar Integration
- `src/lib/calendarUtils.js` - NEW: Calendar utilities
- `src/pages/MyBookings/index.jsx` - Added calendar button and dropdown

---

## ✅ All Done!

All features are implemented and ready to use. Just run the SQL migration for geolocation and you're all set! 🎉
