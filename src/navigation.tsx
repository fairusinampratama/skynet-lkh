import { ReactNode } from 'react';
import { cilCash, cilChartPie, cilSpeedometer } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

export type NavigationItem = {
  name: string;
  to: string;
  icon: ReactNode;
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
  }
];
