import { useEffect, useState } from 'react';
import { CSpinner } from '@coreui/react';
import { AppContent } from '../components/coreui/AppContent';
import { AppHeader } from '../components/coreui/AppHeader';
import { AppSidebar } from '../components/coreui/AppSidebar';
import { LoginScreen } from '../features/auth/LoginScreen';
import { useLkh } from '../context/LkhContext';

export function DefaultLayout() {
  const { authLoading, user } = useLkh();
  const [sidebarShow, setSidebarShow] = useState(() => window.matchMedia('(min-width: 992px)').matches);
  const [sidebarUnfoldable, setSidebarUnfoldable] = useState(() => localStorage.getItem('lkh_sidebar') === 'collapsed');

  useEffect(() => {
    localStorage.setItem('lkh_sidebar', sidebarUnfoldable ? 'collapsed' : 'expanded');
  }, [sidebarUnfoldable]);

  if (authLoading) {
    return <div className="d-flex min-vh-100 align-items-center justify-content-center"><CSpinner color="primary" /></div>;
  }

  if (!user) return <LoginScreen />;

  return (
    <div>
      <AppSidebar
        visible={sidebarShow}
        unfoldable={sidebarUnfoldable}
        onVisibleChange={setSidebarShow}
        onUnfoldableChange={setSidebarUnfoldable}
        onNavigate={() => {
          if (!window.matchMedia('(min-width: 992px)').matches) setSidebarShow(false);
        }}
      />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader onToggleSidebar={() => setSidebarShow((visible) => !visible)} />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
      </div>
    </div>
  );
}
