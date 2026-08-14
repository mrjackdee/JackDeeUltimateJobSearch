from pathlib import Path

# Lint remediations
p = Path('src/components/DashboardClient.tsx')
s = p.read_text()
s = s.replace("Today's new jobs", "Today&apos;s new jobs")
p.write_text(s)

p = Path('src/lib/storage/state.ts')
s = p.read_text()
s = s.replace('function useLocal(): boolean {', 'function shouldUseLocalStorage(): boolean {')
s = s.replace('return useLocal() ? readLocal() : readDrive();', 'return shouldUseLocalStorage() ? readLocal() : readDrive();')
s = s.replace('return useLocal() ? writeLocal(state) : writeDrive(state);', 'return shouldUseLocalStorage() ? writeLocal(state) : writeDrive(state);')
p.write_text(s)

# Mobile-first navigation polish
p = Path('src/components/Nav.tsx')
s = p.read_text()
if "'use client';" not in s:
    s = s.replace("import Link from 'next/link';", "'use client';\n\nimport Link from 'next/link';")
if "usePathname" not in s:
    s = s.replace("import { BriefcaseBusiness, ClipboardCheck, FilePlus2, Settings } from 'lucide-react';", "import { BriefcaseBusiness, ClipboardCheck, FilePlus2, Settings } from 'lucide-react';\nimport { usePathname } from 'next/navigation';")
if 'const pathname = usePathname();' not in s:
    s = s.replace('export function Nav() {\n  const items = [', 'export function Nav() {\n  const pathname = usePathname();\n  const items = [')
old = '  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-item"><Icon size={18} aria-hidden="true"/><span>{label}</span></Link>)}</nav>;'
new = '  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({ href, label, icon: Icon }) => { const active = href === \'/\' ? pathname === \'/\' : pathname.startsWith(href); return <Link key={href} href={href} className={`nav-item ${active ? \'active\' : \'\'}`} aria-current={active ? \'page\' : undefined}><Icon size={18} aria-hidden="true"/><span>{label}</span></Link>; })}</nav>;'
if old in s:
    s = s.replace(old, new)
p.write_text(s)

p = Path('src/app/globals.css')
s = p.read_text()
s = s.replace('body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }', 'body { margin: 0; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }')
s = s.replace('.nav-item { display: grid; place-items: center; align-content: center; gap: 2px; min-width: 0; color: #5a6370; font-size: 10px; font-weight: 750; border-radius: 10px; }', '.nav-item { display: grid; place-items: center; align-content: center; gap: 2px; min-width: 0; min-height: 48px; color: #5a6370; font-size: 10px; font-weight: 750; border-radius: 10px; }')
if '.nav-item.active {' not in s:
    s = s.replace('.nav-item:hover { background: var(--surface-2); color: var(--text); }', '.nav-item:hover { background: var(--surface-2); color: var(--text); }\n.nav-item.active { color: var(--accent); background: var(--accent-soft); }\n.nav-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }')
mobile = '''@media (max-width: 479px) {\n  .main { width: min(100% - 24px, 1180px); padding-top: 18px; }\n  .topbar-inner { min-height: 60px; }\n  .brand { gap: 9px; font-size: 14px; }\n  .brand-mark { width: 34px; height: 34px; border-radius: 10px; }\n  h1 { font-size: clamp(27px, 9vw, 38px); }\n  .hero-actions { display: grid; grid-template-columns: 1fr; }\n  .hero-actions .button { width: 100%; }\n  .card-actions { grid-template-columns: 1fr; }\n  .card-actions .button { width: 100%; min-height: 44px; }\n  .kv-row { grid-template-columns: 1fr; gap: 3px; }\n  .section-head { align-items: start; }\n  .section-head > p { white-space: nowrap; }\n}\n'''
if mobile not in s:
    s = s.replace('@media (min-width: 680px) {', mobile + '@media (min-width: 680px) {')
p.write_text(s)
