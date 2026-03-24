import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true, // ✅ REQUIRED FOR AUTH
});

/* =========================
   GENERATE INTERVIEW
========================= */
export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  try {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);

    if (resumeFile) {
      formData.append("resume", resumeFile);
    }

    const response = await api.post("/api/interview/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // ✅ SAFE RETURN
    return response?.data?.interviewReport || null;

  } catch (error) {
    console.error("Generate Interview Error:", error);

    throw new Error(
      error.response?.data?.message || "Failed to generate interview"
    );
  }
};

/* =========================
   GET SINGLE REPORT
========================= */
export const getInterviewReportById = async (interviewId) => {
  try {
    const response = await api.get(`/api/interview/report/${interviewId}`);

    return response?.data?.interviewReport || null;

  } catch (error) {
    console.error("Get Report Error:", error);

    return null; // ✅ prevent crash
  }
};

/* =========================
   GET ALL REPORTS
========================= */
export const getAllInterviewReports = async () => {
  try {
    const response = await api.get("/api/interview/");

    return response?.data?.interviewReports || [];

  } catch (error) {
    console.error("Get All Reports Error:", error);

    return []; // ✅ prevent crash
  }
};

/* =========================
   GENERATE PDF
========================= */
export const generateResumePdf = async ({ interviewReportId }) => {
  try {
    const response = await api.post(
      `/api/interview/resume/pdf/${interviewReportId}`,
      null,
      {
        responseType: "blob",
      }
    );

    return response.data;

  } catch (error) {
    console.error("PDF Error:", error);

    throw new Error("Failed to generate PDF");
  }
};