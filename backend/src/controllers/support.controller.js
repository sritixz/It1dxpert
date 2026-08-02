import { z } from "zod";
import * as supportService from "../services/support.service.js";

const ticketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

// Available to any authenticated role — see routes/support.routes.js.
export async function createTicketController(req, res) {
  const data = ticketSchema.parse(req.body);
  const ticket = await supportService.createTicket({
    userId: req.auth.userId,
    hospitalId: req.hospitalId || null,
    ...data,
  });
  res.status(201).json({ success: true, data: ticket });
}
