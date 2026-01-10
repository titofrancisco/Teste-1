export enum DeviceCondition {
  NEW = 'Novo',
  OPEN_BOX = 'Open Box',
  EXCELLENT = 'Excelente',
  VERY_GOOD = 'Muito Bom',
  GOOD = 'Bom',
  USED = 'Usado'
}

export enum ContractType {
  ORDER = 'Encomenda',
  TWO_INSTALLMENTS = 'Duas Prestações',
  THREE_INSTALLMENTS = 'Três Prestações'
}

export interface BankRate {
  bank: string;
  rate: number;
  lastUpdate: string;
}

export interface InventoryItem {
  id: number;
  deviceType: string;
  brand: string;
  model: string;
  condition: DeviceCondition;
  storage: string;
  color: string;
  specs: string;
  purchasePrice: number;
  totalPurchasePrice: number;
  freight: number;
  totalFreight: number;
  customsExpenses: number;
  additionalExpenses: number;
  totalCost: number;
  timestamp: number;
  dateStr: string;
  isSold?: boolean;
}

export interface PaymentInstallment {
  percentage: number;
  amount: number;
  date: string;
  label: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: number;
  customerName: string;
  idNumber: string;
  phoneNumber: string;
  productTimestamp: number;
  productDetails: Partial<InventoryItem>;
  contractType: ContractType;
  sellingPrice: number;
  adjustedPrice: number;
  installments: PaymentInstallment[];
  date: string;
  timestamp: number;
  isFinal: boolean;
}

export interface SuggestionStore {
  deviceTypes: string[];
  brands: Record<string, string[]>;
  models: Record<string, string[]>;
  storages: string[];
  colors: string[];
}