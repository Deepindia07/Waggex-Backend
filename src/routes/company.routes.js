import { Router } from "express";
import {
  createCompany,
  getCompany,
} from "../controllers/company.controller.js";
const c = Router();

c.post("/", createCompany);
c.get("/:id", getCompany);
export default c;
