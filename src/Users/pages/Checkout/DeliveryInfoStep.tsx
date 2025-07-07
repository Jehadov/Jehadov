import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { DeliveryMeta } from '../types';

// Fix leaflet marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function MapUpdater({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 16);
    }
  }, [position, map]);
  return null;
}

interface DeliveryInfoStepProps {
  onNext: (data: DeliveryMeta) => void;
  onBack?: () => void;
}

// Cache for geocoding results
const geocodeCache = new Map<string, string>();

export default function DeliveryInfoStep({ onNext, onBack }: DeliveryInfoStepProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const reverseGeocode = async (lat: number, lng: number) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    
    if (geocodeCache.has(cacheKey)) {
      setAddress(geocodeCache.get(cacheKey)!);
      return;
    }

    setIsGeocoding(true);
    setGeocodeError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (your@email.com)',
            'Accept-Language': 'en'
          }
        }
      );
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      const addr = data.address;
      
      const formattedAddress = [
        addr?.road,
        addr?.house_number,
        addr?.neighbourhood,
        addr?.suburb,
        addr?.city,
        addr?.country
      ].filter(Boolean).join(', ') || data.display_name || 'Address not specified';
      
      setAddress(formattedAddress);
      setManualAddress('');
      geocodeCache.set(cacheKey, formattedAddress);
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('Could not determine address. Please try another location or enter manually below.');
      setAddress('');
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => {
        reverseGeocode(position.lat, position.lng);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAddress('');
    }
  }, [position]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    
    setGeocodeError('');
    setIsGeocoding(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        setIsGeocoding(false);
        alert(`Error getting location: ${error.message}`);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddress = address || manualAddress;
    
    if (!name.trim()) return alert('Please enter your name.');
    if (!phoneNumber.trim()) return alert('Please enter your phone number.');
    if (!position) return alert('Please select your delivery location on the map.');
    if (!finalAddress) return alert('Please enter or select an address.');

    onNext({
      name,
      phoneNumber,
      location: finalAddress,
      coordinates: position,
    });
  };

  return (
    <div className="container my-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4">Delivery Information</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Phone Number:</label>
          <input
            type="tel"
            className="form-control"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            pattern="^\+?\d{7,15}$"
          />
        </div>

        <div className="mb-3">
          <button
            type="button"
            className="btn btn-outline-secondary mb-2"
            onClick={useCurrentLocation}
            disabled={isGeocoding}
          >
            {isGeocoding ? 'Locating...' : 'Use Current Location'}
          </button>

          <div style={{ height: 300, width: '100%' }}>
            <MapContainer
              center={[31.9454, 35.9284]} // Default to Amman
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker position={position} setPosition={setPosition} />
              <MapUpdater position={position} />
            </MapContainer>
          </div>

          <div className="mt-2">
            {isGeocoding ? (
              <div className="text-muted">Loading address...</div>
            ) : geocodeError ? (
              <div>
                <div className="text-danger mb-2">{geocodeError}</div>
                <div className="form-group">
                  <label>Enter address manually:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            ) : address ? (
              <div className="text-muted">
                <strong>Selected address:</strong> {address}
              </div>
            ) : (
              <div className="text-muted">
                Click on the map to select delivery location
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-between">
          {onBack && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onBack}
              disabled={isGeocoding}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isGeocoding || (!address && !manualAddress)}
          >
            {isGeocoding ? 'Processing...' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}