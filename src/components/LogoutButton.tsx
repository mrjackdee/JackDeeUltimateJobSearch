'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return <form action="/api/auth/logout" method="post">
    <button className="button logout-button" type="submit" aria-label="Log out of Job Search Command Center">
      <LogOut size={16} aria-hidden="true"/>
      <span>Log out</span>
    </button>
  </form>;
}
