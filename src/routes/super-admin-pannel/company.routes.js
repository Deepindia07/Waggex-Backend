import { Router } from "express";
import express from "express";
import { companies } from "../../controllers/super-admin-pannel/company.controller";

const companyRoute = express.Router();

companyRoute.get("/companies", companies);

export default companyRoute;
