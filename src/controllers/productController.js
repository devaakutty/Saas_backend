import Product from "../models/Product.js";

/* =====================================================
   CREATE PRODUCT
===================================================== */
export const createProduct = async (req, res) => {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, rate, unit, stock } = req.body;

    if (!name || rate === undefined) {
      return res.status(400).json({
        message: "Product name and rate are required",
      });
    }

    const parsedStock = Number(stock) || 0;

    const product = await Product.create({
      accountId,
      name: name.trim(),
      rate: Number(rate),
      unit: unit ? unit.trim() : "pcs",
      stock: parsedStock,
      isActive: parsedStock > 0, // 🔥 auto activate only if stock > 0
    });

    res.status(201).json(product);

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL PRODUCTS
===================================================== */
export const getProducts = async (req, res) => {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const products = await Product.find({
      accountId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json(products);

  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   GET PRODUCT BY ID
===================================================== */
export const getProductById = async (req, res) => {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      accountId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   UPDATE PRODUCT
===================================================== */
export const updateProduct = async (req, res) => {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, rate, unit, stock } = req.body;

    const product = await Product.findOne({
      _id: req.params.id,
      accountId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== undefined) product.name = name.trim();
    if (rate !== undefined) product.rate = Number(rate);
    if (unit !== undefined) product.unit = unit.trim();

    if (stock !== undefined) {
      product.stock = Number(stock);

      // 🔥 AUTO DEACTIVATE IF STOCK = 0
      if (product.stock <= 0) {
        product.stock = 0;
        product.isActive = false;
      } else {
        product.isActive = true; // 🔥 Reactivate if stock added again
      }
    }

    await product.save();

    res.json(product);

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   DELETE PRODUCT (SOFT DELETE)
===================================================== */
export const deleteProduct = async (req, res) => {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, accountId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product disabled successfully" });

  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   BULK CREATE PRODUCTS
===================================================== */
export const bulkCreateProducts = async (req, res) => {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { products } = req.body;

    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ message: "Products required" });
    }

    const docs = products.map((p) => {
      const parsedStock = Number(p.stock) || 0;

      return {
        accountId,
        name: p.name.trim(),
        rate: Number(p.rate),
        stock: parsedStock,
        unit: p.unit ? p.unit.trim() : "pcs",
        isActive: parsedStock > 0, // 🔥 auto active only if stock > 0
      };
    });

    await Product.insertMany(docs);

    res.json({ message: "Products added successfully" });

  } catch (error) {
    console.error("Bulk add error:", error);
    res.status(500).json({ message: error.message });
  }
};
