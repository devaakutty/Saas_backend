import InvoiceItem from "../models/InvoiceItem.js";
import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";

/* =====================================================
   CREATE INVOICE ITEM
===================================================== */
export const createInvoiceItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { invoiceId, productId, productName, quantity, rate } = req.body;

    if (!invoiceId || !productName || !quantity || rate === undefined) {
      return res.status(400).json({
        message: "invoiceId, productName, quantity, and rate are required",
      });
    }

    // 🔐 Validate invoice belongs to same ACCOUNT
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      accountId: user.accountId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    let product = null;

    if (productId) {
      product = await Product.findOne({
        _id: productId,
        accountId: user.accountId,
        isActive: true,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      product.stock -= quantity;
      await product.save();
    }

    const amount = Number(quantity) * Number(rate);

    const item = await InvoiceItem.create({
      invoiceId,
      productId: product ? product._id : undefined,
      productName: productName.trim(),
      quantity: Number(quantity),
      rate: Number(rate),
      amount,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Create invoice item error:", error);
    res.status(500).json({ message: "Failed to create invoice item" });
  }
};

/* =====================================================
   GET ITEMS BY INVOICE
===================================================== */
export const getInvoiceItemsByInvoice = async (req, res) => {
  try {
    const user = req.user;

    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      accountId: user.accountId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const items = await InvoiceItem.find({
      invoiceId: invoice._id,
    }).sort({ createdAt: 1 });

    res.json(items);
  } catch (error) {
    console.error("Get invoice items error:", error);
    res.status(500).json({ message: "Failed to load invoice items" });
  }
};

/* =====================================================
   UPDATE INVOICE ITEM
===================================================== */
export const updateInvoiceItem = async (req, res) => {
  try {
    const user = req.user;

    const item = await InvoiceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Invoice item not found" });
    }

    const invoice = await Invoice.findOne({
      _id: item.invoiceId,
      accountId: user.accountId,
    });

    if (!invoice) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const quantity =
      req.body.quantity !== undefined
        ? Number(req.body.quantity)
        : item.quantity;

    const rate =
      req.body.rate !== undefined ? Number(req.body.rate) : item.rate;

    const updated = await InvoiceItem.findByIdAndUpdate(
      req.params.id,
      {
        productName: req.body.productName?.trim() || item.productName,
        quantity,
        rate,
        amount: quantity * rate,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error("Update invoice item error:", error);
    res.status(500).json({ message: "Failed to update invoice item" });
  }
};

/* =====================================================
   DELETE INVOICE ITEM
===================================================== */
export const deleteInvoiceItem = async (req, res) => {
  try {
    const user = req.user;

    const item = await InvoiceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Invoice item not found" });
    }

    const invoice = await Invoice.findOne({
      _id: item.invoiceId,
      accountId: user.accountId,
    });

    if (!invoice) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await item.deleteOne();

    res.json({ message: "Invoice item deleted successfully" });
  } catch (error) {
    console.error("Delete invoice item error:", error);
    res.status(500).json({ message: "Failed to delete invoice item" });
  }
};
