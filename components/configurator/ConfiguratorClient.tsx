'use client';

import dynamic from 'next/dynamic';

// WebGL + DOM-dependent geometry generation: render on the client only.
const ConfiguratorApp = dynamic(() => import('./ConfiguratorApp'), {
  ssr: false,
  loading: () => <div style={{ position: 'fixed', inset: 0, background: '#141415' }} />,
});

export function ConfiguratorClient() {
  return <ConfiguratorApp />;
}
