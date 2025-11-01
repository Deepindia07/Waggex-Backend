import { Router } from "express";
import { submitContactUs } from "../controllers/contact.controller.js";

const contactUsRouter = Router();

contactUsRouter.post("/contact-us", submitContactUs);

export default contactUsRouter;
