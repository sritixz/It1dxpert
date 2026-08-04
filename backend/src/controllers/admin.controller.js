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

export async function getDashboardStatsController(req, res) {
  const stats = await adminService.getDashboardStats(req.hospitalId);
  res.json({ success: true, data: stats });
}

export async function getRegistrationTrendController(req, res) {
  const days = req.query.days ? parseInt(req.query.days, 10) : 7;
  const trend = await adminService.getRegistrationTrend(req.hospitalId, days);
  res.json({ success: true, data: trend });
}

export async function listHospitalsController(req, res) {
  const hospitals = await adminService.listHospitals(req.hospitalId);
  res.json({ success: true, data: hospitals });
}

export async function getHospitalDetailController(req, res) {
  const { hospitalId } = req.params;
  const hospital = await adminService.getHospitalDetail(hospitalId);
  res.json({ success: true, data: hospital });
}

const updateHospitalSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function updateHospitalController(req, res) {
  const { hospitalId } = req.params;
  const data = updateHospitalSchema.parse(req.body);
  const hospital = await adminService.updateHospital(hospitalId, data);
  res.json({ success: true, data: hospital });
}

const listUsersQuerySchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  pageSize: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

export async function listUsersController(req, res) {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await adminService.listUsers({
    hospitalId: req.hospitalId,
    ...query,
  });
  res.json({ success: true, data: result });
}

const setUserActiveSchema = z.object({
  isActive: z.boolean(),
});

export async function setUserActiveController(req, res) {
  const { userId } = req.params;
  const { isActive } = setUserActiveSchema.parse(req.body);
  const result = await adminService.setUserActive(userId, req.hospitalId, isActive);
  res.json({ success: true, data: result });
}
