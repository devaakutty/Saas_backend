import Product from "../models/Product.js";

/* =====================================================
   CREATE PRODUCT
   POST /api/products
===================================================== */
export const createProduct = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, rate, unit, stock } = req.body;

    if (!name || rate === undefined) {
      return res
        .status(400)
        .json({ message: "Product name and rate are required" });
    }

    const product = await Product.create({
      name: name.trim(),
      rate: Number(rate),
      unit: unit ? unit.trim() : undefined,
      stock: Number(stock) || 0,
      userId,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL PRODUCTS
   GET /api/products
===================================================== */
export const getProducts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const products = await Product.find({
      userId,
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
   GET /api/products/:id
===================================================== */
export const getProductById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      userId,
      isActive: true,
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
   PUT /api/products/:id
===================================================== */
export const updateProduct = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, rate, unit, stock, isActive } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(unit !== undefined && {
          unit: unit ? unit.trim() : undefined,
        }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE PRODUCT (SOFT DELETE)
   DELETE /api/products/:id
===================================================== */
export const deleteProduct = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId },
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
   POST /api/products/bulk
===================================================== */
export const bulkCreateProducts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { products } = req.body;

    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ message: "Products required" });
    }

    const docs = products.map((p) => ({
      name: p.name.trim(),
      stock: Number(p.stock),
      rate: Number(p.rate),
      unit: p.unit || null,
      userId,
    }));

    await Product.insertMany(docs);

    res.json({ message: "Products added successfully" });
  } catch (error) {
    console.error("Bulk add error:", error);
    res.status(500).json({ message: error.message });
  }
};
