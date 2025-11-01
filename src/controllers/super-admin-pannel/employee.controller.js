import mongoose from "mongoose";
import Employee from "../../models/employee.js";
import Company from "../../models/company.js"; // only if you need separate company fetch

export const employees = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      sort = "-createdAt",
      companyId, // optional filter
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * pageSize;

    const filter = {};

    // filter by company
    if (companyId && mongoose.isValidObjectId(companyId)) {
      filter.company = new mongoose.Types.ObjectId(companyId);
    }

    // search (use your actual field names from the schema)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneno: { $regex: search, $options: "i" } }, // <-- schema field
        { designation: { $regex: search, $options: "i" } }, // <-- schema field
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Employee.find(filter)
        .sort(sort) // e.g. "name" or "-createdAt"
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: "company",
          select: "name email phone address vatNo createdAt", // choose fields to return
        })
        .lean()
        .exec(),
      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      page: pageNum,
      pageSize,
      total,
      items,

      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: pageNum * pageSize < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("employees:list", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch employees" });
  }
};

export const getEmployeesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Count employees in this company
    const totalEmployees = await Employee.countDocuments({
      company: companyId,
    });

    // Optionally, list them too
    const employees = await Employee.find({ company: companyId })
      .select("name employeeId email phoneno designation createdAt")
      .lean();

    res.status(200).json({
      success: true,
      message: "Employees for the company fetched successfully",
      companyId,
      totalEmployees,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees for company:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees for this company",
    });
  }
};
