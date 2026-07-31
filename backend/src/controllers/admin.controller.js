import { z } from "zod";
import * as adminService from "../services/admin.service.js";

const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const createHospitalAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  hospitalId: z.string().uuid(),
});

const createHospitalSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

const assignSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
});

// HOSPITAL_ADMIN creates a doctor within THEIR OWN hospital — req.hospitalId
// comes from scopeToHospital (forced from their token), never from the
// request body, so an admin can't create a doctor in a different tenant.
export async function createDoctorController(req, res) {
  const data = createDoctorSchema.parse(req.body);
  const result = await adminService.createDoctor({ ...data, hospitalId: req.hospitalId });
  res.status(201).json({ success: true, data: result });
}

// SUPER_ADMIN only (enforced by authorize() on the route) — hospitalId
// comes from the request body since super admin isn't scoped to one hospital.
export async function createHospitalAdminController(req, res) {
  const data = createHospitalAdminSchema.parse(req.body);
  const admin = await adminService.createHospitalAdmin(data);
  res.status(201).json({ success: true, data: admin });
}

export async function createHospitalController(req, res) {
  const data = createHospitalSchema.parse(req.body);
  const hospital = await adminService.createHospital(data);
  res.status(201).json({ success: true, data: hospital });
}

export async function listDoctorsController(req, res) {
  const doctors = await adminService.listDoctors(req.hospitalId);
  res.json({ success: true, data: doctors });
}

export async function assignPatientController(req, res) {
  const data = assignSchema.parse(req.body);
  const result = await adminService.assignPatientToDoctor({ ...data, hospitalId: req.hospitalId });
  res.json({ success: true, data: result });
}
