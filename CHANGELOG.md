Changelog
[0.1.0] - 2024-12-30
Added

Initial map component with Mapbox GL JS
Basic routing functionality
Distance and route visualization
Type safety with TypeScript
Memory management and cleanup

[0.2.0] - 2025-01-01
Changed

Switched from Mapbox GL JS to Leaflet for improved security
Removed CSP requirements
Maintained Mapbox routing API integration

Added

Improved route visualization
Better error handling
Marker functionality
Coordinate tracking

Technical Details

Implemented TypeScript interfaces for route data
Added proper cleanup logic for map instances
Configured map initialization patterns
Set up state management for waypoints
Structured component for extensibility

[0.2.1] - 2025-01-05
Fixed

Route display issues
Marker image loading
Coordinate conversion between Mapbox and Leaflet
Map reinitialization bugs

Improved

Console logging for debugging
Error state handling
Loading state indicators
Waypoint management

Technical Details

Separated route fetching and drawing logic
Enhanced type definitions
Improved coordinate handling
Added proper map bounds fitting