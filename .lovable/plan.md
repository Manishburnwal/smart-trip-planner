

# AI Trip Copilot – Smart Travel Planner

## Overview
A full-stack AI-powered travel planning platform that generates personalized, budget-aware itineraries with maps, weather data, and smart recommendations. Built with React + Tailwind + Supabase (via Lovable Cloud).

---

## Phase 1: Foundation & Auth

### User Authentication
- Email + password signup/login
- Google OAuth integration
- User profile page (name, avatar, travel preferences)
- Protected routes for authenticated users

### Database Setup
- **profiles** table (name, avatar, preferences)
- **trips** table (destination, dates, budget, interests, style, pace, status)
- **itinerary_days** table (day number, weather data, activities)
- **itinerary_items** table (place name, description, time slot, coordinates, estimated cost, tips)
- Row-level security policies for all tables

---

## Phase 2: Trip Creation

### Trip Creation Form
- Multi-step wizard with smooth transitions
- Fields: destination, travel dates, number of days, budget range (slider)
- Interest selection chips: food, beaches, adventure, culture, nightlife, chill
- Travel style selector: solo / couple / friends / family
- Travel pace toggle: relaxed / packed
- Form validation with helpful error messages

---

## Phase 3: AI Itinerary Generation

### AI-Powered Planning (via Lovable AI Gateway)
- Edge function that takes trip parameters and generates a structured itinerary
- Day-wise breakdown: morning / afternoon / evening activities
- Each activity includes: place name, description, best visiting time, estimated duration, estimated cost
- Local tips and common scams section per destination
- Backup/rainy day alternatives
- Budget breakdown: accommodation, food, transport, activities
- Budget warnings if unrealistic, with cheaper alternatives suggested

### Itinerary Display
- Card-based layout for each day
- Morning/afternoon/evening sections with icons and time estimates
- Budget summary sidebar
- Local tips callout cards

---

## Phase 4: Maps & Location

### Interactive Map (Leaflet + OpenStreetMap – free, no API key)
- Display all itinerary places as markers on a map
- Day-by-day route lines connecting stops
- Click markers to see place details
- Split view: itinerary cards on left, map on right
- Distance and estimated travel time between consecutive stops

### Transport Suggestions
- Walking / public transit / cab recommendations between spots
- Estimated time and rough cost per segment

---

## Phase 5: Weather Integration

### Weather Forecast (OpenWeatherMap free tier)
- Show 5-day forecast for the destination
- Weather icons on each itinerary day
- AI adjusts suggestions for rainy/extreme weather days
- Rain alert badges on affected activities

---

## Phase 6: Trip Management & Sharing

### Save & Manage Trips
- Dashboard showing all saved trips (card grid)
- Edit existing trips and regenerate itinerary
- Duplicate trips for quick variations
- Delete trips

### Shareable Public Link
- Generate a unique read-only public URL for any trip
- Public view with full itinerary, map, and budget (no auth required)

### PDF Export
- Download complete itinerary as PDF
- Includes day-wise plan, budget summary, tips, and safety info

---

## Phase 7: Polish & Demo Data

### UI/UX
- Clean, modern startup-style design with consistent color palette
- Mobile-first responsive layout
- Smooth page transitions and loading skeletons
- Friendly empty states (no trips yet, etc.)
- Error handling with toast notifications

### Demo Content
- Pre-built sample itineraries for Goa and Manali
- Seed data for demo/portfolio purposes

---

## Technical Notes
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase via Lovable Cloud (database, auth, edge functions, secrets)
- **AI**: Lovable AI Gateway (Gemini) for itinerary generation
- **Maps**: Leaflet with OpenStreetMap (free)
- **Weather**: OpenWeatherMap free tier (API key needed)
- **PDF**: Client-side PDF generation
- **Auth**: Supabase Auth (email + Google OAuth)

