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

// GET /super-admin/employee?withCompanyCreateCounts=1
export const employeesWithCreatedCounts = async (_req, res) => {
  const rows = await Employee.aggregate([
    {
      $lookup: {
        from: "companies",
        let: { empId: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$createdBy", "$$empId"] } } }],
        as: "createdCompanies",
      },
    },
    { $addFields: { companiesCreated: { $size: "$createdCompanies" } } },
    { $project: { createdCompanies: 0 } },
  ]);
  res.json({ success: true, items: rows });
};

// GET /super-admin/employees/:employeeId/company-count
export const employeeCompanyCreatedCount = async (req, res) => {
  const { employeeId } = req.params;
  const count = await Company.countDocuments({ createdBy: employeeId });
  res.json({ success: true, employeeId, companiesCreated: count });
};

export const getCompaniesCreatedByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Count all companies created by this employee
    const totalCompanies = await Company.countDocuments({
      createdBy: employeeId,
    });

    // Optionally, list them too
    const companies = await Company.find({ createdBy: employeeId })
      .select("name city state country createdAt")
      .lean();

    res.status(200).json({
      success: true,
      message: "Companies created by employee fetched successfully",
      employeeId,
      totalCompanies,
      companies,
    });
  } catch (error) {
    console.error("Error fetching companies created by employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch companies created by this employee",
    });
  }
};
