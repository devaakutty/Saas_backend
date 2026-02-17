import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";

/* =====================================================
   DASHBOARD SUMMARY (Account Based)
===================================================== */
export const getDashboardSummary = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    if (!accountId) {
      return res.status(400).json({
        message: "User account not properly initialized",
      });
    }

    const invoices = await Invoice.find({ accountId });

    let totalSales = 0;
    let receivedAmount = 0;
    let pendingAmount = 0;

    invoices.forEach((invoice) => {
      totalSales += invoice.total;

      if (invoice.status === "PAID") {
        receivedAmount += invoice.total;
      } else {
        pendingAmount += invoice.total;
      }
    });

    res.json({
      totalSales,
      receivedAmount,
      pendingAmount,
      totalExpense: 0, // future feature
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({
      message: "Failed to load dashboard data",
    });
  }
};

/* =====================================================
   STOCK SUMMARY (Account Based)
===================================================== */
export const getStockSummary = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    if (!accountId) {
      return res.status(400).json({
        message: "User account not properly initialized",
      });
    }

    const LOW_STOCK_THRESHOLD = 20;

    const [products, lowStockCount] = await Promise.all([
      Product.find({ accountId }),
      Product.countDocuments({
        accountId,
        stock: { $lt: LOW_STOCK_THRESHOLD },
      }),
    ]);

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const totalStock = products.reduce(
      (sum, product) => sum + product.stock,
      0
    );

    res.json({
      totalProducts,
      activeProducts,
      totalStock,
      lowStockCount,
    });
  } catch (error) {
    console.error("Stock summary error:", error);
    res.status(500).json({
      message: "Stock summary not available",
    });
  }
};

/* =====================================================
   TOP 5 MOST SOLD PRODUCTS (THIS MONTH)
===================================================== */
export const getDevices = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    if (!accountId) {
      return res.status(400).json({
        message: "User account not properly initialized",
      });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const invoices = await Invoice.find({
      accountId,
      status: "PAID",
      createdAt: { $gte: startOfMonth },
    });

    const productMap = {};

    invoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        if (!productMap[item.productName]) {
          productMap[item.productName] = 0;
        }
        productMap[item.productName] += item.quantity;
      });
    });

    const topProducts = Object.entries(productMap)
      .map(([name, quantity]) => ({
        device: name,
        count: quantity,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json(topProducts);
  } catch (error) {
    console.error("Devices chart error:", error);
    res.status(500).json({
      message: "Failed to load device data",
    });
  }
};

/* =====================================================
   LOW STOCK ITEMS
===================================================== */
export const getLowStockItems = async (req, res) => {
  try {
    const accountId = req.user.accountId;

    if (!accountId) {
      return res.status(400).json({
        message: "User account not properly initialized",
      });
    }

    const LOW_STOCK_THRESHOLD = 5;

    const products = await Product.find({
      accountId,
      stock: { $lte: LOW_STOCK_THRESHOLD },
    })
      .sort({ stock: 1 })
      .select("name stock unit");

    // res.json(
    //   products.map((product) => ({
    //     id: product._id,
    //     name: product.name,
    //     quantity: product.stock,
    //     unit: product.unit,
    //   }))
    // );
    res.json(
  products.map((product) => ({
    _id: product._id,   // ✅ FIXED
    name: product.name,
    quantity: product.stock,
    unit: product.unit,
  }))
);

  } catch (error) {
    console.error("Low stock error:", error);
    res.status(500).json({
      message: "Failed to load low stock items",
    });
  }
};
