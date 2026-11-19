function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function escCSV(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCSV(items) {
  const header = [
    'timestamp_iso',
    'download_mbps',
    'upload_mbps',
    'latency_ms',
    'jitter_ms',
    'loaded_latency_down_ms',
    'loaded_latency_up_ms',
    'bufferbloat_ms',
    'bufferbloat_grade',
    'connection_type',
  ];
  const rows = items.map((it) => [
    new Date(it.ts).toISOString(),
    it.download ?? '',
    it.upload ?? '',
    it.latency ?? '',
    it.jitter ?? '',
    it.downLoadedLatency ?? '',
    it.upLoadedLatency ?? '',
    it.bufferbloat ?? '',
    it.bufferbloatGrade ?? '',
    it.connectionType ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(escCSV).join(',')).join('\n');
  download(`pingtest-history-${stamp()}.csv`, csv, 'text/csv;charset=utf-8');
}

export function exportJSON(items) {
  const payload = {
    app: 'PingTest by RLC',
    developer: 'Rogue Logic Creations',
    originator: 'Farid Alfiyansah',
    exportedAt: new Date().toISOString(),
    entries: items,
  };
  download(
    `pingtest-history-${stamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}