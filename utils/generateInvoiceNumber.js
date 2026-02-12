import Invoice from "../models/Invoice.js";

export const generateInvoiceNumber = async () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  const prefix = "MIA";
  const datePart = `${day}${month}${year}`; // 🔥 100226

  // start & end of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // count invoices created today
  const todayCount = await Invoice.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const sequence = String(todayCount + 1).padStart(3, "0");

  return `${prefix}-${datePart}-${sequence}`;
};
