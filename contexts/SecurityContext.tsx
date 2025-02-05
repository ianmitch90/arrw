import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';

interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'gps' | 'wifi' | 'ip' | 'default';
  timestamp: number;
}

interface SecurityState {
  // Location and VPN related
  isLocationValid: boolean;
  isUsingVPN: boolean;
  locationErrorMessage?: string;
  currentLocation?: LocationResult;
  locationAccuracy: 'high' | 'medium' | 'low' | 'none';
  
  // User tier related
  isPremiumUser: boolean;
  
  // Moderation related
  isTimedOut: boolean;
  moderationEndTime?: Date;
  
  // Feature flags
  featureFlags: {
    canAccessMap: boolean;
    canAccessAR: boolean;
    canChat: boolean;
    canCreateContent: boolean;
    [key: string]: boolean; // Allow dynamic feature flags
  };
}

interface SecurityContextType extends SecurityState {
  checkLocationSecurity: () => Promise<boolean>;
  refreshSecurityState: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [securityState, setSecurityState] = useState<SecurityState>({
    isLocationValid: false,
    isUsingVPN: false,
    isPremiumUser: false,
    isTimedOut: false,
    locationAccuracy: 'none',
    featureFlags: {
      canAccessMap: false,
      canAccessAR: false,
      canChat: false,
      canCreateContent: false,
    }
  });

  // Check for VPN/Proxy using a service like IPHub or IPQualityScore
  const detectVPN = async (): Promise<boolean> => {
    try {
      // You'll need to sign up for an API key
      const response = await fetch(`https://v2.api.iphub.info/ip/check`, {
        headers: {
          'X-Key': process.env.NEXT_PUBLIC_IPHUB_API_KEY || '',
        }
      });
      const data = await response.json();
      // block = 1 indicates proxy/VPN
      return data.block === 1;
    } catch (error) {
      console.error('VPN detection error:', error);
      return false;
    }
  };

  // Try to get high-accuracy GPS location
  const getGPSLocation = async (): Promise<LocationResult | null> => {
    if (!('geolocation' in navigator)) return null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: 'gps',
        timestamp: position.timestamp
      };
    } catch (error) {
      console.error('GPS location error:', error);
      return null;
    }
  };

  // Try to get location from Google's Geolocation API using WiFi and cell towers
  const getWifiLocation = async (): Promise<LocationResult | null> => {
    try {
      // You'll need to set up NEXT_PUBLIC_GOOGLE_MAPS_KEY in your env
      const response = await fetch('https://www.googleapis.com/geolocation/v1/geolocate?key=' + 
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY, {
        method: 'POST',
        body: JSON.stringify({considerIp: false}) // Only use WiFi/Cell data
      });
      
      const data = await response.json();
      
      if (data.location) {
        return {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy,
          source: 'wifi',
          timestamp: Date.now()
        };
      }
      return null;
    } catch (error) {
      console.error('WiFi location error:', error);
      return null;
    }
  };

  // Get IP-based location as last resort
  const getIPLocation = async (): Promise<LocationResult | null> => {
    try {
      // Using ip-api.com as it's more reliable for location data
      const response = await fetch('http://ip-api.com/json/?fields=lat,lon,proxy,hosting');
      const data = await response.json();
      
      if (data.lat && data.lon) {
        const isVPNorProxy = data.proxy || data.hosting;
        
        if (isVPNorProxy) {
          setSecurityState(prev => ({
            ...prev,
            isUsingVPN: true,
            locationErrorMessage: 'Please disable VPN or proxy to use location-based features'
          }));
          return null;
        }

        return {
          latitude: data.lat,
          longitude: data.lon,
          accuracy: 5000, // IP geolocation is typically accurate to city level (~5km)
          source: 'ip',
          timestamp: Date.now()
        };
      }
      return null;
    } catch (error) {
      console.error('IP location error:', error);
      return null;
    }
  };

  // Main location verification function
  const verifyLocation = async (): Promise<{ isValid: boolean; message?: string }> => {
    console.log('Starting location verification...');
    
    // Try methods in order of accuracy
    const gpsLocation = await getGPSLocation();
    console.log('GPS Location result:', gpsLocation);
    
    if (gpsLocation && gpsLocation.accuracy <= 100) {
      setSecurityState(prev => ({
        ...prev,
        currentLocation: gpsLocation,
        locationAccuracy: 'high'
      }));
      return { isValid: true };
    }

    const wifiLocation = await getWifiLocation();
    console.log('WiFi Location result:', wifiLocation);
    
    if (wifiLocation && wifiLocation.accuracy <= 1000) {
      setSecurityState(prev => ({
        ...prev,
        currentLocation: wifiLocation,
        locationAccuracy: 'medium'
      }));
      return { isValid: true };
    }

    const ipLocation = await getIPLocation();
    console.log('IP Location result:', ipLocation);
    
    if (ipLocation) {
      setSecurityState(prev => ({
        ...prev,
        currentLocation: ipLocation,
        locationAccuracy: 'low'
      }));
      return { 
        isValid: true,
        message: 'Using approximate location. Enable device location for better accuracy.'
      };
    }

    setSecurityState(prev => ({
      ...prev,
      locationAccuracy: 'none'
    }));
    
    return { 
      isValid: false,
      message: 'Unable to determine your location. Please enable location services.'
    };
  };

  // Check user's subscription status
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    if (!user) return false;
    const { data: subscription } = await supabase
      .from('customers')
      .select('subscription_status')
      .eq('id', user.id)
      .single();
    
    return subscription?.subscription_status === 'active';
  };

  // Check moderation status
  const checkModerationStatus = async (): Promise<{ isTimedOut: boolean; moderationEndTime?: Date }> => {
    if (!user) return { isTimedOut: false };
    const { data: moderation } = await supabase
      .from('users')
      .select('status, updated_at')
      .eq('id', user.id)
      .single();
    
    const isModerated = moderation?.status === 'suspended' || moderation?.status === 'banned';
    return {
      isTimedOut: isModerated,
      moderationEndTime: isModerated && moderation.updated_at ? new Date(moderation.updated_at) : undefined
    };
  };

  // Main security check function
  const checkLocationSecurity = async () => {
    const [vpnResult, locationResult] = await Promise.all([
      detectVPN(),
      verifyLocation()
    ]);

    setSecurityState(prev => ({
      ...prev,
      isLocationValid: locationResult.isValid,
      isUsingVPN: vpnResult,
      locationErrorMessage: locationResult.message,
      featureFlags: {
        ...prev.featureFlags,
        canAccessMap: locationResult.isValid && !vpnResult,
        canAccessAR: locationResult.isValid && !vpnResult
      }
    }));

    return locationResult.isValid && !vpnResult;
  };

  // Refresh all security states
  const refreshSecurityState = async () => {
    const [
      locationSecurity,
      isPremium,
      moderation
    ] = await Promise.all([
      checkLocationSecurity(),
      checkSubscriptionStatus(),
      checkModerationStatus()
    ]);

    setSecurityState(prev => ({
      ...prev,
      isPremiumUser: isPremium,
      isTimedOut: moderation.isTimedOut,
      moderationEndTime: moderation.moderationEndTime,
      featureFlags: {
        ...prev.featureFlags,
        canCreateContent: isPremium && !moderation.isTimedOut,
        canChat: !moderation.isTimedOut
      }
    }));
  };

  // Initial security check
  useEffect(() => {
    refreshSecurityState();
  }, [user]);

  const contextValue: SecurityContextType = {
    ...securityState,
    checkLocationSecurity,
    refreshSecurityState
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}
