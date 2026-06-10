import { useState, useEffect, useRef } from 'react';

export function useApiForm<T extends Record<string, any>>(
  initialData: T | undefined,
  onSave: (data: T) => Promise<void>
) {
  const [form, setForm] = useState<T>({} as T);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // Only reset the form when the entity identity changes (different id / slug),
  // NOT on every React Query background refetch that returns a new object reference.
  const prevEntityKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!initialData) return;
    const entityKey = (initialData as any).id ?? (initialData as any).slug ?? JSON.stringify(initialData);
    if (entityKey === prevEntityKey.current) return;  // same entity, user may have unsaved edits — don't clobber
    prevEntityKey.current = entityKey;
    setForm({ ...initialData });
  }, [initialData]);

  const set = (key: keyof T, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(form);
    } catch (e) {
      setSaveError(e instanceof Error ? e : new Error('Save failed'));
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, saving, saveError, set, handleSave };
}
