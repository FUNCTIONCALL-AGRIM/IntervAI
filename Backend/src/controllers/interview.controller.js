const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const mongoose = require("mongoose");

/**
 * @description Generate interview report
 */
async function generateInterViewReportController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    console.log("📄 Parsing PDF...");

    const data = await pdfParse(req.file.buffer);
    const resumeText = data.text;

    if (!resumeText) {
      return res.status(400).json({
        message: "Failed to extract resume text",
      });
    }

    const { selfDescription, jobDescription } = req.body;

    if (!selfDescription || !jobDescription) {
      return res.status(400).json({
        message: "Missing self description or job description",
      });
    }

    console.log("🤖 Generating AI interview report...");

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...interViewReportByAi,
    });

    res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });

  } catch (error) {
    console.error("🔥 INTERVIEW REPORT ERROR:", error);

    res.status(500).json({
      message: "Server Error while generating interview report",
      error: error.message,
    });
  }
}

/**
 * @description Get interview report by ID
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });

  } catch (error) {
    console.error("🔥 FETCH REPORT ERROR:", error);

    res.status(500).json({
      message: "Server Error while fetching report",
      error: error.message,
    });
  }
}

/**
 * @description Get all interview reports
 */
async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel.find({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan"
      );

    res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });

  } catch (error) {
    console.error("🔥 FETCH ALL ERROR:", error);

    res.status(500).json({
      message: "Server Error while fetching reports",
      error: error.message,
    });
  }
}

/**
 * @description Generate Resume PDF
 */
async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    console.log("👉 Interview Report ID:", interviewReportId);

    // ✅ Validate ID
    if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
      return res.status(400).json({
        message: "Invalid interview report ID",
      });
    }

    const interviewReport = await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    console.log("📄 Resume:", !!resume);
    console.log("📄 Job Description:", !!jobDescription);
    console.log("📄 Self Description:", !!selfDescription);

    // ✅ Validate required data
    if (!resume || !jobDescription || !selfDescription) {
      return res.status(400).json({
        message: "Missing required data for PDF generation",
      });
    }

    console.log("🤖 Generating Resume PDF...");

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    if (!pdfBuffer) {
      return res.status(500).json({
        message: "Failed to generate PDF",
      });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("🔥 PDF GENERATION ERROR:", error);

    res.status(500).json({
      message: "Server Error while generating PDF",
      error: error.message,
    });
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};