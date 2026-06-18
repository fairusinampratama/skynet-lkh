import { useState } from 'react';
import { CAlert, CButton, CCard, CCardBody, CFormInput, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react';
import { Lock, User } from 'lucide-react';
import { useLkh } from '../../context/LkhContext';

export function LoginScreen() {
  const { busy, message, login, clearMessage } = useLkh();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(username, password).catch(() => undefined);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <CCard className="w-100 shadow-sm" style={{ maxWidth: 420 }}>
        <CCardBody className="p-4">
          <div className="mb-4">
            <div className="h4 fw-bold mb-1">LKH SkyNet</div>
            <div className="text-body-secondary fw-semibold small">Masuk untuk membuka dashboard kas harian.</div>
          </div>
          {message && <CAlert color="danger" dismissible onClose={clearMessage}>{message}</CAlert>}
          <form className="d-grid gap-3" onSubmit={submit}>
            <CInputGroup>
              <CInputGroupText><User size={16} /></CInputGroupText>
              <CFormInput autoFocus value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" />
            </CInputGroup>
            <CInputGroup>
              <CInputGroupText><Lock size={16} /></CInputGroupText>
              <CFormInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" />
            </CInputGroup>
            <CButton color="primary" type="submit" disabled={busy || !username || !password}>
              {busy && <CSpinner size="sm" className="me-2" />}
              Login
            </CButton>
          </form>
        </CCardBody>
      </CCard>
    </main>
  );
}
