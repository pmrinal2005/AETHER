'use client';
// Color-coded trust/status dot (feature 12 + 19 color scheme).
const COLORS = {
  active: '#22b14c',
  online: '#22b14c',
  trusted: '#22b14c',
  busy: '#e8b000',
  review: '#e8b000',
  suspended: '#e07000',
  probation: '#e07000',
  revoked: '#c1272d',
  blocked: '#c1272d',
  offline: '#9a9a9a',
};

export default function StatusDot({ status = 'offline', title }) {
  const color = COLORS[status] || COLORS.offline;
  return (
    <span
      className="status-dot"
      style={{ backgroundColor: color }}
      title={title || status}
    />
  );
}
