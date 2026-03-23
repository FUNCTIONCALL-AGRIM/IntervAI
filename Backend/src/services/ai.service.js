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
    throw error;
  }
}

/* =========================
   PUPPETEER PDF GENERATION
========================= */

async function generatePdfFromHtml(htmlContent) {
  try {
    console.log("🚀 Launching Puppeteer...");

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
  try {
    const resumePdfSchema = z.object({
      html: z.string(),
    });

    const prompt = `
      Generate a professional resume in HTML format.

      Resume: ${resume}
      Self Description: ${selfDescription}
      Job Description: ${jobDescription}

      Return JSON with only:
      {
        "html": "<complete HTML resume>"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(resumePdfSchema),
      },
    });

    console.log("🤖 AI RAW RESPONSE:", response.text);

    let jsonContent;

    try {
      jsonContent = JSON.parse(response.text);
    } catch (err) {
      throw new Error("AI returned invalid JSON");
    }

    if (!jsonContent || !jsonContent.html) {
      throw new Error("AI did not return HTML content");
    }

    console.log("📄 HTML generated successfully");

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;

  } catch (error) {
    console.error("🔥 RESUME PDF ERROR:", error);
    throw error;
  }
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
};