import { lazy } from 'react';

const DashboardPage = lazy(() => import('./views/dashboard/DashboardPage'));
const SirkulasiPage = lazy(() => import('./views/sirkulasi/SirkulasiPage'));
const KasbonPage = lazy(() => import('./views/kasbon/KasbonPage'));
const UsersPage = lazy(() => import('./views/users/UsersPage'));

export const routes = [
  { path: '/dashboard', name: 'Dashboard', element: DashboardPage },
  { path: '/sirkulasi', name: 'Sirkulasi Harian', element: SirkulasiPage },
  { path: '/kasbon', name: 'Kasbon', element: KasbonPage },
  { path: '/users', name: 'Users', element: UsersPage, adminOnly: true }
];
