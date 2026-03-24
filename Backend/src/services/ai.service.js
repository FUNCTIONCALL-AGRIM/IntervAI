const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

// ✅ Render-safe Puppeteer
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

/* =========================
   INTERVIEW REPORT
========================= */

const interviewReportSchema = z.object({
  matchScore: z.number(),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    })
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    })
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
    })
  ),
  title: z.string(),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  try {
    const prompt = `
      Generate an interview report:
      Resume: ${resume}
      Self Description: ${selfDescription}
      Job Description: ${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
      },
    });

    console.log("🤖 Interview AI Response:", response.text);

    return JSON.parse(response.text);

  } catch (error) {
    console.error("🔥 INTERVIEW AI ERROR:", error);

    // ✅ Fallback (so app never breaks)
    return {
      matchScore: 50,
      technicalQuestions: [],
      behavioralQuestions: [],
      skillGaps: [],
      preparationPlan: [],
      title: "Basic Interview Report (Fallback)",
    };
  }
}

/* =========================
   PUPPETEER PDF GENERATION
========================= */

async function generatePdfFromHtml(htmlContent) {
  try {
    console.log("🚀 Launching Puppeteer...");

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    await browser.close();

    return pdfBuffer;

  } catch (error) {
    console.error("🔥 PUPPETEER ERROR:", error);
    throw error;
  }
}

/* =========================
   RESUME PDF GENERATION
========================= */

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  let html;

  try {
    console.log("🤖 Calling Gemini for resume...");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
        Generate a clean, modern, professional resume in HTML format.

        Resume:
        ${resume}

        Self Description:
        ${selfDescription}

        Job Description:
        ${jobDescription}

        Return ONLY JSON:
        { "html": "<complete HTML resume>" }
      `,
    });

    console.log("📦 RAW AI RESPONSE:", response.text);

    let parsed;

    try {
      parsed = JSON.parse(response.text);
    } catch (err) {
      throw new Error("Invalid JSON from AI");
    }

    if (!parsed || !parsed.html) {
      throw new Error("AI did not return HTML");
    }

    html = parsed.html;

  } catch (error) {
    console.error("⚠️ AI FAILED → USING FALLBACK:", error.message);

    // ✅ FALLBACK HTML (VERY IMPORTANT)
    html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              line-height: 1.6;
            }
            h1 {
              text-align: center;
              color: #333;
            }
            h2 {
              border-bottom: 2px solid #eee;
              padding-bottom: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Professional Resume</h1>

          <h2>Profile</h2>
          <p>${selfDescription}</p>

          <h2>Experience & Skills</h2>
          <p>${resume}</p>

          <h2>Target Role</h2>
          <p>${jobDescription}</p>
        </body>
      </html>
    `;
  }

  const pdfBuffer = await generatePdfFromHtml(html);

  return pdfBuffer;
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
};