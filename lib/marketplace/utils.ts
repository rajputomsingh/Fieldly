import type { LandDTO } from './types';

export function formatLocation(land: LandDTO | null | undefined): string {
  if (!land) return "Location not specified";
  if (land.location) return land.location;
  
  const parts: string[] = [];
  if (land.village) parts.push(land.village);
  if (land.district) parts.push(land.district);
  if (land.state) parts.push(land.state);
  
  return parts.length > 0 ? parts.join(", ") : "Location not specified";
}

export function getMapUrl(land: LandDTO | null | undefined): string | null {
  if (!land) return null;
  if (land.mapUrl) return land.mapUrl;
  
  if (land.latitude && land.longitude) {
    return "https://www.google.com/maps?q=" + land.latitude + "," + land.longitude;
  }
  
  const location = formatLocation(land);
  if (location !== "Location not specified") {
    return "https://www.google.com/maps/search/" + encodeURIComponent(location);
  }
  
  return null;
}

export function hasLocationData(land: LandDTO | null | undefined): boolean {
  if (!land) return false;
  return !!(land.latitude && land.longitude) || 
    (!!land.location && land.location !== "Location not specified") ||
    !!(land.district && land.state);
}
