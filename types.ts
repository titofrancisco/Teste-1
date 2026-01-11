
export enum DeviceCondition {
  NEW = 'Novo',
  OPEN_BOX = 'Caixa Aberta',
  EXCELLENT = 'Excelente',
  VERY_GOOD = 'Muito Bom',
  GOOD = 'Bom',
  USED = 'Usado'
}

export enum ContractType {
  ORDER = 'Por encomenda',
  TWO_INSTALLMENTS = 'Por Duas Prestações',
  THREE_INSTALLMENTS = 'Por Tres Prestações'
}

export interface BankRate {
  bank: string;
  rate: number;
  lastUpdate: string;
  publishedAt?: string; // Data/Hora real no site do banco
  sourceUrl?: string;
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
  number: number;
  label: string;
  dueDate: string;
  amount: number;
  status: 'Pendente' | 'Pago';
  paymentDate?: string;
  receiptNumber?: string;
}

export interface PaymentReceipt {
  id: number;
  receiptNumber: string;
  customerName: string;
  idNumber: string;
  phoneNumber: string;
  amount: number;
  date: string;
  timestamp: number;
  invoiceNumber: number;
  installmentLabel: string;
  productInfo: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: number; // Número sequencial baseado no tipo (Proforma ou Final)
  customerName: string;
  idNumber: string;
  phoneNumber: string;
  productTimestamp: number;
  contractType: ContractType;
  sellingPrice: number;
  discount?: number;
  isFinal: boolean;
  isConverted?: boolean; // Indica se a proforma já gerou uma fatura final
  productDetails: Partial<InventoryItem>;
  adjustedPrice: number;
  installments: PaymentInstallment[];
  date: string;
  timestamp: number;
}

export interface SuggestionStore {
  deviceTypes: string[];
  brands: Record<string, string[]>;
  models: Record<string, string[]>;
  storages: string[];
  colors: string[];
}
