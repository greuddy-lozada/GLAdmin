export interface Bank {
  id: string;
  name: string;
}

export const VENEZUELA_BANKS: Bank[] = [
  { id: '0102', name: 'Banco de Venezuela' },
  { id: '0104', name: 'Banco Provincial' },
  { id: '0105', name: 'Mercantil' },
  { id: '0108', name: 'Banco Provincial' },
  { id: '0114', name: 'Bancaribe' },
  { id: '0115', name: 'Banco Exterior' },
  { id: '0116', name: 'Banco Occidental de Descuento' },
  { id: '0128', name: 'Banco Caroní' },
  { id: '0134', name: 'Banesco' },
  { id: '0137', name: 'Banco Sofitasa' },
  { id: '0138', name: 'Banco Plaza' },
  { id: '0146', name: 'Banco de la Gente' },
  { id: '0151', name: 'Banco Fondo Común' },
  { id: '0156', name: '100% Banco' },
  { id: '0157', name: 'Banco del Sur' },
  { id: '0163', name: 'Banco del Tesoro' },
  { id: '0166', name: 'Banco Agrícola de Venezuela' },
  { id: '0168', name: 'Bancrecer' },
  { id: '0171', name: 'Banco Activo' },
  { id: '0172', name: 'Bancamiga' },
  { id: '0173', name: 'Banco Internacional de Desarrollo' },
  { id: '0174', name: 'Banplus' },
  { id: '0175', name: 'Banco Bicentenario' },
  { id: '0176', name: 'Novo Banco' },
  { id: '0177', name: 'Banco de la Fuerza Armada Nacional' },
  { id: '0178', name: 'Banco Venezolano de Crédito' },
  { id: '0190', name: 'Banco Nacional de Crédito' },
  { id: '0191', name: 'Banco del Pueblo Soberano' },
];

export function getBankName(bankId: string): string {
  return VENEZUELA_BANKS.find((b) => b.id === bankId)?.name ?? bankId;
}
