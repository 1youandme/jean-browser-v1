import type { GovernanceTag } from '../../types';

export type DomainString = string;

export interface DomainNameEvaluation {
  domain: DomainString;
  lengthScore: number;
  structureScore: number;
  vowelRatio: number;
  flags: string[];
  totalScore: number;
}

export interface AvailabilityHeuristic {
  domain: DomainString;
  tld: string;
  likelyAvailable: boolean;
  reasoning: string[];
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';
  host: string;
  value: string;
  priority?: number;
}

export interface DNSExplanation {
  domain: DomainString;
  records: DNSRecord[];
  notes: string[];
}

export interface EmailGuidance {
  domain: DomainString;
  provider: 'zoho';
  mx: DNSRecord[];
  spf: string;
  dmarc: string;
  reasoning: string[];
}

export interface DomainAdvisorReport {
  domain: DomainString;
  evaluation: DomainNameEvaluation;
  availability: AvailabilityHeuristic;
  dns: DNSExplanation;
  email: EmailGuidance;
  governance: {
    tags: GovernanceTag[];
    constraints: Array<'advisory_only' | 'no_purchase' | 'no_dns_change' | 'local_only'>;
  };
}

export interface DomainAdvisorService {
  evaluateName(domain: DomainString): DomainNameEvaluation;
  heuristicAvailability(domain: DomainString): AvailabilityHeuristic;
  explainDNS(domain: DomainString): DNSExplanation;
  emailGuidanceZoho(domain: DomainString): EmailGuidance;
  generateReport(domain: DomainString): DomainAdvisorReport;
}

export const DomainAdvisorGovernance = {
  tags: ['advisory', 'review_only', 'no_execution', 'local'] as GovernanceTag[],
  constraints: ['advisory_only', 'no_purchase', 'no_dns_change', 'local_only'] as Array<
    'advisory_only' | 'no_purchase' | 'no_dns_change' | 'local_only'
  >
};

function parseDomain(domain: DomainString): { name: string; tld: string } {
  const s = domain.trim().toLowerCase();
  const parts = s.split('.');
  if (parts.length < 2) return { name: s, tld: '' };
  const tld = parts[parts.length - 1];
  const name = parts.slice(0, parts.length - 1).join('.');
  return { name, tld };
}

function scoreLength(len: number): number {
  if (len < 3) return 20;
  if (len <= 6) return 95;
  if (len <= 12) return 85;
  if (len <= 24) return 70;
  if (len <= 63) return 55;
  return 20;
}

function scoreStructure(name: string): { score: number; flags: string[] } {
  let flags: string[] = [];
  const hasHyphen = name.includes('-');
  const digits = (name.match(/[0-9]/g) || []).length;
  const letters = (name.match(/[a-z]/g) || []).length;
  const digitRatio = letters === 0 ? 1 : digits / (letters + digits);
  const hyphenPenalty = hasHyphen ? 10 : 0;
  const digitPenalty = digitRatio > 0.3 ? 20 : digitRatio > 0.1 ? 10 : 0;
  if (hasHyphen) flags.push('hyphen_present');
  if (digitRatio > 0.3) flags.push('numeric_heavy');
  const repeats = /(.)\1{2,}/.test(name);
  const repeatPenalty = repeats ? 10 : 0;
  if (repeats) flags.push('repetition');
  const base = 100 - hyphenPenalty - digitPenalty - repeatPenalty;
  return { score: Math.max(20, base), flags };
}

function vowelRatio(name: string): number {
  const v = (name.match(/[aeiou]/g) || []).length;
  const c = (name.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
  const total = v + c;
  return total === 0 ? 0 : v / total;
}

function evaluateName(domain: DomainString): DomainNameEvaluation {
  const { name } = parseDomain(domain);
  const lenScore = scoreLength(name.length);
  const struct = scoreStructure(name);
  const vRatio = vowelRatio(name);
  const pronouncePenalty = vRatio < 0.25 || vRatio > 0.6 ? 10 : 0;
  const total = Math.max(0, Math.min(100, Math.round((lenScore * 0.4) + (struct.score * 0.5) + ((100 - pronouncePenalty) * 0.1))));
  const flags = [...struct.flags];
  if (pronouncePenalty > 0) flags.push('pronounceability');
  if (name.length > 63) flags.push('too_long');
  return {
    domain,
    lengthScore: lenScore,
    structureScore: struct.score,
    vowelRatio: Number(vRatio.toFixed(2)),
    flags,
    totalScore: total
  };
}

function heuristicAvailability(domain: DomainString): AvailabilityHeuristic {
  const { name, tld } = parseDomain(domain);
  const reserved = new Set(['google', 'amazon', 'apple', 'microsoft', 'facebook', 'openai']);
  if (reserved.has(name)) {
    return { domain, tld, likelyAvailable: false, reasoning: ['reserved_or_well_known'] };
  }
  const short = name.length <= 5;
  const popularTld = new Set(['com', 'net', 'org', 'io', 'ai']).has(tld);
  const reasoning: string[] = [];
  if (short && popularTld) {
    reasoning.push('short_name_popular_tld');
    return { domain, tld, likelyAvailable: false, reasoning };
  }
  if (!popularTld) reasoning.push('less_popular_tld');
  if (name.includes('-')) reasoning.push('hyphenated_name');
  const digits = (name.match(/[0-9]/g) || []).length;
  if (digits > 0) reasoning.push('contains_digits');
  return { domain, tld, likelyAvailable: true, reasoning };
}

function explainDNS(domain: DomainString): DNSExplanation {
  const root = domain;
  const records: DNSRecord[] = [
    { type: 'A', host: '@', value: '192.0.2.1' },
    { type: 'AAAA', host: '@', value: '2001:db8::1' },
    { type: 'CNAME', host: 'www', value: '@' }
  ];
  const notes = [
    'A maps root to IPv4.',
    'AAAA maps root to IPv6.',
    'CNAME points www to the root.'
  ];
  return { domain: root, records, notes };
}

function emailGuidanceZoho(domain: DomainString): EmailGuidance {
  const mx: DNSRecord[] = [
    { type: 'MX', host: '@', value: 'mx.zoho.com', priority: 10 },
    { type: 'MX', host: '@', value: 'mx2.zoho.com', priority: 20 },
    { type: 'MX', host: '@', value: 'mx3.zoho.com', priority: 50 }
  ];
  const spf = 'v=spf1 include:zoho.com ~all';
  const dmarc = 'v=DMARC1; p=none; rua=mailto:dmarc@' + domain;
  const reasoning = [
    'Primary and backup MX for Zoho.',
    'SPF includes Zoho.',
    'DMARC in monitor mode.'
  ];
  return { domain, provider: 'zoho', mx, spf, dmarc, reasoning };
}

export class DomainAdvisor implements DomainAdvisorService {
  evaluateName(domain: DomainString): DomainNameEvaluation {
    return evaluateName(domain);
  }
  heuristicAvailability(domain: DomainString): AvailabilityHeuristic {
    return heuristicAvailability(domain);
  }
  explainDNS(domain: DomainString): DNSExplanation {
    return explainDNS(domain);
  }
  emailGuidanceZoho(domain: DomainString): EmailGuidance {
    return emailGuidanceZoho(domain);
  }
  generateReport(domain: DomainString): DomainAdvisorReport {
    const evaluation = this.evaluateName(domain);
    const availability = this.heuristicAvailability(domain);
    const dns = this.explainDNS(domain);
    const email = this.emailGuidanceZoho(domain);
    return {
      domain,
      evaluation,
      availability,
      dns,
      email,
      governance: {
        tags: DomainAdvisorGovernance.tags,
        constraints: DomainAdvisorGovernance.constraints
      }
    };
  }
}

export const domainAdvisorService: DomainAdvisorService = new DomainAdvisor();
