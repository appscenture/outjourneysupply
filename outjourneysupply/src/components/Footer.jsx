import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-corporate">
      <div className="footer-bottom">
        <span>© {currentYear} PT Outjourney</span>
        <nav className="footer-legal-links" aria-label="Legal and account links">
          <Link href="/terms" aria-label="Terms of Service">TOS</Link>
          <Link href="/privacy" aria-label="Privacy Policy">Policy</Link>
          <Link href="/client/login">Client login</Link>
        </nav>
      </div>
    </footer>
  );
};
