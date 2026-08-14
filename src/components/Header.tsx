import Link from 'next/link';
import { Nav } from './Nav';

export function Header() {
  return <header className="topbar"><div className="topbar-inner"><Link href="/" className="brand"><span className="brand-mark">JD</span><span>Job Search Command Center</span></Link><div className="top-actions"><div style={{display:'none'}} aria-hidden="true"/><div className="desktop-nav"><Nav/></div></div></div></header>;
}
