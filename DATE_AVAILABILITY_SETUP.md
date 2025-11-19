# Date Availability Feature - Setup Instructions

## Overview
This feature allows vendors to set date-wise availability for themes, inventory, and plates, and enables clients to book items for specific dates (similar to Skyscanner).

## Required NPM Packages

You need to install the following packages for the date picker functionality:

```bash
cd Startup-ui
npm install @mui/x-date-pickers @mui/x-date-pickers-pro date-fns
```

**Note:** If you encounter issues with `@mui/x-date-pickers-pro`, you can use the free version:
```bash
npm install @mui/x-date-pickers date-fns
```

The free version includes `DatePicker` which is what we're using.

## Backend Implementation (Completed)

### 1. Database Schema
- **Availability Entity**: Tracks date-wise availability for each item
- **OrderItem**: Added `bookingDate` field to store the date for which an item is booked

### 2. API Endpoints
All endpoints are available at `/api/availability`:

- `POST /api/availability` - Create or update availability
- `GET /api/availability/item/{itemId}/type/{itemType}/date/{date}` - Get availability for specific date
- `GET /api/availability/item/{itemId}/type/{itemType}` - Get all availabilities for an item
- `GET /api/availability/item/{itemId}/type/{itemType}/range?startDate={start}&endDate={end}` - Get availabilities in date range
- `GET /api/availability/business/{businessId}` - Get all availabilities for a business
- `POST /api/availability/check` - Check if item is available on a date
- `GET /api/availability/item/{itemId}/type/{itemType}/date/{date}/quantity` - Get available quantity
- `DELETE /api/availability/item/{itemId}/type/{itemType}/date/{date}` - Delete availability for a date
- `DELETE /api/availability/item/{itemId}/type/{itemType}` - Delete all availabilities for an item

### 3. Order Service Updates
- Order creation now validates date availability
- Booking dates are stored with order items
- Availability is decremented when order is confirmed
- Availability is restored when order is cancelled

## Frontend Implementation (In Progress)

### 1. Types Updated
- `CartItem` - Added `bookingDate?: string`
- `OrderItem` - Added `bookingDate?: string`
- Created `availability.ts` with all availability-related types

### 2. Services Created
- `availabilityService.ts` - Service for all availability API calls

### 3. Components Created/Updated
- `DatePickerDialog.tsx` - Reusable date picker component with availability checking
- `Cart.tsx` - Updated to show and allow editing booking dates
- `CartContext.tsx` - Updated to support booking dates
- `ThemeCard.tsx` - Updated to show date picker when adding to cart

### 4. Still Need to Update
- `InventoryCard.tsx` - Add date picker functionality
- `PlateCard.tsx` - Add date picker functionality
- Create vendor availability management UI (calendar view)

## Usage Flow

### For Vendors:
1. Navigate to item management (Theme/Inventory/Plate)
2. Click "Manage Availability" button
3. Use calendar to set availability for each date
4. Set quantity available and optional price override per date

### For Clients:
1. Browse items on explore page
2. Click "Add to Cart" or "Buy Now"
3. Date picker dialog opens
4. Select desired booking date (availability is checked automatically)
5. Item is added to cart with selected date
6. In cart, can change booking date or remove it
7. When placing order, booking dates are included

## Next Steps

1. Install required packages: `npm install @mui/x-date-pickers date-fns`
2. Update `InventoryCard.tsx` and `PlateCard.tsx` similar to `ThemeCard.tsx`
3. Create vendor availability management component with calendar view
4. Test the complete flow

