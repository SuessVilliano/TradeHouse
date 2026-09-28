export type QuickBattleEntry = {
  id: string;
  name: string;
  dashboardUrl: string;
  division?: 'trading' | 'prediction' | 'hybrid';
  platform?: 'matchtrader' | 'ctrader' | 'dxtrade' | 'dxfutures' | 'tickblaze' | 'other';
};

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(text: string) {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeQuickRoster(entries: QuickBattleEntry[]) {
  return toBase64Url(JSON.stringify(entries.slice(0, 8)));
}

export function decodeQuickRoster(encoded: string | null | undefined): QuickBattleEntry[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 8).filter((entry: any) =>
      entry &&
      typeof entry.id === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.dashboardUrl === 'string'
    );
  } catch {
    return [];
  }
}
