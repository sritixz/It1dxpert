// Support routes — no authorize() role restriction, since needing to
// contact support isn't specific to one role. Still runs through
// scopeToHospital so req.hospitalId is available (null for SUPER_ADMIN,
// which the controller handles).

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { createTicketController } from "../controllers/support.controller.js";

const router = Router();

router.use(authenticate, scopeToHospital);

router.post("/tickets", asyncHandler(createTicketController));

export default router;
