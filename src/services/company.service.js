import Company from "../models/company.js";
export const createCompanySvc = (payload) => Company.create(payload);
export const getCompanyByIdSvc = (id) => Company.findById(id);
