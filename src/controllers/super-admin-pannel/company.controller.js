import Company from "../../models/company.js";

// GET /api/companies?search=abc&page=1&limit=10
export const companies = async (req, res) => {
  try {
    // --- 1️⃣ Extract query params ---
    const { search = "", page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.min(parseInt(limit) || 10, 100);
    const skip = (pageNum - 1) * pageSize;

    // --- 2️⃣ Build search filter ---
    // Search by name, city, state, country, etc.
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { state: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // --- 3️⃣ Query the DB with pagination ---
    const [companies, total] = await Promise.all([
      Company.find(searchFilter)
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      Company.countDocuments(searchFilter),
    ]);

    // --- 4️⃣ Send response ---
    return res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("companies:list", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
    });
  }
};
