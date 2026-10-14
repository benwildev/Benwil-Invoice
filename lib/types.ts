export type CenterSnap = { name: string; owner: string; address: string; phone: string };

export type Center = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  fee: number;
  notes: string;
};

export type Item = { desc: string; qty: number | string; price: number | string; period?: boolean };

export type Payment = { amount: number; date: string; method: string; txnId: string };

export type Status = "paid" | "partial" | "unpaid";

export type Receipt = {
  id: string;
  no: string;
  centerId: string;
  center: CenterSnap;
  date: string;
  periodStart: string;
  periodEnd: string;
  items: Item[];
  discount: number;
  vatRate: number;
  method: string;
  txnId: string;
  notes: string;
  payments: Payment[];
  total: number;
  paid: number;
  due: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  business: string;
  product: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  prefix: string;
  periodDays: number;
  monthlyFee: number;
  signer: string;
  notes: string;
};

/** What the client sends when creating or editing a receipt. */
export type ReceiptInput = {
  no: string;
  centerId: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  items: Item[];
  discount: number | string;
  vatRate: number | string;
  method: string;
  txnId: string;
  notes: string;
  /** Only used on create: the first payment (advance or full). */
  advance?: number | string;
};

export type CenterInput = Omit<Center, "id">;

export type AppData = { centers: Center[]; receipts: Receipt[]; settings: Settings };
