export type BattleFormat = 'spotlight' | 'sprint' | 'target' | 'prop' | 'league';

export type BattleRuleConfig = {
  format: BattleFormat;
  label: string;
  durationSeconds?: number;
  targetReturnPct?: number;
  profitTargetPct?: number;
  maxDrawdownPct?: number;
  accountSize?: number;
  endsAt?: string | null;
};

export const BATTLE_PRESETS: Record<BattleFormat, BattleRuleConfig> = {
  spotlight: {
    format: 'spotlight',
    label: 'Spotlight Session',
  },
  sprint: {
    format: 'sprint',
    label: 'Sprint',
    durationSeconds: 60 * 60,
  },
  target: {
    format: 'target',
    label: 'Target Race',
    targetReturnPct: 5,
  },
  prop: {
    format: 'prop',
    label: 'Prop Challenge',
    profitTargetPct: 8,
    maxDrawdownPct: 5,
  },
  league: {
    format: 'league',
    label: 'Monthly League',
  },
};

export function battleObjective(rule: BattleRuleConfig) {
  switch (rule.format) {
    case 'sprint':
      return 'Highest verified return when the clock expires';
    case 'target':
      return 'First verified account to +' + String(rule.targetReturnPct ?? 5) + '%';
    case 'prop':
      return 'Pass the Hybrid challenge · target ' + String(rule.profitTargetPct ?? 8) + '% · max DD ' + String(rule.maxDrawdownPct ?? 5) + '%';
    case 'league':
      return 'Monthly verified leaderboard · no forced daily trade';
    case 'spotlight':
    default:
      return 'Live spotlight · producer ends the session';
  }
}

export function battleClock(rule: BattleRuleConfig, elapsedSeconds: number, now = Date.now()) {
  if (rule.format === 'sprint' && rule.durationSeconds) {
    const seconds = Math.max(0, rule.durationSeconds - elapsedSeconds);
    return { seconds, label: 'TIME LEFT', expired: seconds <= 0 };
  }

  if (rule.format === 'league' && rule.endsAt) {
    const seconds = Math.max(0, Math.floor((Date.parse(rule.endsAt) - now) / 1000));
    return { seconds, label: 'SEASON LEFT', expired: seconds <= 0 };
  }

  return {
    seconds: elapsedSeconds,
    label: rule.format === 'spotlight' ? 'SESSION TIME' : 'RACE TIME',
    expired: false,
  };
}

export function encodeRule(rule: BattleRuleConfig) {
  const params = new URLSearchParams();
  params.set('format', rule.format);
  params.set('ruleLabel', rule.label);
  if (rule.durationSeconds != null) params.set('duration', String(rule.durationSeconds));
  if (rule.targetReturnPct != null) params.set('target', String(rule.targetReturnPct));
  if (rule.profitTargetPct != null) params.set('profitTarget', String(rule.profitTargetPct));
  if (rule.maxDrawdownPct != null) params.set('maxDD', String(rule.maxDrawdownPct));
  if (rule.accountSize != null) params.set('accountSize', String(rule.accountSize));
  if (rule.endsAt) params.set('endsAt', rule.endsAt);
  return params;
}

export function parseRule(params: URLSearchParams): BattleRuleConfig {
  const format = (params.get('format') || 'spotlight') as BattleFormat;
  const preset = BATTLE_PRESETS[format] || BATTLE_PRESETS.spotlight;
  const numeric = (key: string, fallback?: number) => {
    const raw = params.get(key);
    if (!raw) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    ...preset,
    label: params.get('ruleLabel') || preset.label,
    durationSeconds: numeric('duration', preset.durationSeconds),
    targetReturnPct: numeric('target', preset.targetReturnPct),
    profitTargetPct: numeric('profitTarget', preset.profitTargetPct),
    maxDrawdownPct: numeric('maxDD', preset.maxDrawdownPct),
    accountSize: numeric('accountSize', preset.accountSize),
    endsAt: params.get('endsAt') || preset.endsAt || null,
  };
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':');
}
