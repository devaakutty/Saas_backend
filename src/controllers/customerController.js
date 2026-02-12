import Customer from "../models/Customer.js";

/* =====================================================
   CREATE CUSTOMER
   POST /api/customers
===================================================== */
export const createCustomer = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone,
      email,
      address,
      userId,
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL CUSTOMERS (USER ONLY)
   GET /api/customers
===================================================== */
/* =====================================================
   GET ALL CUSTOMERS (USER ONLY)
   GET /api/customers
===================================================== */
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      userId: req.user.id,
      isDeleted: false,
    });

    const formatted = customers.map((c) => ({
      id: c._id,              // 👈 THIS LINE
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      isActive: c.isActive,
      userId: c.userId,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET CUSTOMER BY ID
   GET /api/customers/:id
===================================================== */
export const getCustomerById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      userId,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Get customer by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE CUSTOMER
   PUT /api/customers/:id
===================================================== */
export const updateCustomer = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, phone, email, address, isActive } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId, isDeleted: false },
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE CUSTOMER (SOFT DELETE)
   DELETE /api/customers/:id
===================================================== */
export const deleteCustomer = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ message: error.message });
  }
};
