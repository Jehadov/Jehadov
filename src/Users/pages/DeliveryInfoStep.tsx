import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { DeliveryMeta } from './types';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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

interface DeliveryInfoStepProps {
  onNext: (data: DeliveryMeta) => void;
  onBack?: () => void;
}

export default function DeliveryInfoStep({ onNext, onBack }: DeliveryInfoStepProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setAddress(data.display_name || '');
    } catch {
      setAddress('');
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (position) reverseGeocode(position.lat, position.lng);
    else setAddress('');
  }, [position]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Permission denied or unable to retrieve your location.')
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return alert('Please enter your name.');
    if (!phoneNumber.trim()) return alert('Please enter your phone number.');
    if (!position) return alert('Please select your delivery location on the map.');
    if (!address) return alert('Unable to determine location address.');

    onNext({ name, phoneNumber, location: address, coordinates: position });
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
          >
            Use Current Location
          </button>

          <div style={{ height: 300, width: '100%' }}>
            <MapContainer
              center={[31.9454, 35.9284]} // Amman coordinates
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          
          {isGeocoding ? (
            <small className="text-muted">Loading address...</small>
          ) : address && (
            <small className="text-muted mt-2 d-block">
              Selected address: {address}
            </small>
          )}
        </div>

        <div className="d-flex justify-content-between">
          {onBack && (
            <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
              Back
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={isGeocoding}>
            Next
          </button>
        </div>
      </form>
    </div>
  );
}