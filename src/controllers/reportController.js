import Invoice from "../models/Invoice.js";

/* =====================================================
   SALES REPORT
   GET /api/reports/sales
===================================================== */
export const getSalesReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const invoices = await Invoice.find({ userId })
      .sort({ createdAt: -1 })
      .populate("customerId", "name")
      .select("invoiceNo total status createdAt customerId");

    res.json({
      invoices: invoices.map((inv) => ({
        id: inv._id,
        invoiceNo: inv.invoiceNo,
        total: inv.total,
        status: inv.status,
        createdAt: inv.createdAt,
        customer: { name: inv.customerId?.name },
      })),
    });
  } catch (error) {
    console.error("❌ Sales report error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   PROFIT & LOSS REPORT
   GET /api/reports/profit-loss
===================================================== */
export const profitLossReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const invoices = await Invoice.find({ userId });

    /* ---------- TOTALS ---------- */
    let revenue = 0;
    let cost = 0;

    invoices.forEach((inv) => {
      revenue += inv.total;

      inv.items.forEach((item) => {
        cost += item.amount * 0.7; // assumed cost = 70%
      });
    });

    const profit = revenue - cost;

    /* ---------- MONTHLY DATA ---------- */
    const monthlyMap = {};

    invoices.forEach((inv) => {
      const month = inv.createdAt.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          revenue: 0,
          expense: 0,
        };
      }

      monthlyMap[month].revenue += inv.total;

      const monthExpense = inv.items.reduce(
        (s, i) => s + i.amount * 0.7,
        0
      );

      monthlyMap[month].expense += monthExpense;
    });

    res.json({
      revenue: Number(revenue.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      monthly: Object.values(monthlyMap),
    });
  } catch (error) {
    console.error("❌ Profit & Loss error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GST REPORT
   GET /api/reports/gst
===================================================== */
export const gstReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const invoices = await Invoice.find({ userId });

    let taxableSales = 0;
    let outputGST = 0;
    let inputGST = 0; // future purchases

    const monthlyMap = {};

    invoices.forEach((inv) => {
      // assuming total is GST inclusive (18%)
      const taxable = inv.total / 1.18;
      const gst = inv.total - taxable;

      taxableSales += taxable;
      outputGST += gst;

      const month = inv.createdAt.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          taxable: 0,
          output: 0,
          input: 0,
        };
      }

      monthlyMap[month].taxable += taxable;
      monthlyMap[month].output += gst;
    });

    res.json({
      taxableSales: Math.round(taxableSales),
      outputGST: Math.round(outputGST),
      inputGST: Math.round(inputGST),
      netGST: Math.round(outputGST - inputGST),
      monthly: Object.values(monthlyMap),
    });
  } catch (error) {
    console.error("❌ GST report error:", error);
    res.status(500).json({ message: error.message });
  }
};
