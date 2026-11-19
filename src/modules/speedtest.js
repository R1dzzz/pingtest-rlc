import SpeedTest from '@cloudflare/speedtest';

export function createSpeedTestEngine() {
  return new SpeedTest({
    autoStart: false,
    logAuxiliaryDiagnosticResults: true,
  });
}

function safe(fn, fallback = undefined) {
  try {
    const v = fn();
    return v === undefined || v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function readMetrics(engine) {
  const results = engine?.results;
  if (!results) {
    return {
      download: null, upload: null, latency: null, jitter: null,
      downLoadedLatency: null, upLoadedLatency: null,
      downLoadedJitter: null, upLoadedJitter: null,
      currentDownload: 0, currentUpload: 0,
      currentLatency: null, currentJitter: null,
    };
  }

  const summary = safe(() => results.getSummary(), {}) || {};

  return {
    download: num(summary.download),
    upload: num(summary.upload),
    latency: num(summary.latency),
    jitter: num(summary.jitter),
    downLoadedLatency: num(summary.downLoadedLatency),
    upLoadedLatency: num(summary.upLoadedLatency),
    downLoadedJitter: num(summary.downLoadedJitter),
    upLoadedJitter: num(summary.upLoadedJitter),
    currentDownload: safe(() => results.getDownloadBandwidth() / 1e6, 0) || 0,
    currentUpload: safe(() => results.getUploadBandwidth() / 1e6, 0) || 0,
    currentLatency: num(safe(() => results.getUnloadedLatency(), null)),
    currentJitter: num(safe(() => results.getUnloadedJitter(), null)),
  };
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function estimateBufferbloat(idleLatency, downLoadedLatency, upLoadedLatency) {
  const idle = num(idleLatency);
  const loadedDown = num(downLoadedLatency);
  const loadedUp = num(upLoadedLatency);
  if (idle === null) return null;

  const candidates = [loadedDown, loadedUp].filter((v) => v !== null);
  if (!candidates.length) return null;

  const worstLoaded = Math.max(...candidates);
  return Math.max(0, worstLoaded - idle);
}

export function bufferbloatGrade(ms) {
  if (ms === null) return null;
  if (ms < 30) return 'A+';
  if (ms < 60) return 'A';
  if (ms < 100) return 'B';
  if (ms < 200) return 'C';
  if (ms < 300) return 'D';
  return 'F';
}