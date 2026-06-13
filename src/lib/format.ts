export const rupiah = (value: number) => `Rp ${Math.round(value || 0).toLocaleString('id-ID')}`;

export const today = () => new Date().toISOString().slice(0, 10);
