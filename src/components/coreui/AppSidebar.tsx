import { NavLink } from 'react-router-dom';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CNavItem,
  CCloseButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilWallet } from '@coreui/icons';
import { navigation } from '../../navigation';
import { useLkh } from '../../context/LkhContext';

export function AppSidebar({
  visible,
  unfoldable,
  onVisibleChange,
  onUnfoldableChange,
  onNavigate
}: {
  visible: boolean;
  unfoldable: boolean;
  onVisibleChange: (visible: boolean) => void;
  onUnfoldableChange: (value: boolean | ((current: boolean) => boolean)) => void;
  onNavigate: () => void;
}) {
  const { darkMode } = useLkh();
  const closeSidebar = () => {
    onUnfoldableChange(false);
    onVisibleChange(false);
  };

  return (
    <CSidebar
      className="border-end"
      colorScheme={darkMode ? 'dark' : 'light'}
      position="fixed"
      unfoldable={unfoldable}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand className="d-flex align-items-center gap-2 text-decoration-none" as={NavLink} to="/dashboard">
          <span className="brand-mark d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36 }}>
            <CIcon icon={cilWallet} size="lg" />
          </span>
          <span className="sidebar-brand-full fw-bold">LKH SkyNet</span>
        </CSidebarBrand>
        <CCloseButton className="d-lg-none" dark={darkMode} onClick={closeSidebar} />
      </CSidebarHeader>

      <CSidebarNav>
        {navigation.map((item) => (
          <CNavItem key={item.to}>
            <NavLink className="nav-link" to={item.to} onClick={onNavigate}>
              {item.icon}
              {item.name}
            </NavLink>
          </CNavItem>
        ))}
      </CSidebarNav>

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={closeSidebar} />
      </CSidebarFooter>
    </CSidebar>
  );
}
