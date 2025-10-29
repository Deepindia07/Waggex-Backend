import Salary from "../models/Salary.js";
export const createSalarySvc = (payload) => Salary.create(payload);
