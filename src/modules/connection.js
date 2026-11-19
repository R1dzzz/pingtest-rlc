export function getConnectionInfo() {
  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null;

  if (!conn) {
    return {
      supported: false,
      effectiveType: null,
      downlink: null,
      rtt: null,
      saveData: null,
      type: null,
    };
  }

  return {
    supported: true,
    effectiveType: conn.effectiveType || null,
    downlink: typeof conn.downlink === 'number' ? conn.downlink : null,
    rtt: typeof conn.rtt === 'number' ? conn.rtt : null,
    saveData: typeof conn.saveData === 'boolean' ? conn.saveData : null,
    type: conn.type || null,
  };
}

export function describeConnection(info) {
  if (!info || !info.supported) {
    return { type: 'Tidak tersedia', downlink: '—', rtt: '—' };
  }

  const type = info.effectiveType
    ? info.effectiveType.toUpperCase()
    : info.type
      ? info.type
      : 'Tidak diketahui';

  const downlink = info.downlink != null ? `~${info.downlink} Mbps` : '—';
  const rtt = info.rtt != null ? `~${info.rtt} ms` : '—';

  return { type, downlink, rtt };
}