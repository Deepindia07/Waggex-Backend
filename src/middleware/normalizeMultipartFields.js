export function normalizeMultipartFields(req, _res, next) {
  if (req.is("multipart/form-data")) {
    const parse = (v) => {
      if (typeof v !== "string") return v;
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    };
    req.body = {
      company: parse(req.body.company) ?? {},
      employee: parse(req.body.employee) ?? {},
      earnings: parse(req.body.earnings) ?? [],
      deductions: parse(req.body.deductions) ?? [],
      payMonth: req.body.payMonth ?? "",
    };
  }
  next();
}
