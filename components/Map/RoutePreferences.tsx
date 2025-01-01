// components/Map/RoutePreferences.tsx
'use client';

import { RoutePreferences } from '../../types/map';

interface RoutePreferencesProps {
  preferences: RoutePreferences;
  onChange: (prefs: RoutePreferences) => void;
}

export const RoutePreferencesPanel = ({ preferences, onChange }: RoutePreferencesProps) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium mb-3">Route Preferences</h4>
      
      {/* Hill Preference */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Hills</label>
        <select
          value={preferences.hills}
          onChange={(e) => onChange({ ...preferences, hills: e.target.value as RoutePreferences['hills'] })}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="none">No preference</option>
          <option value="avoid">Avoid hills</option>
          <option value="prefer">Include hills</option>
        </select>
      </div>

      {/* Route Type */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Route Type</label>
        <select
          value={preferences.type}
          onChange={(e) => onChange({ ...preferences, type: e.target.value as RoutePreferences['type'] })}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="balanced">Balanced</option>
          <option value="fastest">Fastest</option>
          <option value="quietest">Quietest</option>
        </select>
      </div>

      {/* Surface Type */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Surface</label>
        <select
          value={preferences.surface}
          onChange={(e) => onChange({ ...preferences, surface: e.target.value as RoutePreferences['surface'] })}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="any">Any surface</option>
          <option value="paved">Paved only</option>
        </select>
      </div>
    </div>
  );
};