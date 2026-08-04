import { ImportWizard } from '@/components/ImportWizard';

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Import Leads</h1>
        <p className="text-sm text-slate-500">
          Upload a CSV of leads. Everything is parsed and stored locally — nothing is uploaded
          anywhere else.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
