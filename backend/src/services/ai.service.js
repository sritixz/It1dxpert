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
6. **MULTILINGUAL & SIMPLICITY**: Always detect the language used by the patient and reply in that exact same language (e.g. Hindi, Punjabi, Spanish, Bengali, Tamil, Telugu, Marathi). Use simple, everyday words and short, clear sentences. Avoid complex medical jargon so that users who are not technically or medically literate can easily follow your guidance. If you must mention a clinical term, explain it simply.
`;

  // 5. Query Gemini
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
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

/**
 * Analyze meal nutrients (calories, carbs, protein, fat) from text description or image.
 * @param {object} params
 * @param {Buffer} params.fileBuffer Image buffer if uploaded
 * @param {string} params.mimeType Mime type of the image
 * @param {string} params.foodDescription Text description of diet
 * @returns {Promise<object>} Parsed JSON object of nutrients
 */
export async function analyzeMealNutrients({ fileBuffer, mimeType, foodDescription }) {
  if (!genAI) {
    // Falls back to a mock analysis if no API key is set
    return {
      mealName: foodDescription || "Sample Plate",
      portionEstimate: "1 serving",
      calories: 380,
      carbs: 45,
      protein: 15,
      fat: 12,
      glycemicImpact: "Moderate blood glucose rise. (API key not configured in backend, returning mock diagnostics)"
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Analyze this meal and estimate its nutritional values. 
Identify the meal name, estimated portion weight/amount, calories (kcal), carbohydrates (g), protein (g), fat (g), and its glycemic impact on blood glucose (especially for diabetes management).

Return a valid JSON object matching this schema exactly:
{
  "mealName": "Name of the food identified",
  "portionEstimate": "Portion weight/portion description, e.g. 250g, 1 plate",
  "calories": number (integer kcal),
  "carbs": number (integer grams),
  "protein": number (integer grams),
  "fat": number (integer grams),
  "glycemicImpact": "A short, simple description of the blood sugar rise/impact"
}`;

  let contents = [];
  if (fileBuffer) {
    const imagePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType
      }
    };
    contents.push(imagePart);
  }

  let queryText = prompt;
  if (foodDescription) {
    queryText += `\n\nPatient Description of diet: "${foodDescription}"`;
  }
  contents.push({ text: queryText });

  const result = await model.generateContent(contents);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", responseText);
    throw new Error("Failed to parse nutrient analysis response.");
  }
}

/**
 * Extract blood glucose, insulin, and meal logs from a hand-written or printed medical document/image.
 * @param {object} params
 * @param {Buffer} params.fileBuffer Document file buffer
 * @param {string} params.mimeType File MIME type
 * @returns {Promise<object>} Object containing an array of extracted logs
 */
export async function extractLogsFromDoc({ fileBuffer, mimeType }) {
  if (!genAI) {
    throw new Error("Gemini API key is not configured in backend.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const fileData = {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType
    }
  };

  const systemPrompt = `You are a medical document OCR assistant specializing in diabetes logbooks. 
Your task is to analyze the uploaded document (which can be a handwritten diary page in Gurmukhi/Punjabi or English, a laboratory report, a photo of a blood glucose meter screen, or doctor notes) and extract any recorded data points for:
1. Blood Glucose readings
2. Insulin doses
3. Meals / Food intake

Understand regional scripts (like Gurmukhi/Punjabi). For example:
- "ਸਵੇਰ" or "ਸਵੇਰ ਦੀ" means Morning (usually Fasting)
- "ਦੁਪਹਿਰ" means Afternoon
- "ਸ਼ਾਮ" means Evening
- "ਰਾਤ" or "ਰਾਤ ਦਾ" means Night / Bedtime
- "ਸ਼ੂਗਰ" means Sugar/Glucose
- "ਟੀਕਾ" means Injection/Insulin dose
- "ਖਾਣਾ" or details like "ਰੋਟੀ", "ਦਾਲ", "ਪਰਾਂਠਾ", "ਦੁੱਧ", "ਚਾਹ" mean meals/carbohydrates.

Also, resolve dates:
Look at the dates column (typically written on the left in a diary, like "1-8-26", "2-8-26", "03-08-26").
For each log item, determine the date. The year "26" stands for 2026.
Map columns (Morning, Afternoon, Evening, Night) to estimate approximate times (e.g. Morning = 8:00 AM, Afternoon = 1:00 PM, Evening = 5:30 PM, Night = 8:30 PM) on that date. If a date cannot be found, use the current year (2026) with the month/day if visible. If no date is found whatsoever, return null for loggedAt.

Structure the output in a JSON object with this EXACT schema:
{
  "extractedLogs": [
    {
      "type": "glucose" | "insulin" | "meal",
      "value": number, // glucose value in mg/dL, insulin units, or estimated carb grams
      "context": "Fasting | Pre-Meal | Post-Meal | Bedtime | General", // relevant for glucose
      "insulinType": "Rapid-Acting | Long-Acting | Premixed", // if known (e.g. ਟੀਕਾ value maps to combinations, default to Rapid-Acting if meal-time, Long-Acting if bedtime)
      "reason": "Meal Bolus | Correction | Basal", // for insulin
      "mealType": "Breakfast | Lunch | Dinner | Snack", // for meal
      "notes": "Food description in English (e.g., 'Paratha and milk', 'Roti and Dal') or observations", // translate Punjabi food names to English
      "loggedAt": "ISO date string, e.g. 2026-08-04T08:00:00.000Z"
    }
  ]
}

Double check:
- Be highly accurate. Only extract logs that are explicitly written. If a cell is empty or has a line, skip it.
- Convert food items like "ਪਰਾਂਠਾ" to "Paratha", "ਰੋਟੀ" to "Roti", "ਚਾਹ" to "Tea", "ਦਾਲ" to "Dal", "ਸਬਜ਼ੀ" to "Sabzi".
- For compound insulin doses like "8+0", it means 8 units were taken (log value as 8). If it says "8+2" or "8+3", it's two separate entries or a combined dose (log the sum and add "8+3 units" to the notes, or log the primary dosage). Return the sum as the value (e.g. for "8+3" return 11).`;

  const result = await model.generateContent([fileData, systemPrompt]);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse Gemini log extraction output:", responseText);
    throw new Error("Failed to parse logs from document.");
  }
}


