import type { Metadata } from 'next';
import { ConfiguratorClient } from '@/components/configurator/ConfiguratorClient';

export const metadata: Metadata = {
  title: 'ORICAN — 3D Studio',
  description: 'Place prints and 3D hardware on garments, snap them to the fabric, and export renders, videos and GLB files.',
};

export default function ConfiguratorPage() {
  return <ConfiguratorClient />;
}
