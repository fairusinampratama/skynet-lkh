import { KasbonView } from '../../features/kasbon/KasbonView';
import { useLkh } from '../../context/LkhContext';

export default function KasbonPage() {
  const {
    locked,
    busy,
    kasbonForm,
    cashAdvances,
    kasbonFilters,
    kasbonMeta,
    kasbonLoading,
    setKasbonForm,
    saveKasbon,
    toggleKasbon,
    updateKasbon,
    deleteKasbon,
    uploadKasbonProof,
    deleteKasbonProof,
    changeKasbonFilters,
    changeKasbonPage,
    changeKasbonLimit
  } = useLkh();

  return (
    <KasbonView
      locked={locked}
      busy={busy}
      form={kasbonForm}
      items={cashAdvances}
      filters={kasbonFilters}
      meta={kasbonMeta}
      loading={kasbonLoading}
      onChange={setKasbonForm}
      onSave={saveKasbon}
      onToggle={toggleKasbon}
      onUpdate={updateKasbon}
      onDelete={deleteKasbon}
      onUploadProof={uploadKasbonProof}
      onDeleteProof={deleteKasbonProof}
      onFiltersChange={changeKasbonFilters}
      onPageChange={changeKasbonPage}
      onLimitChange={changeKasbonLimit}
    />
  );
}
