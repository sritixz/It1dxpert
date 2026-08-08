import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../config/db.js";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Handle a chat session between a patient and the CareAI assistant.
 * @param {string} patientId The database PatientProfile.id
 * @param {string} message The user's new message
 * @param {Array<{role: string, content: string}>} history Chat history array
 * @returns {Promise<string>} The AI's markdown response
 */
export async function chatWithAgent(patientId, message, history = []) {
  // 1. Fetch patient profile with relations
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      assignedDoctor: true,
      hospital: true,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found.");
  }

  // 2. Fetch last 7 days of logs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [glucoseLogs, insulinLogs, mealLogs, activityLogs, appointments] = await Promise.all([
    prisma.glucoseLog.findMany({
      where: { patientId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.insulinLog.findMany({
      where: { patientId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.mealLog.findMany({
      where: { patientId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.activityLog.findMany({
      where: { patientId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.appointment.findMany({
      where: { patientId, scheduledAt: { gte: new Date() } },
      include: { doctor: true },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  // If no Gemini API Key is set, return a friendly mock message detailing the data we collected.
  if (!genAI) {
    const avgGlucose = glucoseLogs.length > 0 
      ? Math.round(glucoseLogs.reduce((sum, log) => sum + log.value, 0) / glucoseLogs.length) 
      : null;
    const totalInsulin = insulinLogs.reduce((sum, log) => sum + log.units, 0);

    return `Hello ${patient.fullName.split(" ")[0]}! I am **CareAI**, your virtual diabetes assistant.

> [!WARNING]
> **Gemini API Key is not set up yet in the backend \`.env\` file.** 
> To enable full intelligence, please add \`GEMINI_API_KEY="your_api_key"\` to your server environment.

However, I have gathered your local clinical data and can verify the system integration works:
* **Your Profile**: You are registered with **${patient.diabetesType}** at **${patient.hospital?.name || "our clinic"}**. Your doctor is **Dr. ${patient.assignedDoctor?.fullName || "Not assigned yet"}**.
* **Glucose Records**: I see **${glucoseLogs.length} logs** from the past week. ${avgGlucose ? `Your average glucose is **${avgGlucose} mg/dL**.` : "No glucose readings logged yet."}
* **Insulin Doses**: You have taken a total of **${totalInsulin} units** over the past 7 days across **${insulinLogs.length} logged doses**.
* **Meal logs**: You have recorded **${mealLogs.length} meal entries**.
* **Upcoming appointments**: You have **${appointments.length} scheduled visits** on file.

Once the API Key is supplied, I will be ready to discuss this data in detail, give recommendations, and analyze patterns! Let me know if you need help setting it up.`;
  }

  // 3. Format context strings for the LLM
  const glucoseStr = glucoseLogs.length > 0 
    ? glucoseLogs.map(l => `- ${new Date(l.loggedAt).toLocaleString("en-IN", { timeZone: patient.timezone })}: ${l.value} mg/dL (${l.context || "No context"})`).join("\n")
    : "No glucose logs in the last 7 days.";

  const insulinStr = insulinLogs.length > 0
    ? insulinLogs.map(l => `- ${new Date(l.loggedAt).toLocaleString("en-IN", { timeZone: patient.timezone })}: ${l.units} Units of ${l.insulinType || "unspecified type"} (Reason: ${l.reason || "None"})`).join("\n")
    : "No insulin doses in the last 7 days.";

  const mealStr = mealLogs.length > 0
    ? mealLogs.map(l => `- ${new Date(l.loggedAt).toLocaleString("en-IN", { timeZone: patient.timezone })}: ${l.carbs}g Carbs (${l.mealType || "Snack"}${l.notes ? `, Notes: ${l.notes}` : ""})`).join("\n")
    : "No meal/carb logs in the last 7 days.";

  const activityStr = activityLogs.length > 0
    ? activityLogs.map(l => `- ${new Date(l.loggedAt).toLocaleString("en-IN", { timeZone: patient.timezone })}: ${l.durationMins} minutes of ${l.activityType || "Activity"}`).join("\n")
    : "No activity logs in the last 7 days.";

  const appointmentStr = appointments.length > 0
    ? appointments.map(a => `- ${new Date(a.scheduledAt).toLocaleString("en-IN", { timeZone: patient.timezone })}: ${a.type} with ${a.providerName || (a.doctor ? `Dr. ${a.doctor.fullName}` : "doctor")} (Purpose: ${a.purpose || "Consultation"}, Location: ${a.location || "Clinic"})`).join("\n")
    : "No upcoming appointments.";

  // 4. Construct System Instruction
  const systemInstruction = `You are CareAI, an advanced, empathetic, and professional Virtual Diabetes Assistant inside the DiabetesCare system.
You help Type 1 and Type 2 Diabetes patients understand their clinical trends, calculate daily summaries, manage meals and glucose levels, and resolve concerns.

You are interacting with the following patient:
- Name: ${patient.fullName}
- Diabetes Type: ${patient.diabetesType}
- Target Range: 70 - 180 mg/dL
- Assigned Doctor: ${patient.assignedDoctor ? `Dr. ${patient.assignedDoctor.fullName} (${patient.assignedDoctor.specialization || "Diabetes Specialist"})` : "None"}
- Hospital: ${patient.hospital ? patient.hospital.name : "DiabetesCare Clinic"}
- Weekly Exercise Goal: ${patient.weeklyActivityGoalMins} minutes
- Units: ${patient.preferredUnits}

Current system local time: ${new Date().toLocaleString("en-IN", { timeZone: patient.timezone })}.

Here is the patient's logging history from the LAST 7 DAYS:

---
GLUCOSE READINGS:
${glucoseStr}

---
INSULIN LOGS:
${insulinStr}

---
MEAL LOGS (CARBS):
${mealStr}

---
PHYSICAL ACTIVITY:
${activityStr}

---
UPCOMING APPOINTMENTS:
${appointmentStr}
---

INSTRUCTIONS:
1. Speak directly to the patient using their data above. If they ask about recent readings, insulin, appointments, or averages, look at the logs and give precise counts, dates, and mathematical calculations (e.g. average glucose, total insulin).
2. Answer general doubts about diabetes management, exercise safety, and carbohydrate counting.
3. Be supportive, clear, and structure long lists using Markdown tables or bullet points.
4. **CRITICAL CLINICAL DISCLAIMER**: At the end of every message, you MUST include a short medical disclaimer. If they have an assigned doctor, mention their name. Example: "Disclaimer: I am an AI helper, not a doctor. Please discuss any changes to your insulin regimen with Dr. ${patient.assignedDoctor?.fullName || "your endocrinologist"}."
5. If the logs indicate severe lows (< 70 mg/dL) or highs (> 250 mg/dL), remind the patient about safety rules (fast-acting glucose for lows, hydration and ketones checks for highs).
6. **MULTILINGUAL & SIMPLICITY**: Always detect the language used by the patient and reply in that exact same language (e.g. Hindi, Spanish, Bengali, Tamil, Telugu, Marathi). Use simple, everyday words and short, clear sentences. Avoid complex medical jargon so that users who are not technically or medically literate can easily follow your guidance. If you must mention a clinical term, explain it simply.
`;

  // 5. Query Gemini
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemInstruction,
  });

  // Reformat chat history for Gemini SDK
  // Gemini's history expects {role: "user"|"model", parts: [{text: "string"}]}
  const contents = history.map(item => ({
    role: item.role === "user" ? "user" : "model",
    parts: [{ text: item.content }],
  }));

  // Append new user message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const result = await model.generateContent({
    contents: contents,
  });

  const responseText = result.response.text();
  return responseText;
}
