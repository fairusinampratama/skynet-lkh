import { ReactNode } from 'react';
import { cilCash, cilChartPie, cilSpeedometer, cilUser } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

export type NavigationItem = {
  name: string;
  to: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

export const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />
  },
  {
    name: 'Sirkulasi Harian',
    to: '/sirkulasi',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />
  },
  {
    name: 'Kasbon',
    to: '/kasbon',
    icon: <CIcon icon={cilCash} customClassName="nav-icon" />
  },
  {
    name: 'Users',
    to: '/users',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    adminOnly: true
  }
];
