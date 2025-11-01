import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

import { ToWords } from "to-words";
import { pathToFileURL } from "node:url";

const localPath = path.join(
  process.cwd(),
  "public",
  "logo",
  "waggex-logo-dark.png"
);

const buf = await fs.readFile(localPath);
const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
const TEMPLATE_PATH = path.resolve("src/template/payslip.hbs");

const nf = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const formatINR = (n) => nf.format(Number(n || 0));
const ddmmyyyy = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
// const monthYear = (iso) =>
//   new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
//     new Date(iso)
//   );
const toWords = new ToWords({
  localeCode: "en-IN",
  converterOptions: {
    currency: true,
    ignoreDecimal: true,
    currencyOptions: {
      name: "Rupee",
      plural: "Rupees",
      symbol: "U+20B9",
      fractionalUnit: { name: "Paisa", plural: "Paise" },
    },
  },
});

const sanitizeLogo = (logo, base = process.env.ASSET_BASE_URL || "") => {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  return base
    ? `${base.replace(/\/+$/, "")}/${logo.replace(/^\/+/, "")}`
    : logo;
};
export async function buildHtmlFromApi(data) {
  const { company, employee, payslip } = data;

  const mapped = {
    company: {
      name: company?.name || "",
      address: company?.address || "",
      logoUrl: sanitizeLogo(company?.logo),
    },
    employee: {
      name: employee?.name || "",
      id: employee?.employeeId || "",
      designation: employee?.designation || "",
    },
    pay: {
      paymonth: payslip?.payMonth,
      date: ddmmyyyy(payslip?.payDate),
    },
    earnings: (payslip?.earnings || []).map((e) => ({
      label: e.label,
      amountFormatted: formatINR(e.amount),
    })),
    deductions: (payslip?.deductions || []).map((d) => ({
      label: d.label,
      amountFormatted: formatINR(d.amount),
    })),
    totals: {
      earningsFormatted: formatINR(
        payslip?.gross ??
          (payslip?.earnings || []).reduce(
            (s, x) => s + Number(x.amount || 0),
            0
          )
      ),
      deductionsFormatted: formatINR(
        payslip?.totalDeductions ??
          (payslip?.deductions || []).reduce(
            (s, x) => s + Number(x.amount || 0),
            0
          )
      ),
      netFormatted: formatINR(payslip?.net || 0),
      netInWords: toWords.convert(payslip?.net || 0) + " Only",
    },
    powered: {
      logoUrl: dataUrl,
    },
  };

  const templateSrc = await fs.readFile(TEMPLATE_PATH, "utf8");
  const template = Handlebars.compile(templateSrc);
  return template(mapped);
}

export async function htmlToPdfBuffer(html) {
  // Launch with file access (helps when HTML pulls local assets)
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // <— important on small /dev/shm
    ],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
  });

  await browser.close();
  return buffer;
}
