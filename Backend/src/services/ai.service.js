const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
    matchScore: z.number().describe("Score 0-100 for candidate match"),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string()),
    })),
    title: z.string(),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Generate an interview report for a candidate:
                Resume: ${resume}
                Self Description: ${selfDescription}
                Job Description: ${jobDescription}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            },
        });

        return JSON.parse(response.text);

    } catch (error) {
        console.error("AI ERROR:", error);
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

async function generatePdfFromHtml(html) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();
    return pdf;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string(),
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Generate resume HTML for:
                Resume: ${resume}
                Self Description: ${selfDescription}
                Job Description: ${jobDescription}
                Return clean, ATS-friendly, professional HTML. 1-2 pages max.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            },
        });

        const { html } = JSON.parse(response.text);
        return await generatePdfFromHtml(html);

    } catch (error) {
        console.error("Resume PDF ERROR:", error);
        const fallbackHtml = `
            <html><body style="font-family: Arial; padding: 20px">
                <h1>Resume</h1>
                <p>${selfDescription}</p>
                <h2>Experience</h2>
                <p>${resume}</p>
            </body></html>`;
        return await generatePdfFromHtml(fallbackHtml);
    }
}

module.exports = { generateInterviewReport, generateResumePdf };