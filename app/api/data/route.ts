import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { toCenter, toReceipt, toSettings } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** Everything the UI needs in one request: centers, receipts (newest first) and settings. */
export async function GET() {
  try {
    const [centers, receipts, settings] = await Promise.all([
      prisma.center.findMany({ orderBy: { name: "asc" } }),
      prisma.receipt.findMany({ orderBy: [{ date: "desc" }, { no: "desc" }] }),
      prisma.setting.findUnique({ where: { id: "business" } }),
    ]);
    return ok({ centers: centers.map(toCenter), receipts: receipts.map(toReceipt), settings: toSettings(settings) });
  } catch (e) {
    return handle(e);
  }
}
