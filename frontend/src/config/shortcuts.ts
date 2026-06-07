export interface ShortcutEntry {
  id: string;
  label: string;
  scope: string;
  defaultKeys: string;
  displayKeys: string;
}

export const defaultShortcuts: ShortcutEntry[] = [
  { id: 'pos.searchProduct', label: 'shortcuts.pos.searchProduct', scope: 'pos', defaultKeys: 'F1', displayKeys: 'F1' },
  { id: 'pos.searchCustomer', label: 'shortcuts.pos.searchCustomer', scope: 'pos', defaultKeys: 'F2', displayKeys: 'F2' },
  { id: 'pos.parkOrder', label: 'shortcuts.pos.parkOrder', scope: 'pos', defaultKeys: 'F8', displayKeys: 'F8' },
  { id: 'pos.payment', label: 'shortcuts.pos.payment', scope: 'pos', defaultKeys: 'F9', displayKeys: 'F9' },
  { id: 'pos.undo', label: 'shortcuts.pos.undo', scope: 'pos', defaultKeys: 'F10', displayKeys: 'F10' },
  { id: 'pos.refreshProducts', label: 'shortcuts.pos.refreshProducts', scope: 'pos', defaultKeys: 'F5', displayKeys: 'F5' },
  { id: 'pos.closeModal', label: 'shortcuts.pos.closeModal', scope: 'pos', defaultKeys: 'Escape', displayKeys: 'Esc' },
  { id: 'pos.quickAddCustomer', label: 'shortcuts.pos.quickAddCustomer', scope: 'pos', defaultKeys: 'ctrl+alt+c', displayKeys: 'Ctrl+Alt+C' },
];
