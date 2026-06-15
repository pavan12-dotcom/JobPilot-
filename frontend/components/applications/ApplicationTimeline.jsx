'use client';
// components/applications/ApplicationTimeline.jsx
import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle, Clock, XCircle, Globe, FileText, Bot } from 'lucide-react';
import clsx from 'clsx';

const LOG_ICONS = {
  'Application created': FileText,
  'Auto-apply started': Bot,
  'Browser launched': Globe,
  'CAPTCHA detected': XCircle,
  'Application submitted': CheckCircle,
  default: Clock,
};

export default function ApplicationTimeline({ logs = [], status, createdAt }) {
  const statusSteps = ['QUEUED', 'APPLYING', 'APPLIED', 'INTERVIEW', 'OFFER'];
  const currentStep = statusSteps.indexOf(status);

  return (
    <div className="space-y-6">
      {/* Status progress */}
      <div>
        <h4 className="text-sm font-semibold text-text-muted mb-3">Progress</h4>
        <div className="flex items-center gap-1">
          {statusSteps.map((step, i) => {
            const isCompleted = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all',
                  isCompleted ? 'bg-primary text-white' : 'bg-border text-text-subtle',
                  isCurrent && 'ring-2 ring-primary/30',
                )}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={clsx(
                  'text-[10px] text-center',
                  isCompleted ? 'text-text-muted' : 'text-text-subtle',
                )}>{step}</span>
                {i < statusSteps.length - 1 && (
                  <div className={clsx(
                    'absolute h-0.5 w-full left-1/2 top-3.5',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event logs */}
      {logs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-muted mb-3">Automation Log</h4>
          <div className="space-y-2">
            {logs.map((log, i) => {
              const Icon = LOG_ICONS[log.event] || LOG_ICONS.default;
              const isFailed = log.event.toLowerCase().includes('fail') || log.event.toLowerCase().includes('captcha');

              return (
                <div
                  key={log.id || i}
                  className={clsx(
                    'flex items-start gap-3 p-2 rounded-lg text-sm',
                    isFailed ? 'bg-error/10' : 'bg-surface',
                  )}
                >
                  <Icon className={clsx(
                    'w-4 h-4 mt-0.5 shrink-0',
                    isFailed ? 'text-error' : 'text-text-muted',
                  )} />
                  <div className="flex-1">
                    <p className={isFailed ? 'text-error' : 'text-text-muted'}>{log.event}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="text-xs text-text-subtle font-mono mt-0.5">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-text-subtle shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
