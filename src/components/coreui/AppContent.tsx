import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CAlert, CContainer, CSpinner } from '@coreui/react';
import { routes } from '../../routes';
import { useLkh } from '../../context/LkhContext';

export function AppContent() {
  const { message, clearMessage } = useLkh();

  return (
    <CContainer fluid className="px-3 px-xl-4">
      {message && <CAlert color="info" className="mb-3 fw-semibold" dismissible onClose={clearMessage}>{message}</CAlert>}
      <Suspense fallback={<div className="d-flex justify-content-center py-5"><CSpinner color="primary" /></div>}>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.element />} />
          ))}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  );
}
