import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type DeviceLocation = {
  timestamp: number;
  coords: { latitude: number; longitude: number; accuracy: number };
};

export async function requestCurrentDeviceLocation(): Promise<DeviceLocation> {
  if (Capacitor.isNativePlatform()) {
    let permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      permission = await Geolocation.requestPermissions({ permissions: ["location"] });
    }
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      throw new Error("Location permission was denied. Enable location access in Android settings, then try again.");
    }
    return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 });
  }

  if (!navigator.geolocation) throw new Error("Location is not supported by this browser. Enter the place manually.");
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    resolve,
    (error) => reject(new Error(error.code === error.PERMISSION_DENIED
      ? "Location permission was denied. Allow location access for this site in browser settings, then try again."
      : error.code === error.POSITION_UNAVAILABLE
        ? "Your device could not determine a location. Turn on location services and try again."
        : "Location request timed out. Move to an area with a clearer GPS signal and try again.")),
    { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 },
  ));
}
