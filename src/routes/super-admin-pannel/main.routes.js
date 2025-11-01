import { Router } from "express";
import {
  companies,
  employeeCompanyCreatedCount,
  getCompaniesCreatedByEmployee,
} from "../../controllers/super-admin-pannel/company.controller.js";
import {
  employees,
  getEmployeesByCompany,
} from "../../controllers/super-admin-pannel/employee.controller.js";
import {
  loginController,
  registerController,
} from "../../controllers/super-admin-pannel/auth.controller.js";
import { dashboard } from "../../controllers/super-admin-pannel/dashboard.controller.js";
import { downloadPayslipPdf } from "../../controllers/downloadPayslipPdf.controller.js";

const superAdminPannelRoute = Router();

superAdminPannelRoute.get("/companies", companies);
superAdminPannelRoute.get("/employee", employees);
superAdminPannelRoute.get("/dashboard", dashboard);
superAdminPannelRoute.post("/create-super-admin", registerController);
superAdminPannelRoute.post("/login-super-admin", loginController);

superAdminPannelRoute.get(
  "/employee-count/:employeeId",
  employeeCompanyCreatedCount
);

superAdminPannelRoute.get(
  "/employee/:employeeId/companies-created",
  getCompaniesCreatedByEmployee
);
superAdminPannelRoute.get(
  "/company/:companyId/employees",
  getEmployeesByCompany
);

superAdminPannelRoute.get("/download-pdf/:id", downloadPayslipPdf);

export default superAdminPannelRoute;
