import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { MoreVertical, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Page = 'dashboard' | 'help' | 'feedback' | 'settings';

interface TopBarProps {
  currentPage: Page;
  onRefresh?: () => void;
}

export default function TopBar({ currentPage, onRefresh }: TopBarProps) {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleLogout = async () => {
    sessionStorage.removeItem('userProfile');
    sessionStorage.removeItem('dailyLogs');
    await supabase.auth.signOut();
    router.push('/');
  };

  const go = (path: string) => {
    setShowMenu(false);
    router.push(path);
  };

  return (
    <div id="topbar">
      <img
        src="/images/Logo-Mobile.png"
        alt="Logo"
        style={{ cursor: 'pointer' }}
        onClick={() => router.push(user ? '/dashboard' : '/')}
      />
      <div className="menu-container" ref={menuRef}>
        {onRefresh && (
          <button onClick={onRefresh}>
            <RefreshCw size={34} />
          </button>
        )}
        <button onClick={() => setShowMenu(!showMenu)}>
          <MoreVertical size={36} />
        </button>
        {showMenu && (
          <div className="popup-menu">
            {!user && (
              <button onClick={() => go('/')}><p>Back to Home</p></button>
            )}
            {user && <button onClick={handleLogout}><p>Logout</p></button>}
            {user && currentPage !== 'settings' && (
              <button onClick={() => go('/settings')}><p>Settings</p></button>
            )}
            {user && currentPage !== 'dashboard' && (
              <button onClick={() => go('/dashboard')}><p>Dashboard</p></button>
            )}
            {currentPage !== 'help' && (
              <button onClick={() => go('/help')}><p>Help &amp; FAQ</p></button>
            )}
            {currentPage !== 'feedback' && (
              <button onClick={() => go('/feedback')}><p>Feedback</p></button>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
