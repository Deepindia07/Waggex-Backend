import { Router } from "express";
import { companies } from "../../controllers/super-admin-pannel/company.controller.js";
import { employees } from "../../controllers/super-admin-pannel/employee.controller.js";
import {
  loginController,
  registerController,
} from "../../controllers/super-admin-pannel/auth.controller.js";

const superAdminPannelRoute = Router();

superAdminPannelRoute.get("/companies", companies);
superAdminPannelRoute.get("/employee", employees);
superAdminPannelRoute.post("/create-super-admin", registerController);
superAdminPannelRoute.post("/login-super-admin", loginController);

export default superAdminPannelRoute;
