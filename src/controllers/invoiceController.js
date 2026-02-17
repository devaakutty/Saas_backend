import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import Account from "../models/Account.js";
import { PLAN_CONFIG } from "../planConfig.js";
import PDFDocument from "pdfkit";


//* =====================================================
export const createInvoice = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.accountId) {
      return res.status(401).json({
        message: "User account not properly initialized",
      });
    }

    const { customerId, items, total, status, payment } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "customerId and items are required",
      });
    }

    /* =====================================================
       1️⃣ FETCH ACCOUNT & PLAN
    ===================================================== */

    const account = await Account.findById(user.accountId);

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const planKey = account.plan || "starter";
    const plan = PLAN_CONFIG[planKey];

    if (!plan) {
      return res.status(400).json({
        message: "Invalid plan configuration",
      });
    }

    /* =====================================================
       2️⃣ CHECK MONTHLY INVOICE LIMIT
    ===================================================== */

    if (plan.invoiceLimit !== null) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const invoiceCount = await Invoice.countDocuments({
        accountId: user.accountId,
        createdAt: { $gte: startOfMonth },
      });

      if (invoiceCount >= plan.invoiceLimit) {
        return res.status(403).json({
          message: "Monthly invoice limit reached. Upgrade your plan.",
        });
      }
    }

    /* =====================================================
       3️⃣ VALIDATE PRODUCTS + STOCK
    ===================================================== */

    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          message: "Invalid product in invoice",
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }
    }

    /* =====================================================
       4️⃣ DEDUCT STOCK (AFTER VALIDATION)
    ===================================================== */

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    /* =====================================================
       5️⃣ AUTO INVOICE NUMBER
    ===================================================== */

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);

    const datePart = `${day}${month}${year}`;
    const prefix = "MIA";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await Invoice.countDocuments({
      accountId: user.accountId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const sequence = String(todayCount + 1).padStart(3, "0");
    const invoiceNo = `${prefix}-${datePart}-${sequence}`;

    /* =====================================================
       6️⃣ CREATE INVOICE
    ===================================================== */
    const invoice = await Invoice.create({
      invoiceNo,
      customerId,
      items,
      total,
      status: status || "PAID",
      payment,
      createdBy: user.id, // ✅ FIXED
      accountId: user.accountId,
    });

    return res.status(201).json({
      id: invoice._id,
      invoiceNo: invoice.invoiceNo,
    });

  } catch (error) {
    console.error("Create invoice error:", error);

    return res.status(500).json({
      message: error.message || "Failed to create invoice",
    });
  }
};

//* =====================================================
export const getInvoices = async (req, res) => {
  try {
    if (!req.user || !req.user.accountId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const invoices = await Invoice.find({
      accountId: req.user.accountId, // ✅ FIXED
    })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    const formatted = invoices.map((inv) => ({
      id: inv._id,
      invoiceNo: inv.invoiceNo,
      total: inv.total,
      status: inv.status,
      createdAt: inv.createdAt,
      customer: inv.customerId
        ? {
            id: inv.customerId._id,
            name: inv.customerId.name,
          }
        : null,
    }));

    res.json(formatted);

  } catch (error) {
    console.error("GET INVOICES ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch invoices",
    });
  }
};

/* =====================================================
   GET INVOICE BY ID
===================================================== */
export const getInvoiceById = async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      accountId: req.user.accountId, // ✅ FIXED
    })
      .populate("customerId", "name phone")
      .populate("createdBy", "firstName lastName");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({
      _id: invoice._id,
      invoiceNo: invoice.invoiceNo,
      status: invoice.status,
      total: invoice.total,
      createdAt: invoice.createdAt,
      items: invoice.items,
      customer: invoice.customerId
        ? {
            name: invoice.customerId.name,
            phone: invoice.customerId.phone,
          }
        : null,
    });

  } catch (error) {
    console.error("GET INVOICE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
};

/* =====================================================
   UPDATE INVOICE
===================================================== */
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      {
        _id: req.params.id,
        accountId: req.user.accountId, // ✅ FIXED
      },
      req.body,
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE INVOICE

===================================================== */
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      accountId: req.user.accountId, // ✅ FIXED
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* =====================================================
   MARK INVOICE AS PAID

===================================================== */
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      {
        _id: req.params.id,
        accountId: req.user.accountId, // ✅ FIXED
      },
      { status: "PAID" },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//* =====================================================
//   DOWNLOAD INVOICE PDF
//===================================================== */  

export const downloadInvoicePdf = async (req, res) => {
  try {
    /* ================= AUTH CHECK ================= */
    if (!req.user || !req.user.accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    /* ================= FIND INVOICE ================= */
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      accountId: req.user.accountId, // ✅ Correct filter
    }).populate("customerId", "name phone");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const items = invoice.items || [];

    const subTotal = items.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0
    );

    const gst = subTotal * 0.18;
    const grandTotal = subTotal + gst;

    /* ================= PDF ================= */

    const doc = new PDFDocument({
      size: [300, 700],
      margins: { top: 20, left: 20, right: 20, bottom: 20 },
    });

    // ✅ Set headers BEFORE pipe
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${invoice.invoiceNo}.pdf`
    );

    doc.pipe(res);

      /* ===== HEADER ===== */
      doc.rect(0, 0, 300, 70).fill("#111");

      doc
        .fillColor("white")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(req.user.company || "Your Company", 0, 22, { align: "center" });

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(req.user.address || "", { align: "center" })
        .text(
          `Phone: ${req.user.phone || ""}  GST: ${req.user.gstNumber || ""}`,
          { align: "center" }
        );

      doc.moveDown(3).fillColor("black");

    doc.moveDown();

    /* ===== META ===== */
    doc.fontSize(9);
    doc.text(`INV: #${invoice.invoiceNo}`);
    doc.text(
      `DATE: ${new Date(invoice.createdAt).toLocaleDateString()}`
    );
    doc.text(
      `CUSTOMER: ${invoice.customerId?.name || "-"}`
    );

    doc.moveDown();

    /* ===== TABLE HEADER ===== */
    const startX = 20;
    let y = doc.y;

    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("ITEM", startX, y);
    doc.text("RATE", 150, y, { width: 40, align: "right" });
    doc.text("QTY", 195, y, { width: 30, align: "right" });
    doc.text("TOTAL", 230, y, { width: 50, align: "right" });

    y += 10;
    doc.moveTo(startX, y).lineTo(280, y).stroke();

    /* ===== ITEMS ===== */
    doc.font("Helvetica").fontSize(9);
    y += 6;

    items.forEach((item) => {
      doc.text(item.productName || "-", startX, y, {
        width: 120,
      });
      doc.text(Number(item.rate || 0).toFixed(2), 150, y, {
        width: 40,
        align: "right",
      });
      doc.text(item.quantity || 0, 195, y, {
        width: 30,
        align: "right",
      });
      doc.text(Number(item.amount || 0).toFixed(2), 230, y, {
        width: 50,
        align: "right",
      });
      y += 14;
    });

    y += 8;
    doc.moveTo(startX, y).lineTo(280, y).stroke();

    /* ===== TOTALS ===== */
    y += 10;
    doc.fontSize(9);

    doc.text("SUBTOTAL", 150, y, { width: 70 });
    doc.text(subTotal.toFixed(2), 230, y, {
      width: 50,
      align: "right",
    });

    y += 12;
    doc.text("GST (18%)", 150, y, { width: 70 });
    doc.text(gst.toFixed(2), 230, y, {
      width: 50,
      align: "right",
    });

    /* ===== GRAND TOTAL ===== */
    y += 18;
    doc.rect(140, y, 140, 26).fill("#111");

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("GRAND TOTAL", 150, y + 7);

    doc.text(grandTotal.toFixed(2), 230, y + 7, {
      width: 50,
      align: "right",
    });

    doc.end();

  } catch (err) {
    console.error("❌ PDF Error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate invoice PDF",
      });
    }
  }
};

