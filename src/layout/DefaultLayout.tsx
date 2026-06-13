import { useEffect, useState } from 'react';
import { AppContent } from '../components/coreui/AppContent';
import { AppHeader } from '../components/coreui/AppHeader';
import { AppSidebar } from '../components/coreui/AppSidebar';

export function DefaultLayout() {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [sidebarUnfoldable, setSidebarUnfoldable] = useState(() => localStorage.getItem('lkh_sidebar') === 'collapsed');

  useEffect(() => {
    localStorage.setItem('lkh_sidebar', sidebarUnfoldable ? 'collapsed' : 'expanded');
  }, [sidebarUnfoldable]);

  return (
    <div>
      <AppSidebar
        visible={sidebarShow}
        unfoldable={sidebarUnfoldable}
        onVisibleChange={setSidebarShow}
        onUnfoldableChange={setSidebarUnfoldable}
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
