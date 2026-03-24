import { useState, useEffect } from 'react';
import { useRepairSettings, useSaveRepairSettings, type RepairSettings, type DamageType, type PricingRule, type EmailTemplateField } from '@/hooks/useRepairSettings';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const DEFAULT_DAMAGE_TYPES: DamageType[] = [
  { name: 'Heel damage', description: 'Blade heel scratches, loosening, or re-plating' },
  { name: 'Upper fabric', description: 'Lace tears, snagging, or staining' },
  { name: 'Sole wear', description: 'Outsole damage or re-soling needed' },
  { name: 'Other', description: 'General wear, hardware, or other issues' },
];

const DEFAULT_PRICING: PricingRule[] = [
  { damage_type: 'Heel damage', min_price: 80, max_price: 150 },
  { damage_type: 'Upper fabric', min_price: 60, max_price: 120 },
  { damage_type: 'Sole wear', min_price: 50, max_price: 100 },
  { damage_type: 'Other', min_price: 40, max_price: 200 },
];

const DEFAULT_EMAIL_FIELDS: EmailTemplateField[] = [
  { key: 'product_name', label: 'Product name & SKU', enabled: true, sort_order: 0, type: 'text', custom: false },
  { key: 'damage_type', label: 'Damage type', enabled: true, sort_order: 1, type: 'text', custom: false },
  { key: 'damage_photos', label: 'Damage photos (attached)', enabled: true, sort_order: 2, type: 'text', custom: false },
  { key: 'customer_email', label: 'Customer email', enabled: true, sort_order: 3, type: 'text', custom: false },
  { key: 'customer_name', label: 'Customer name', enabled: true, sort_order: 4, type: 'text', custom: false },
  { key: 'customer_location', label: 'Customer country & city', enabled: true, sort_order: 5, type: 'text', custom: false },
  { key: 'warranty_status', label: 'Warranty status', enabled: true, sort_order: 6, type: 'text', custom: false },
  { key: 'estimated_cost', label: 'Estimated repair cost', enabled: true, sort_order: 7, type: 'text', custom: false },
  { key: 'request_date', label: 'Date of request', enabled: true, sort_order: 8, type: 'text', custom: false },
];

export default function AdminSettings() {
  const { data: settings, isLoading } = useRepairSettings();
  const saveMutation = useSaveRepairSettings();
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  const [enabled, setEnabled] = useState(false);
  const [repairEmail, setRepairEmail] = useState('');
  const [emailFields, setEmailFields] = useState<EmailTemplateField[]>(DEFAULT_EMAIL_FIELDS);
  const [repairAddress, setRepairAddress] = useState('Casadei S.p.A. — Repair Service\nVia Tessenara 5/7\n47833 Morciano di Romagna (RN), Italy');
  const [turnaround, setTurnaround] = useState('10–15 working days after receipt');
  const [damageTypes, setDamageTypes] = useState<DamageType[]>(DEFAULT_DAMAGE_TYPES);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(DEFAULT_PRICING);
  const [returnShipping, setReturnShipping] = useState(15);
  const [warrantyCover, setWarrantyCover] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setSettingsId(settings.id);
      setEnabled(settings.enabled);
      setRepairEmail(settings.repair_email || '');
      setEmailFields(settings.email_template_fields || DEFAULT_EMAIL_FIELDS);
      setRepairAddress(settings.repair_centre_address || '');
      setTurnaround(settings.estimated_turnaround || '');
      setDamageTypes(settings.damage_types || DEFAULT_DAMAGE_TYPES);
      setPricingRules(settings.pricing_rules || DEFAULT_PRICING);
      setReturnShipping(settings.return_shipping_cost ?? 15);
      setWarrantyCover(settings.warranty_covers_repair ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    const payload: any = {
      enabled,
      repair_email: repairEmail || null,
      email_template_fields: emailFields,
      repair_centre_address: repairAddress,
      estimated_turnaround: turnaround,
      damage_types: damageTypes,
      pricing_rules: pricingRules,
      return_shipping_cost: returnShipping,
      warranty_covers_repair: warrantyCover,
    };
    if (settingsId) payload.id = settingsId;
    try {
      await saveMutation.mutateAsync(payload);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const moveEmailField = (index: number, dir: -1 | 1) => {
    const newFields = [...emailFields];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= newFields.length) return;
    [newFields[index], newFields[swapIdx]] = [newFields[swapIdx], newFields[index]];
    newFields.forEach((f, i) => (f.sort_order = i));
    setEmailFields(newFields);
  };

  const addCustomField = () => {
    setEmailFields([
      ...emailFields,
      { key: `custom_${Date.now()}`, label: 'New field', enabled: true, sort_order: emailFields.length, type: 'text', custom: true },
    ]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Platform Settings</h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · Configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/admin/login'); }}>Sign Out</Button>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-10 pb-20">
        {/* ====== Repair Service Section ====== */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
            <div>
              <h2 className="text-base font-admin font-semibold text-foreground">Repair Service</h2>
              <p className="text-xs text-muted-foreground">Configure the repair request feature on product pages</p>
            </div>
          </div>

          {/* A. Enable toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Enable repair service</p>
              <p className="text-xs text-muted-foreground">Show a "Request a Repair" button on product pages</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* B. Repair Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Repair claims email</Label>
            <p className="text-xs text-muted-foreground">Email address where repair requests are sent</p>
            <Input value={repairEmail} onChange={(e) => setRepairEmail(e.target.value)} placeholder="e.g. repairs@casadei.com" />
          </div>

          {/* C. Email Template Builder */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Claim email contents</Label>
              <p className="text-xs text-muted-foreground">Choose which fields are included in the repair claim email</p>
            </div>
            <div className="space-y-1">
              {emailFields.sort((a, b) => a.sort_order - b.sort_order).map((field, idx) => (
                <div key={field.key} className="flex items-center gap-2 rounded border border-border px-3 py-2">
                  <Switch checked={field.enabled} onCheckedChange={(v) => {
                    const nf = [...emailFields];
                    nf[idx] = { ...nf[idx], enabled: v };
                    setEmailFields(nf);
                  }} />
                  {field.custom ? (
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const nf = [...emailFields];
                        nf[idx] = { ...nf[idx], label: e.target.value };
                        setEmailFields(nf);
                      }}
                      className="h-7 text-sm flex-1"
                    />
                  ) : (
                    <span className="text-sm text-foreground flex-1">{field.label}</span>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => moveEmailField(idx, -1)} className="text-muted-foreground hover:text-foreground text-xs px-1" disabled={idx === 0}>↑</button>
                    <button onClick={() => moveEmailField(idx, 1)} className="text-muted-foreground hover:text-foreground text-xs px-1" disabled={idx === emailFields.length - 1}>↓</button>
                    {field.custom && (
                      <button onClick={() => setEmailFields(emailFields.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive/80 text-xs px-1">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addCustomField}>+ Add custom field</Button>
          </div>

          {/* D. Repair Centre Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Repair centre address</Label>
            <p className="text-xs text-muted-foreground">Shown to customers as the shipping destination</p>
            <Textarea value={repairAddress} onChange={(e) => setRepairAddress(e.target.value)} rows={3} />
          </div>

          {/* E. Estimated Turnaround */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estimated turnaround time</Label>
            <p className="text-xs text-muted-foreground">Shown to customers after they select their country</p>
            <Input value={turnaround} onChange={(e) => setTurnaround(e.target.value)} />
          </div>

          {/* F. Damage Types */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Repair categories</Label>
              <p className="text-xs text-muted-foreground">Damage types shown to customers in step 1</p>
            </div>
            <div className="space-y-2">
              {damageTypes.map((dt, idx) => (
                <div key={idx} className="flex gap-2 items-start rounded border border-border p-3">
                  <div className="flex-1 space-y-1">
                    <Input value={dt.name} onChange={(e) => {
                      const nd = [...damageTypes]; nd[idx] = { ...nd[idx], name: e.target.value }; setDamageTypes(nd);
                    }} className="h-8 text-sm" placeholder="Category name" />
                    <Input value={dt.description} onChange={(e) => {
                      const nd = [...damageTypes]; nd[idx] = { ...nd[idx], description: e.target.value }; setDamageTypes(nd);
                    }} className="h-8 text-xs" placeholder="Description" />
                  </div>
                  <button onClick={() => setDamageTypes(damageTypes.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive/80 text-sm mt-1">×</button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setDamageTypes([...damageTypes, { name: '', description: '' }])}>+ Add repair category</Button>
          </div>

          {/* G. Pricing */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Repair pricing</Label>
              <p className="text-xs text-muted-foreground">Set price ranges and logic for repair estimates</p>
            </div>
            <div className="space-y-2">
              {pricingRules.map((rule, idx) => (
                <div key={idx} className="flex gap-2 items-center rounded border border-border p-3">
                  <span className="text-sm text-foreground flex-1 truncate">{rule.damage_type || '—'}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">€</span>
                    <Input type="number" value={rule.min_price} onChange={(e) => {
                      const np = [...pricingRules]; np[idx] = { ...np[idx], min_price: +e.target.value }; setPricingRules(np);
                    }} className="w-20 h-8 text-sm" />
                    <span className="text-xs text-muted-foreground">–</span>
                    <Input type="number" value={rule.max_price} onChange={(e) => {
                      const np = [...pricingRules]; np[idx] = { ...np[idx], max_price: +e.target.value }; setPricingRules(np);
                    }} className="w-20 h-8 text-sm" />
                  </div>
                  <button onClick={() => setPricingRules(pricingRules.filter((_, i) => i !== idx))} className="text-destructive text-sm">×</button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Label className="text-sm">Return shipping cost</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">€</span>
                <Input type="number" value={returnShipping} onChange={(e) => setReturnShipping(+e.target.value)} className="w-24 h-8 text-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4 mt-2">
              <div>
                <p className="text-sm font-medium text-foreground">Warranty covers repair</p>
                <p className="text-xs text-muted-foreground">If enabled, repairs for products under warranty are shown as potentially free pending inspection</p>
              </div>
              <Switch checked={warrantyCover} onCheckedChange={setWarrantyCover} />
            </div>
          </div>

          {/* H. Save */}
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-primary text-primary-foreground">
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </section>
      </main>
    </div>
  );
}
