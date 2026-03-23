import { useState, useEffect } from 'react';
import { ClassyLogo } from './ClassyLogo';

const STORAGE_KEY = 'cc_age_verified';

export function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) !== 'true') {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleYes = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const handleNo = () => {
    window.location.href = 'https://classycocktails.com';
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(250,250,248,0.97)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-center px-8 max-w-xs">
        <div className="flex justify-center mb-4">
          <ClassyLogo size={40} />
        </div>
        <p className="font-sans-consumer text-[10px] tracking-[0.2em] uppercase text-cc-text-lt mb-6">
          Classy Cocktails
        </p>
        <h2 className="font-display text-2xl font-normal text-cc-text mb-8">
          Are you of legal drinking age?
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleYes}
            className="flex-1 h-12 rounded font-sans-consumer text-[13px] font-medium text-white"
            style={{ backgroundColor: '#0a0a0a' }}
          >
            Yes, I'm 18+
          </button>
          <button
            onClick={handleNo}
            className="flex-1 h-12 rounded font-sans-consumer text-[13px] font-medium text-cc-text border border-cc-border hover:bg-cc-cream transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
