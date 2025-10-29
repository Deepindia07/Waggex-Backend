import Employee from "../models/employee.js";
export const createEmployeeSvc = (payload) => Employee.create(payload);
export const getEmployeeByIdSvc = (id) => Employee.findById(id);
