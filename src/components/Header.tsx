import Link from 'next/link';
import { cookies } from 'next/headers';
import { validSessionToken } from '@/lib/auth';
import { Nav } from './Nav';
import { LogoutButton } from './LogoutButton';

export async function Header() {
  const cookieStore = await cookies();
  const signedIn = await validSessionToken(cookieStore.get('jd_session')?.value, process.env.APP_SESSION_SECRET);

  return <header className="topbar"><div className="topbar-inner"><Link href="/" className="brand"><span className="brand-mark">JD</span><span>Job Search Command Center</span></Link><div className="top-actions">{signedIn && <><div className="desktop-nav"><Nav/></div><LogoutButton/></>}</div></div></header>;
}
