import { Router } from "express";
import {
  createEmployee,
  getEmployee,
} from "../controllers/employee.controller.js";
const e = Router();

e.post("/", createEmployee);
e.get("/:id", getEmployee);
export default e;
