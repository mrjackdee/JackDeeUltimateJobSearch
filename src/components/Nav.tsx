'use client';

import Link from 'next/link';
import { BriefcaseBusiness, ClipboardCheck, FilePlus2, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Nav() {
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Rundown', icon: BriefcaseBusiness },
    { href: '/applications', label: 'Applications', icon: ClipboardCheck },
    { href: '/import', label: 'Import', icon: FilePlus2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({ href, label, icon: Icon }) => { const active = href === '/' ? pathname === '/' : pathname.startsWith(href); return <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}><Icon size={18} aria-hidden="true"/><span>{label}</span></Link>; })}</nav>;
}
