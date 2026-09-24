# ParkShare v1 — real local MVP

This is a functional full-stack starter, not just a visual mockup.

## Included
- Node.js backend using only built-in Node modules
- Persistent JSON database (`data/db.json`)
- Driver search
- Parking listings
- Owner account creation
- Owner parking-space creation
- Booking creation
- Booking dashboard
- Responsive web UI

## Run it
1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run: `node server.js`
4. Open: `http://localhost:3000`

No npm packages are required.

## What is NOT production-ready yet
- Real OTP authentication
- Google/Mapbox maps and GPS
- Razorpay/Stripe/UPI payment processing
- Automated owner payouts
- Photo upload/storage
- Real availability conflict checking
- KYC/owner/property verification
- Production database
- Encryption, rate limiting and security hardening
- Terms, privacy, cancellation and vehicle-liability workflows
- Android/iOS store builds

## Recommended next build
Move the JSON database to PostgreSQL, add real authentication, maps, payments, image storage and a proper admin console. Then deploy the backend and web app to a cloud provider and package the customer/owner experience as Android/iOS apps.
