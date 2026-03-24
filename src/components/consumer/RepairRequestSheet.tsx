import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { RepairSettings, DamageType, PricingRule } from '@/hooks/useRepairSettings';

interface Props {
  open: boolean;
  onClose: () => void;
  product: { id: string; name: string; slug: string };
  settings: RepairSettings;
}

const STEPS = 4;

export function RepairRequestSheet({ open, onClose, product, settings }: Props) {
  const [step, setStep] = useState(1);
  const [selectedDamage, setSelectedDamage] = useState<DamageType | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const damageTypes: DamageType[] = settings.damage_types || [];
  const pricingRules: PricingRule[] = settings.pricing_rules || [];
  const currentPricing = pricingRules.find((r) => r.damage_type === selectedDamage?.name);

  const reset = () => {
    setStep(1);
    setSelectedDamage(null);
    setPhotos([]);
    setCountry('');
    setCity('');
    setUserName('');
    setUserEmail('');
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || photos.length >= 5) return;
    setUploading(true);
    for (let i = 0; i < files.length && photos.length + i < 5; i++) {
      const file = files[i];
      const path = `${product.slug}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('repair-photos').upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('repair-photos').getPublicUrl(path);
        setPhotos((prev) => [...prev, urlData.publicUrl]);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await supabase.from('repair_requests').insert({
        product_id: product.id,
        damage_type: selectedDamage?.name || '',
        photos,
        country,
        city,
        user_name: userName || null,
        user_email: userEmail || null,
        warranty_status: 'unknown',
        estimated_cost_min: currentPricing?.min_price ?? null,
        estimated_cost_max: currentPricing?.max_price ?? null,
      } as any);
      setDone(true);
    } catch {
      // silent fail
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" onClick={handleClose}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-0 left-0 right-0 mx-auto"
          style={{
            maxWidth: 393,
            width: '100%',
            borderRadius: '14px 14px 0 0',
            backgroundColor: '#fff',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.12)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle + close */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <div />
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0' }} />
            <button onClick={handleClose} className="text-lg" style={{ color: '#999' }}>×</button>
          </div>

          {/* Progress */}
          {!done && (
            <div className="flex gap-1 px-5 pb-4">
              {Array.from({ length: STEPS }).map((_, i) => (
                <div key={i} className="flex-1" style={{ height: 3, borderRadius: 2, backgroundColor: i < step ? '#1a1a1a' : '#e8e4df', transition: 'background 300ms ease' }} />
              ))}
            </div>
          )}

          <div className="px-5 pb-6">
            {done ? (
              /* Confirmation */
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f0eb' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600 }}>Repair Request Submitted</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#666' }}>We'll send a confirmation and next steps to your email.</p>
                <div style={{ padding: 14, borderRadius: 8, border: '1px solid #e8e4df', textAlign: 'left' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#b5ada5', marginBottom: 4 }}>Summary</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>{product.name}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#666' }}>Repair: {selectedDamage?.name}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#666' }}>{photos.length} photo(s) attached</p>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 6, backgroundColor: '#1a1a1a', color: '#fff',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            ) : step === 1 ? (
              /* Step 1: Damage Type */
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>Request a Repair</h2>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#b5ada5' }}>{product.name}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>What needs repairing?</p>
                <div className="space-y-2">
                  {damageTypes.map((dt) => {
                    const sel = selectedDamage?.name === dt.name;
                    return (
                      <button
                        key={dt.name}
                        onClick={() => setSelectedDamage(dt)}
                        className="w-full text-left flex items-center gap-3"
                        style={{
                          padding: '14px 16px', borderRadius: 8,
                          border: sel ? 'none' : '1px solid #e8e4df',
                          backgroundColor: sel ? '#1a1a1a' : '#fff',
                          color: sel ? '#fff' : '#1a1a1a',
                        }}
                      >
                        <div className="flex-1">
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>{dt.name}</p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: sel ? 'rgba(255,255,255,0.6)' : '#b5ada5' }}>{dt.description}</p>
                        </div>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: sel ? '2px solid #fff' : '2px solid #ddd',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedDamage}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 6,
                    backgroundColor: selectedDamage ? '#1a1a1a' : '#ccc',
                    color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: selectedDamage ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue
                </button>
              </div>
            ) : step === 2 ? (
              /* Step 2: Photo Upload */
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>Damage Assessment</h2>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#b5ada5' }}>Photos help us pre-assess and provide an accurate estimate</p>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative flex-shrink-0" style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden' }}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10 }}
                      >×</button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex-shrink-0 flex flex-col items-center justify-center"
                      style={{ width: 80, height: 80, borderRadius: 8, border: '1px dashed #ddd8d2' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5ada5" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#b5ada5', marginTop: 4 }}>Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                {uploading && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#b5ada5' }}>Uploading…</p>}

                {photos.length >= 2 && (
                  <div className="flex items-center gap-2" style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: '#f5f0eb' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#8b7355' }}>Pre-assessment ready · Our team will review within 24 hours</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: 6, border: '1px solid #e8e4df', backgroundColor: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Back</button>
                  <button onClick={() => setStep(3)} style={{ flex: 1, padding: '14px', borderRadius: 6, backgroundColor: '#1a1a1a', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {photos.length === 0 ? 'Skip photos' : 'Continue'}
                  </button>
                </div>
              </div>
            ) : step === 3 ? (
              /* Step 3: Location & Shipping */
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>Shipping Details</h2>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#b5ada5' }}>You ship to us. We repair and return to you.</p>

                <div className="space-y-3">
                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Country</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Select country" style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e8e4df', fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
                    }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>City</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e8e4df', fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
                    }} />
                  </div>
                </div>

                {country && (
                  <div style={{ padding: '14px 16px', borderRadius: 8, backgroundColor: '#f7f7f5', border: '1px solid #eee' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Ship to:</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#666', whiteSpace: 'pre-line' }}>{settings.repair_centre_address}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#b5ada5', marginTop: 8 }}>Estimated turnaround: {settings.estimated_turnaround}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', borderRadius: 6, border: '1px solid #e8e4df', backgroundColor: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Back</button>
                  <button onClick={() => setStep(4)} style={{ flex: 1, padding: '14px', borderRadius: 6, backgroundColor: '#1a1a1a', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Continue</button>
                </div>
              </div>
            ) : step === 4 ? (
              /* Step 4: Warranty & Payment */
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>Warranty & Payment</h2>
                </div>

                {/* Warranty card */}
                <div style={{ padding: '14px 16px', borderRadius: 8, backgroundColor: '#f7f7f5', border: '1px solid #eee' }}>
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>Warranty Status</p>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#666', marginTop: 4 }}>Standard repair fees apply</p>
                </div>

                {/* Cost estimate */}
                {currentPricing && (
                  <div style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #e8e4df' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Estimated Cost</p>
                    <div className="flex justify-between" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                      <span>{selectedDamage?.name} repair</span>
                      <span>€{currentPricing.min_price} – €{currentPricing.max_price}</span>
                    </div>
                    <div className="flex justify-between" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#666', marginTop: 4 }}>
                      <span>Return shipping</span>
                      <span>€{settings.return_shipping_cost}</span>
                    </div>
                    {settings.warranty_covers_repair && (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#8b7355', fontStyle: 'italic', marginTop: 8 }}>
                        May be covered under warranty — confirmed after inspection
                      </p>
                    )}
                  </div>
                )}

                {/* Contact info */}
                <div className="space-y-3">
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>Your details</p>
                  <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name" style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e8e4df', fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
                  }} />
                  <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email address" type="email" style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e8e4df', fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
                  }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} style={{ flex: 1, padding: '14px', borderRadius: 6, border: '1px solid #e8e4df', backgroundColor: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Back</button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 6, backgroundColor: '#1a1a1a', color: '#fff',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
