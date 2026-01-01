import React, { useMemo } from 'react';
import { domainAdvisorService } from '../../domain/advisor/DomainAdvisorService';
import type { DomainAdvisorReport } from '../../domain/advisor/DomainAdvisorService';
import { Shield, CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface DomainAdvisorPanelProps {
  domain: string;
}

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded border border-gray-800 text-gray-400">
    {label}
  </span>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between text-[11px]">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-200">{value}</span>
  </div>
);

export const DomainAdvisorPanel: React.FC<DomainAdvisorPanelProps> = ({ domain }) => {
  const report: DomainAdvisorReport | null = useMemo(() => {
    if (!domain) return null;
    return domainAdvisorService.generateReport(domain);
  }, [domain]);

  if (!report) {
    return (
      <div className="border border-gray-800 rounded p-4 bg-black">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Domain Advisor</h2>
        <div className="text-[11px] text-gray-500">No domain selected.</div>
      </div>
    );
  }

  const availIcon = report.availability.likelyAvailable ? (
    <CheckCircle className="w-4 h-4 text-green-400" />
  ) : (
    <AlertCircle className="w-4 h-4 text-yellow-400" />
  );

  return (
    <div className="border border-gray-800 rounded p-4 bg-black">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-500">Domain Advisor</h2>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          {report.governance.tags.map(t => (
            <Tag key={t} label={t} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-800 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Name Evaluation</div>
            <div className="text-[11px] text-gray-400">{report.domain}</div>
          </div>
          <div className="space-y-1">
            <Stat label="Total Score" value={`${report.evaluation.totalScore}/100`} />
            <Stat label="Length Score" value={report.evaluation.lengthScore} />
            <Stat label="Structure Score" value={report.evaluation.structureScore} />
            <Stat label="Vowel Ratio" value={report.evaluation.vowelRatio} />
            <div className="text-[11px] text-gray-400">
              {report.evaluation.flags.length === 0 ? (
                <span className="text-gray-500">No flags</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {report.evaluation.flags.map(f => (
                    <Tag key={f} label={f} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-gray-800 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Availability</div>
            <div className="flex items-center gap-1">
              {availIcon}
              <span className={report.availability.likelyAvailable ? 'text-green-400 text-[11px]' : 'text-yellow-400 text-[11px]'}>
                {report.availability.likelyAvailable ? 'Likely Available' : 'Likely Taken'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <Stat label="TLD" value={report.availability.tld || 'unknown'} />
            <div className="text-[11px] text-gray-400">
              <div className="flex flex-wrap gap-1">
                {report.availability.reasoning.map(r => (
                  <Tag key={r} label={r} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-800 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">DNS Explanation</div>
            <div className="text-[11px] text-gray-400">{report.dns.domain}</div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {report.dns.records.map((rec, i) => (
                <div key={i} className="border border-gray-800 rounded p-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{rec.type}</span>
                    <span className="text-gray-200">{rec.host}</span>
                  </div>
                  <div className="text-gray-300 break-all">{rec.value}</div>
                  {typeof rec.priority === 'number' ? (
                    <div className="text-gray-500">prio {rec.priority}</div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="text-[11px] text-gray-400">
              <ul className="list-disc list-inside">
                {report.dns.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-gray-800 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-widest text-gray-500">Email Guidance (Zoho)</div>
            <Mail className="w-4 h-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {report.email.mx.map((rec, i) => (
                <div key={i} className="border border-gray-800 rounded p-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{rec.type}</span>
                    <span className="text-gray-200">{rec.host}</span>
                  </div>
                  <div className="text-gray-300 break-all">{rec.value}</div>
                  {typeof rec.priority === 'number' ? (
                    <div className="text-gray-500">prio {rec.priority}</div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="border border-gray-800 rounded p-2">
                <div className="text-gray-500">SPF</div>
                <div className="text-gray-300 break-all">{report.email.spf}</div>
              </div>
              <div className="border border-gray-800 rounded p-2">
                <div className="text-gray-500">DMARC</div>
                <div className="text-gray-300 break-all">{report.email.dmarc}</div>
              </div>
            </div>
            <div className="text-[11px] text-gray-400">
              <ul className="list-disc list-inside">
                {report.email.reasoning.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-gray-800 rounded p-3">
          <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Governance</div>
          <div className="flex flex-wrap gap-2">
            {report.governance.tags.map(t => (
              <Tag key={t} label={t} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.governance.constraints.map(c => (
              <Tag key={c} label={c} />
            ))}
          </div>
          <div className="mt-2 text-[11px] text-gray-500">Advisory only. No purchasing or DNS changes.</div>
        </div>
      </div>
    </div>
  );
};

export default DomainAdvisorPanel;
