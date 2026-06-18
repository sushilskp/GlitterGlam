export function logUI(event: string, details?: any) {
  try {
    const entry = { event, details: details || null, ts: new Date().toISOString() };
    // Log to console for developer visibility
    // eslint-disable-next-line no-console
    console.log('[UI LOG]', entry);

    // Persist lightweight session logs to localStorage (capped)
    const key = 'ui_logs';
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    // keep last 500 entries
    localStorage.setItem(key, JSON.stringify(arr.slice(-500)));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('uiLogger error', err);
  }
}

export function readUILogs() {
  try {
    const raw = localStorage.getItem('ui_logs');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('readUILogs error', err);
    return [];
  }
}
