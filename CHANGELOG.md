# Changelog
[0.3.3] - 2024-01-10
## Added
- Location search functionality with autocomplete
- User geolocation on initial map load
- Smooth map transitions using `flyTo` instead of `setView`
- Search component in top-left corner
- Better error handling for geolocation failures

## Fixed
- Map initialization error with container mounting
- Leaflet positioning error (`_leaflet_pos undefined`)
- Proper cleanup of map instance on unmount

## Changed
- Map initialization sequence to ensure container exists
- Default center coordinates are set immediately on map creation
- Geolocation is now requested after map is fully initialized
- Transition animations added for smoother user experience
  - Duration: 1.5 seconds
  - Easing: 0.25 linearity

## Technical Details
- Added proper TypeScript types for search and location features
- Organized utility functions into separate modules
- Added debounced search to prevent API overload
- Improved component dependency management in useEffect hooks

[0.3.1] - 2024-01-10
Added

Distance and duration display
Turn-by-turn directions with interactive steps
Route summary panel
Enhanced type definitions
Formatted distance and duration utilities

Changed

Updated sidebar layout for route information
Enhanced error handling
Improved state management

[0.2.1] - 2024-01-10
Fixed

Route display issues
Marker loading
Coordinate conversion between Mapbox and Leaflet
Type declarations and ref management
CORS and API issues

[0.2.0] - 2024-01-10
Changed

Switched from Mapbox GL JS to Leaflet for better security
Removed CSP requirements
Maintained Mapbox routing API integration
Restructured component organization

[0.1.0] - 2024-01-09
Added

Initial map component with Mapbox GL JS
Basic routing functionality
Distance and route visualization
Type safety with TypeScript
Memory management and cleanup

## [Previous Versions]
[0.2.1] - Fixed route display and marker loading
[0.2.0] - Switched to Leaflet from Mapbox GL JS
[0.1.0] - Initial implementation with basic routing