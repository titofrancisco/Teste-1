
export enum DeviceCondition {
  NEW = 'Novo',
  OPEN_BOX = 'Caixa Aberta',
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
  sourceUrl?: string; // Campo para armazenar a URL de grounding do Google Search
}

export interface InventoryItem {
  id: number; // Campo 1: Numeração Automática
  deviceType: string; // Campo 2
  brand: string; // Campo 3
  model: string; // Campo 4
  condition: DeviceCondition; // Campo 5
  storage: string; // Campo 6
  color: string; // Campo 7
  specs: string; // Campo 8
  purchasePrice: number; // Campo 9
  totalPurchasePrice: number; // Campo 10 (Calculado)
  freight: number; // Campo 11
  totalFreight: number; // Campo 12 (Calculado)
  customsExpenses: number; // Campo 13
  additionalExpenses: number; // Campo 14
  totalCost: number; // Campo 15 (Soma de 10, 12, 13, 14)
  timestamp: number;
  dateStr: string;
  isSold?: boolean;
}

// Interface para prestações de pagamento
export interface PaymentInstallment {
  number: number;
  dueDate: string;
  amount: number;
  status: 'Pendente' | 'Pago';
}

// Interface para documentos de facturação
export interface Invoice {
  id: number;
  invoiceNumber: number;
  customerName: string;
  idNumber: string;
  phoneNumber: string;
  productTimestamp: number;
  contractType: ContractType;
  sellingPrice: number;
  isFinal: boolean;
  productDetails: Partial<InventoryItem>;
  adjustedPrice: number;
  installments: PaymentInstallment[];
  date: string;
  timestamp: number;
}

export interface SuggestionStore {
  deviceTypes: string[];
  brands: Record<string, string[]>; // Tipo -> [Marcas]
  models: Record<string, string[]>; // Marca -> [Modelos]
  storages: string[];
  colors: string[];
}
