import { ChangeEvent, useEffect, useRef } from 'react';
import {
  CBadge,
  CButton,
  CButtonGroup,
  CContainer,
  CFormInput,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilLockUnlocked, cilMenu, cilMoon, cilPlus, cilSpreadsheet, cilSun } from '@coreui/icons';
import { useLkh } from '../../context/LkhContext';

const padMonth = (month: number) => String(month).padStart(2, '0');

export function AppHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const {
    month,
    periodForm,
    periodExists,
    periodsLoaded,
    busy,
    darkMode,
    setDarkMode,
    setOpeningBalance,
    changePeriod,
    createMonth,
    toggleLock,
    exportMonth
  } = useLkh();

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current?.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0);
    };
    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, []);

  const periodValue = `${periodForm.year}-${padMonth(periodForm.month)}`;
  const status = !periodsLoaded ? 'MEMUAT' : periodExists ? month?.status || 'DRAFT' : 'BELUM DIBUAT';
  const statusColor = periodExists ? month?.status === 'DRAFT' ? 'success' : 'warning' : 'secondary';

  const handlePeriodChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [year, month] = event.target.value.split('-').map(Number);
    if (year && month) changePeriod({ year, month });
  };

  return (
    <CHeader position="sticky" className="mb-4 border-bottom" ref={headerRef}>
      <CContainer fluid className="gap-3 py-3">
        <CHeaderToggler className="d-lg-none" onClick={onToggleSidebar}>
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <div className="d-flex min-w-0 flex-column gap-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="h4 mb-0 fw-bold">{month?.label || `${periodForm.year}-${padMonth(periodForm.month)}`}</h1>
            <CBadge color={statusColor}>{status}</CBadge>
          </div>
          <div className="text-body-secondary small fw-semibold">Sirkulasi harian, kasbon, saldo otomatis, dan rekap analitik bulanan.</div>
        </div>

        <CHeaderNav className="ms-auto d-flex flex-wrap align-items-center gap-2">
          <CInputGroup className="period-picker">
            <CInputGroupText>Periode</CInputGroupText>
            <CFormInput type="month" value={periodValue} onChange={handlePeriodChange} />
          </CInputGroup>

          <CButton color="success" variant="outline" disabled={!month || busy} onClick={exportMonth} title="Export Excel">
            <CIcon icon={cilSpreadsheet} className="me-2" />
            Export Excel
          </CButton>

          <CButtonGroup role="group" aria-label="Tema">
            <CButton color={darkMode ? 'secondary' : 'primary'} variant={darkMode ? 'outline' : undefined} title="Light" onClick={() => setDarkMode(false)}>
              <CIcon icon={cilSun} />
            </CButton>
            <CButton color={darkMode ? 'primary' : 'secondary'} variant={darkMode ? undefined : 'outline'} title="Dark" onClick={() => setDarkMode(true)}>
              <CIcon icon={cilMoon} />
            </CButton>
          </CButtonGroup>

          {month && (
            <CButton color={month.status === 'DRAFT' ? 'warning' : 'secondary'} variant="outline" title={month.status === 'DRAFT' ? 'Kunci periode' : 'Buka periode'} onClick={toggleLock}>
              <CIcon icon={month.status === 'DRAFT' ? cilLockLocked : cilLockUnlocked} />
            </CButton>
          )}
        </CHeaderNav>
      </CContainer>

      {periodsLoaded && !periodExists && (
        <CContainer fluid className="border-top py-3">
          <div className="d-flex flex-column gap-2 rounded border border-warning-subtle bg-warning bg-opacity-10 p-3 flex-md-row">
            <CInputGroup>
              <CInputGroupText>Saldo awal</CInputGroupText>
              <CFormInput value={periodForm.openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} placeholder="0" />
            </CInputGroup>
            <CButton color="success" disabled={busy} onClick={createMonth} className="text-nowrap">
              <CIcon icon={cilPlus} className="me-2" />
              Buat Periode
            </CButton>
          </div>
        </CContainer>
      )}
    </CHeader>
  );
}
