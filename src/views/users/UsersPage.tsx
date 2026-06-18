import { useEffect, useState } from 'react';
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow
} from '@coreui/react';
import { Navigate } from 'react-router-dom';
import { Plus, RotateCcw, UserX } from 'lucide-react';
import { useLkh } from '../../context/LkhContext';
import { User, UserRole } from '../../types';

type UserForm = { username: string; name: string; role: UserRole; password: string; active: boolean };

const emptyForm: UserForm = { username: '', name: '', role: 'READER', password: '', active: true };

export default function UsersPage() {
  const { canManage, busy, user, loadUsers, createUser, updateUser, resetUserPassword, setUserActive } = useLkh();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const refresh = async () => setUsers(await loadUsers());

  useEffect(() => {
    if (canManage) refresh().catch(() => undefined);
  }, [canManage]);

  if (!canManage) return <Navigate to="/dashboard" replace />;

  const saveCreate = async () => {
    await createUser(form);
    setForm(emptyForm);
    await refresh();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateUser(editing.id, form);
    setEditing(null);
    setForm(emptyForm);
    await refresh();
  };

  const openEdit = (item: User) => {
    setEditing(item);
    setForm({ username: item.username, name: item.name, role: item.role, password: '', active: item.active });
  };

  const saveReset = async () => {
    if (!resetting) return;
    await resetUserPassword(resetting.id, resetPassword);
    setResetting(null);
    setResetPassword('');
    await refresh();
  };

  return (
    <div className="d-grid gap-3">
      <CCard>
        <CCardBody>
          <div className="mb-3 d-flex align-items-center justify-content-between gap-3">
            <div>
              <div className="h5 fw-bold mb-1">User Management</div>
              <div className="text-body-secondary small fw-semibold">Kelola akun admin dan reader.</div>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[160px_180px_130px_180px_auto]">
            <CFormInput placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <CFormInput placeholder="Nama" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <CFormSelect value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
              <option value="READER">Reader</option>
              <option value="ADMIN">Admin</option>
            </CFormSelect>
            <CFormInput type="password" placeholder={editing ? 'Kosongkan' : 'Password'} value={form.password} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <CButton color={editing ? 'primary' : 'success'} disabled={busy || !form.username || !form.name || (!editing && !form.password)} onClick={editing ? saveEdit : saveCreate}>
              <Plus size={16} className="me-2" />
              {editing ? 'Simpan' : 'Tambah'}
            </CButton>
          </div>
          {editing && <CButton color="secondary" variant="outline" className="mt-2" onClick={() => { setEditing(null); setForm(emptyForm); }}>Batal edit</CButton>}
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody className="p-0">
          <CTable responsive hover className="mb-0 align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Username</CTableHeaderCell>
                <CTableHeaderCell>Nama</CTableHeaderCell>
                <CTableHeaderCell>Role</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Aksi</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {users.map((item) => (
                <CTableRow key={item.id}>
                  <CTableDataCell className="fw-bold">{item.username}</CTableDataCell>
                  <CTableDataCell>{item.name}</CTableDataCell>
                  <CTableDataCell><CBadge color={item.role === 'ADMIN' ? 'primary' : 'secondary'}>{item.role}</CBadge></CTableDataCell>
                  <CTableDataCell><CBadge color={item.active ? 'success' : 'warning'}>{item.active ? 'Aktif' : 'Nonaktif'}</CBadge></CTableDataCell>
                  <CTableDataCell className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <CButton size="sm" color="primary" variant="outline" onClick={() => openEdit(item)}>Edit</CButton>
                      <CButton size="sm" color="secondary" variant="outline" onClick={() => setResetting(item)}>
                        <RotateCcw size={14} />
                      </CButton>
                      <CButton size="sm" color={item.active ? 'warning' : 'success'} variant="outline" disabled={item.id === user?.id} onClick={async () => { await setUserActive(item.id, !item.active); await refresh(); }}>
                        <UserX size={14} />
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal visible={Boolean(resetting)} onClose={() => setResetting(null)}>
        <CModalHeader><CModalTitle>Reset Password</CModalTitle></CModalHeader>
        <CModalBody>
          <CFormInput type="password" label={`Password baru untuk ${resetting?.username || ''}`} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setResetting(null)}>Batal</CButton>
          <CButton color="primary" disabled={busy || !resetPassword} onClick={saveReset}>Reset</CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
