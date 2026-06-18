'use client';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Redirect to home screen
    window.location.href = '/';
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#E7E5E2', color: '#111' }}>
      <i className="ti ti-loader" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>Redirecting to JobPilot...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
