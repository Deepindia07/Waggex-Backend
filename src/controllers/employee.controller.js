import asyncHandler from "../utils/asyncHandler.js";
import { employeeSchema } from "../validators/employee.schema.js";
import {
  createEmployeeSvc,
  getEmployeeByIdSvc,
} from "../services/employee.service.js";

export const createEmployee = asyncHandler(async (req, res) => {
  const payload = employeeSchema.parse({
    ...req.body,
    paidDays: Number(req.body?.paidDays || 0),
    lossOfPayDays: Number(req.body?.lossOfPayDays || 0),
  });
  const employee = await createEmployeeSvc(payload);
  res.status(201).json(employee);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await getEmployeeByIdSvc(req.params.id);
  if (!employee) return res.status(404).json({ message: "Not found" });
  res.json(employee);
});
