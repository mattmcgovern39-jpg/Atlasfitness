'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IMPORTABLE_FIELDS, FIELD_LABELS, type ImportableField } from '@/lib/csv';

interface PreviewResponse {
  headers: string[];
  mapping: Record<ImportableField, string | null>;
  sampleRows: Record<string, string>[];
  rowCount: number;
  parseErrors: string[];
}

interface CommitResponse {
  batch: {
    row_count: number;
    inserted_count: number;
    duplicate_count: number;
    error_count: number;
  };
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function ImportWizard() {
  const router = useRouter();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<ImportableField, string | null>>(
    {} as Record<ImportableField, string | null>
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResponse['batch'] | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    if (file.size > MAX_FILE_BYTES) {
      setError('File is too large (max 20MB).');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a .csv file.');
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setFilename(file.name);
    setBusy(true);
    try {
      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to parse CSV');
      setPreview(data);
      setMapping(data.mapping);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (!csvText) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, filename, mapping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setResult(data.batch);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-900">Import Complete</h2>
        <ul className="text-sm text-slate-700">
          <li>Rows in file: {result.row_count}</li>
          <li className="text-emerald-700">Leads added: {result.inserted_count}</li>
          <li className="text-amber-700">Duplicates skipped (matched existing phone): {result.duplicate_count}</li>
          {result.error_count > 0 && <li className="text-red-700">Rows with errors: {result.error_count}</li>}
        </ul>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => router.push('/leads')}>
            View Leads
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setCsvText(null);
              setPreview(null);
              setResult(null);
            }}
          >
            Import Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!preview && (
        <div className="card">
          <label className="label">CSV File</label>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
          />
          <p className="mt-2 text-xs text-slate-500">
            Any column headers work — we&apos;ll try to auto-match them, and you can adjust the
            mapping before anything is imported. A phone column is required. Everything stays on
            this machine.
          </p>
        </div>
      )}

      {error && <div className="card border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      {preview && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Map Columns</h2>
            <span className="text-xs text-slate-500">{preview.rowCount} rows detected</span>
          </div>

          {preview.parseErrors.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              {preview.parseErrors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {IMPORTABLE_FIELDS.map((field) => (
              <div key={field}>
                <label className="label">{FIELD_LABELS[field]}</label>
                <select
                  className="input"
                  value={mapping[field] ?? ''}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [field]: e.target.value || null }))
                  }
                >
                  <option value="">— Not Mapped —</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Preview (first rows)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {IMPORTABLE_FIELDS.map((f) => (
                      <th key={f} className="px-2 py-1 text-left font-medium text-slate-600">
                        {FIELD_LABELS[f]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      {IMPORTABLE_FIELDS.map((f) => (
                        <td key={f} className="px-2 py-1 text-slate-700">
                          {mapping[f] ? row[mapping[f] as string] ?? '' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn-primary"
              disabled={busy || !mapping.phone}
              onClick={handleImport}
            >
              {busy ? 'Importing…' : `Import ${preview.rowCount} Leads`}
            </button>
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setCsvText(null);
              }}
            >
              Start Over
            </button>
          </div>
          {!mapping.phone && (
            <p className="text-xs text-red-600">Map a Phone column to continue.</p>
          )}
        </div>
      )}
    </div>
  );
}
