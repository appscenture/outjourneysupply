import React from 'react';
import { MapPin, Globe, Phone, MessageCircle } from 'lucide-react';

export const TopBar = () => {
  return (
    <div className="top-notice-bar">
      <div className="top-notice-left">
        <div className="top-notice-item">
          <MapPin />
          <span>Tower 3 Pondok Indah Mall, Jakarta 12310</span>
        </div>
        <div className="top-notice-item">
          <Globe />
          <a href="https://www.outjourney.id">www.outjourney.id</a>
        </div>
      </div>
      <div className="top-notice-right">
        <div className="top-notice-item">
          <Phone />
          <a href="tel:+6281388882473">+62 813-8888-2473</a>
        </div>
        <div className="top-notice-item">
          <MessageCircle />
          <a href="https://wa.me/6281388882473">WhatsApp</a>
        </div>
      </div>
    </div>
  );
};
