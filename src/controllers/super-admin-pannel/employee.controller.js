import Employee from "../../models/employee.js";

// GET /api/employees?search=raj&page=1&limit=10&sort=-createdAt
export const employees = async (req, res) => {
  try {
    const {
      search = "", // text to search
      page = 1, // page number (1-based)
      limit = 10, // items per page
      sort = "-createdAt", // default newest first
    } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * pageSize;

    // 🔎 Build search filter (case-insensitive partial match)
    // Adjust fields to your schema: name, email, phone, city, etc.
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { dept: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      Employee.find(filter)
        .sort(sort) // e.g. 'name' or '-createdAt'
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      Employee.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "success",
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: pageNum * pageSize < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("employees:list", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};
