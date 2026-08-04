'use client';

import { useState } from 'react';

export function AddLeadForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          first_name: firstName || null,
          last_name: lastName || null,
          company: company || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add lead');
      setPhone('');
      setFirstName('');
      setLastName('');
      setCompany('');
      setOpen(false);
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        + Add Lead
      </button>
    );
  }

  return (
    <div className="card grid grid-cols-1 gap-3 sm:grid-cols-5">
      <input className="input" placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <input className="input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input className="input" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn-primary" disabled={!phone || saving} onClick={submit}>
          Save
        </button>
        <button className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600 sm:col-span-5">{error}</p>}
    </div>
  );
}
