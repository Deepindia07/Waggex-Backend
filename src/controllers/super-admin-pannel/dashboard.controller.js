import Company from "../../models/company.js";
import Employee from "../../models/employee.js";

export const dashboard = async (req, res) => {
  try {
    // Use countDocuments instead of fetching all data — more efficient & memory-safe
    const [totalCompanies, totalEmployees] = await Promise.all([
      Company.countDocuments(),
      Employee.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      message: "Data retrieved successfully",
      total_companies: totalCompanies,
      total_employees: totalEmployees,
    });
  } catch (err) {
    console.error("dashboard:error", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: err.message,
    });
  }
};
