import { useState, useEffect } from 'react';

export function useApiForm<T extends Record<string, any>>(
  initialData: T | undefined,
  onSave: (data: T) => Promise<void>
) {
  const [form, setForm] = useState<T>({} as T);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData ? { ...initialData } : {} as T);
  }, [initialData]);

  const set = (key: keyof T, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, saving, set, handleSave };
}
