'use client';
// components/applications/StatusBadge.jsx
import clsx from 'clsx';

const STATUS_CONFIG = {
  QUEUED:       { label: 'Queued',       class: 'badge-gray' },
  APPLYING:     { label: 'Applying…',    class: 'badge-blue' },
  APPLIED:      { label: 'Applied',      class: 'badge-blue' },
  NEEDS_REVIEW: { label: 'Needs Review', class: 'badge-orange' },
  INTERVIEW:    { label: 'Interview',    class: 'badge-green' },
  OFFER:        { label: '🎉 Offer',     class: 'badge-green' },
  REJECTED:     { label: 'Rejected',     class: 'badge-red' },
  FAILED:       { label: 'Failed',       class: 'badge-red' },
  WITHDRAWN:    { label: 'Withdrawn',    class: 'badge-gray' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, class: 'badge-gray' };
  return <span className={config.class}>{config.label}</span>;
}
