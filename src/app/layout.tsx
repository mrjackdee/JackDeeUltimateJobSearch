import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = { title: 'Jack Dee Job Search Command Center', description: 'Personal career operating system for job discovery, fit analysis, ATS optimization and application tracking.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f5f6f8' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="shell"><Header/><main className="main">{children}</main><div className="mobile-nav"><Nav/></div></div></body></html>;
}
