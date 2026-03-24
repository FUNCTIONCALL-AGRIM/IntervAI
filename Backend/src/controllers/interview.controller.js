const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
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
        interviewReport: null,
      });
    }

    const data = await pdfParse(req.file.buffer);
    const resumeText = data.text;

    if (!resumeText) {
      return res.status(400).json({
        message: "Failed to extract resume text",
        interviewReport: null,
      });
    }

    const { selfDescription, jobDescription } = req.body;

    if (!selfDescription || !jobDescription) {
      return res.status(400).json({
        message: "Missing self description or job description",
        interviewReport: null,
      });
    }

    let aiReport;

    try {
      aiReport = await generateInterviewReport({
        resume: resumeText,
        selfDescription,
        jobDescription,
      });
    } catch (err) {
      console.log("⚠️ AI failed → using fallback");

      aiReport = {
        matchScore: 50,
        technicalQuestions: [],
        behavioralQuestions: [],
        skillGaps: [],
        preparationPlan: [],
        title: "Basic Interview Report",
      };
    }

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...aiReport,
    });

    return res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport: interviewReport || null,
    });

  } catch (error) {
    console.error("🔥 INTERVIEW ERROR:", error);

    return res.status(500).json({
      message: "Server Error while generating interview report",
      interviewReport: null,
      error: error.message,
    });
  }
}

/**
 * @description Get all interview reports
 */
async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });

  } catch (error) {
    console.error("🔥 FETCH ALL ERROR:", error);

    return res.status(500).json({
      message: "Server Error while fetching reports",
      interviewReports: [],
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

    return res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });

  } catch (error) {
    console.error("🔥 FETCH ONE ERROR:", error);

    return res.status(500).json({
      message: "Server Error while fetching report",
      interviewReport: null,
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

    if (!resume || !jobDescription || !selfDescription) {
      return res.status(400).json({
        message: "Missing required data for PDF",
      });
    }

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("🔥 PDF ERROR:", error);

    res.status(500).json({
      message: "Server Error while generating PDF",
      error: error.message,
    });
  }
}

module.exports = {
  generateInterViewReportController,
  getAllInterviewReportsController,
  getInterviewReportByIdController,
  generateResumePdfController,
};