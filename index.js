// import "dotenv/config";
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import morgan from "morgan";
// import path from "path";
// import payslipRoutes from "./src/routes/payslip.routes.js";
// import { validatePayslip } from "./src/validators/paySlip.schema.js";
// import { fileURLToPath } from "url";
// import { uploadLogo } from "./src/middleware/uploadLogo.js";
// import superAdminPannelRoute from "./src/routes/super-admin-pannel/main.routes.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// // app.use(cors());

// app.use(
//   cors({
//     origin: "*", // or your frontend domain
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.options("*", cors()); // handle preflight for all routes

// app.use(express.json({ limit: "1mb" }));
// app.use(morgan("dev"));

// app.get("/", (_, res) => res.json({ ok: true }));
// app.use("/public", express.static(path.join(process.cwd(), "public")));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api/payslips", payslipRoutes);
// app.use("/api", superAdminPannelRoute);
// app.post("/api/test", (_, res) => res.json({ ok: true, message: "success" }));

// // basic error handler
// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(400).json({ message: err?.message || "Unexpected error" });
// });

// const PORT = process.env.PORT || 5000;
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => app.listen(PORT, () => console.log("Server on " + PORT)))
//   .catch((e) => console.error("Mongo error", e));

// ===========

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import payslipRoutes from "./src/routes/payslip.routes.js";
import superAdminPannelRoute from "./src/routes/super-admin-pannel/main.routes.js";
import contactUsRouter from "./src/routes/contactus.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------- Middleware ---------- */
app.use(cors());
// app.use(
//   cors({
//     origin: "*", // or ["https://your-frontend.com"]
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: false,
//   })
// );
// app.options("*", cors()); // handle preflight for all routes

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Tiny request logger to debug routing in Render logs
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.originalUrl}`);
  next();
});

/* ---------- Health & test first (so nothing overrides them) ---------- */
app.get("/", (_req, res) => res.json({ ok: true }));
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/api/test", (_req, res) => res.json({ ok: true, message: "GET ok" }));
app.post("/api/test", (_req, res) =>
  res.json({ ok: true, message: "POST ok" })
);

/* ---------- Static & feature routers ---------- */
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/payslips", payslipRoutes);
app.use("/api/super-admin-pannel", superAdminPannelRoute); // ensure this router has NO catch-all like router.all('*', ...)
app.use("/api", contactUsRouter);

/* ---------- Error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(400).json({ message: err?.message || "Unexpected error" });
});

/* ---------- Start ---------- */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in environment");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log("✅ Server on " + PORT));
  })
  .catch((e) => {
    console.error("❌ Mongo error", e);
    process.exit(1);
  });
