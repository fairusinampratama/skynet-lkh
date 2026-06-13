import { lazy } from 'react';

const DashboardPage = lazy(() => import('./views/dashboard/DashboardPage'));
const SirkulasiPage = lazy(() => import('./views/sirkulasi/SirkulasiPage'));
const KasbonPage = lazy(() => import('./views/kasbon/KasbonPage'));

export const routes = [
  { path: '/dashboard', name: 'Dashboard', element: DashboardPage },
  { path: '/sirkulasi', name: 'Sirkulasi Harian', element: SirkulasiPage },
  { path: '/kasbon', name: 'Kasbon', element: KasbonPage }
];
