// Doctor-facing routes. DOCTOR and HOSPITAL_ADMIN can both reach these
// (an admin may need doctor-level views too) — but a real "list my
// patients" controller should still additionally filter by
// assignedDoctorId when req.auth.role === "DOCTOR", vs. all patients in
// the hospital when it's HOSPITAL_ADMIN. That distinction is a controller-
// level concern, not a route-level one, so it's left as a comment here
// rather than faked with a stub that would need rewriting anyway.

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";

const router = Router();

router.use(authenticate, authorize("DOCTOR", "HOSPITAL_ADMIN"), scopeToHospital);

router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    message: "Doctor dashboard placeholder — patient monitoring, glucose graphs, alerts land here next phase.",
    scope: { userId: req.auth.userId, role: req.auth.role, hospitalId: req.hospitalId },
  });
});

export default router;
