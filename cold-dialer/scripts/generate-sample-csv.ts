// Generates a small sample leads CSV so you can try the import flow and
// power dialer without needing your own list yet.
import fs from 'node:fs';
import path from 'node:path';

const rows = [
  ['First Name', 'Last Name', 'Company', 'Title', 'Phone', 'Email', 'City', 'State'],
  ['Jordan', 'Blake', 'Riverside Fitness', 'Owner', '(214) 555-0142', 'jordan@riversidefit.example', 'Dallas', 'TX'],
  ['Casey', 'Nguyen', 'Summit CrossFit', 'General Manager', '(303) 555-0198', 'casey@summitcf.example', 'Denver', 'CO'],
  ['Morgan', 'Reyes', 'Elevate Studio', 'Owner', '(602) 555-0173', 'morgan@elevatestudio.example', 'Phoenix', 'AZ'],
  ['Taylor', 'Kim', 'Ironclad Gym', 'Operations Manager', '(415) 555-0111', 'taylor@ironclad.example', 'San Francisco', 'CA'],
  ['Alex', 'Patel', 'Peak Performance', 'Owner', '(312) 555-0166', 'alex@peakperf.example', 'Chicago', 'IL'],
];

const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

const outPath = path.resolve(__dirname, '..', 'sample_leads.csv');
fs.writeFileSync(outPath, csv, 'utf-8');
console.log(`Wrote ${rows.length - 1} sample leads to ${outPath}`);
