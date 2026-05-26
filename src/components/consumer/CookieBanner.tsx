import { useState, useEffect } from 'react';
import { setTrackingConsent } from '@/hooks/useTracking';
import { Link } from 'react-router-dom';

/**
 * GDPR cookie consent banner for the consumer bottle page.
 * Appears on first visit and any time consent has not yet been set.
 * Calls setTrackingConsent() which gates all analytics inserts in useTracking.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if consent has never been set
    const existing = localStorage.getItem('cc_tracking_consent');
    if (!existing) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setTrackingConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    setTrackingConsent(false);
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-5 py-4"
      style={{ background: 'rgba(10,10,10,0.96)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
    >
      <div className="max-w-lg mx-auto space-y-3">
        <p className="font-sans-consumer text-[11px] leading-relaxed" style={{ color: '#c8c8c8' }}>
          We use cookies to analyse how consumers engage with this product page.
          No data is shared with third parties.{' '}
          <Link
            to="/privacy"
            className="underline"
            style={{ color: '#b8975a' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 rounded-full font-sans-consumer text-[11px] font-medium tracking-wider uppercase"
            style={{ backgroundColor: '#b8975a', color: '#fff' }}
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 py-2 rounded-full font-sans-consumer text-[11px] tracking-wider uppercase"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#9a9a9a' }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
