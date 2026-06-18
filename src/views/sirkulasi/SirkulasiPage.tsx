import { LedgerView } from '../../features/ledger/LedgerView';
import { useLkh } from '../../context/LkhContext';

export default function SirkulasiPage() {
  const {
    locked,
    canManage,
    busy,
    entryForm,
    entryCategories,
    categories,
    ledger,
    ledgerFilters,
    ledgerMeta,
    ledgerLoading,
    setEntryForm,
    saveEntry,
    updateEntry,
    deleteEntry,
    uploadEntryProof,
    deleteEntryProof,
    changeLedgerFilters,
    changeLedgerPage,
    changeLedgerLimit
  } = useLkh();

  return (
    <LedgerView
      locked={locked || !canManage}
      busy={busy}
      form={entryForm}
      entryCategories={entryCategories}
      filterCategories={categories}
      entries={ledger}
      filters={ledgerFilters}
      meta={ledgerMeta}
      loading={ledgerLoading}
      onChange={setEntryForm}
      onSave={saveEntry}
      onUpdate={updateEntry}
      onDelete={deleteEntry}
      onUploadProof={uploadEntryProof}
      onDeleteProof={deleteEntryProof}
      onFiltersChange={changeLedgerFilters}
      onPageChange={changeLedgerPage}
      onLimitChange={changeLedgerLimit}
    />
  );
}
