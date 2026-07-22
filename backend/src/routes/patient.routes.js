// Patient-facing routes. Only PATIENT role can hit these, and
// scopeToHospital + req.auth.userId together are what a real controller
// would use to make sure a patient can only ever read/write THEIR OWN
// records (scopeToHospital narrows to the hospital; the controller itself
// should additionally filter by req.auth.userId — hospital scope alone
// isn't enough for patient routes, since other patients share the hospital).
//
// Endpoints here are stubs — the actual Daily Log / Glucose Trends /
// Medications controllers are the next phase. This file exists so the
// RBAC chain is demonstrably wired end-to-end for this role already.

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";

const router = Router();

router.use(authenticate, authorize("PATIENT"), scopeToHospital);

router.get("/dashboard", (req, res) => {
  // req.auth = { userId, role, hospitalId }, req.hospitalId set by scopeToHospital
  res.json({
    success: true,
    message: "Patient dashboard placeholder — Daily Log / Glucose Trends / Medications land here next phase.",
    scope: { userId: req.auth.userId, hospitalId: req.hospitalId },
  });
});

export default router;
