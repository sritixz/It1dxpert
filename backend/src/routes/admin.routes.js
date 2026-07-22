// Admin routes. Two roles allowed here on purpose:
// - HOSPITAL_ADMIN: scoped to their own hospital (scopeToHospital forces
//   req.hospitalId = their token's hospitalId — they can't override it).
// - SUPER_ADMIN: platform-wide (scopeToHospital lets req.hospitalId be
//   null, or an optional ?hospitalId= query param filter).
//
// This is the one route group where the SAME endpoint behaves differently
// depending on role, which is exactly why scopeToHospital exists as its
// own step instead of being folded into authorize.

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";

const router = Router();

router.use(authenticate, authorize("HOSPITAL_ADMIN", "SUPER_ADMIN"), scopeToHospital);

router.get("/overview", (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard placeholder — manage patients/doctors, hospitals, reports land here next phase.",
    scope: {
      userId: req.auth.userId,
      role: req.auth.role,
      // null hospitalId here means "SUPER_ADMIN viewing all hospitals"
      hospitalId: req.hospitalId,
    },
  });
});

export default router;
