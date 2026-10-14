import { num } from "./billing";
import { str } from "./api";
import type { CenterInput } from "./types";

export function centerColumns(b: Partial<CenterInput>) {
  return {
    name: str(b.name),
    owner: str(b.owner),
    phone: str(b.phone),
    address: str(b.address),
    fee: num(b.fee),
    notes: str(b.notes),
  };
}
