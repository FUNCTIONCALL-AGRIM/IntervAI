const { GoogleGenAI } = require("@google/genai");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

/* =========================
   INTERVIEW REPORT
========================= */

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
        Generate interview report JSON:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}
      `,
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("🔥 AI ERROR:", error);

    return {
      matchScore: 50,
      technicalQuestions: [],
      behavioralQuestions: [],
      skillGaps: [],
      preparationPlan: [],
      title: "Fallback Report",
    };
  }
}

/* =========================
   PDF GENERATION
========================= */

async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdf;
}

/* =========================
   RESUME PDF
========================= */

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  let html;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
        Create resume HTML:
        Resume: ${resume}
        Self: ${selfDescription}
        Job: ${jobDescription}
        Return JSON { "html": "..." }
      `,
    });

    const parsed = JSON.parse(response.text);
    html = parsed.html;

  } catch (error) {
    console.log("⚠️ Using fallback resume");

    html = `
      <html>
        <body style="font-family: Arial; padding:20px">
          <h1>Resume</h1>
          <h2>Profile</h2>
          <p>${selfDescription}</p>
          <h2>Experience</h2>
          <p>${resume}</p>
          <h2>Target Role</h2>
          <p>${jobDescription}</p>
        </body>
      </html>
    `;
  }

  return await generatePdfFromHtml(html);
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
};