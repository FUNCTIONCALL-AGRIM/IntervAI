import React, { useState, useRef } from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate } from "react-router";

const Home = () => {
  const { loading, generateReport, reports } = useInterview();

  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");

  const resumeInputRef = useRef();
  const navigate = useNavigate();

  // ✅ FIXED: Safe handler
  const handleGenerateReport = async () => {
    try {
      const resumeFile = resumeInputRef.current?.files[0];

      // ✅ Validation
      if (!jobDescription.trim()) {
        return alert("Please enter a job description");
      }

      if (!resumeFile && !selfDescription.trim()) {
        return alert("Please upload resume OR enter self description");
      }

      // Optional file size check (extra safety)
      if (resumeFile && resumeFile.size > 5 * 1024 * 1024) {
        return alert("File size should be less than 5MB");
      }

      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });

      navigate(`/interview/${data._id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to generate report");
    }
  };

  // ✅ Loading screen
  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  return (
    <div className="home-page">
      {/* Header */}
      <header className="page-header">
        <h1>
          Create Your Custom <span className="highlight">Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </header>

      {/* Main Card */}
      <div className="interview-card">
        <div className="interview-card__body">
          {/* LEFT PANEL */}
          <div className="panel panel--left">
            <div className="panel__header">
              <h2>Target Job Description</h2>
              <span className="badge badge--required">Required</span>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="panel__textarea"
              placeholder="Paste job description here..."
              maxLength={5000}
            />

            <div className="char-counter">
              {jobDescription.length} / 5000 chars
            </div>
          </div>

          {/* Divider */}
          <div className="panel-divider" />

          {/* RIGHT PANEL */}
          <div className="panel panel--right">
            <div className="panel__header">
              <h2>Your Profile</h2>
            </div>

            {/* Upload Resume */}
            <div className="upload-section">
              <label className="section-label">
                Upload Resume
                <span className="badge badge--best">Best Results</span>
              </label>

              <label className="dropzone" htmlFor="resume">
                <p>Click to upload or drag & drop</p>
                <p>PDF or DOCX (Max 5MB)</p>

                <input
                  ref={resumeInputRef}
                  hidden
                  type="file"
                  id="resume"
                  accept=".pdf,.docx"
                />
              </label>
            </div>

            {/* OR */}
            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Self Description */}
            <div className="self-description">
              <label className="section-label">
                Quick Self Description
              </label>

              <textarea
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                className="panel__textarea panel__textarea--short"
                placeholder="Describe your skills and experience..."
              />
            </div>

            {/* Info */}
            <div className="info-box">
              <p>
                Either <strong>Resume</strong> or{" "}
                <strong>Self Description</strong> is required.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="interview-card__footer">
          <span>AI-Powered Strategy • ~30s</span>

          <button onClick={handleGenerateReport} className="generate-btn">
            Generate My Interview Strategy 🚀
          </button>
        </div>
      </div>

      {/* ✅ FIXED: Safe reports rendering */}
      {reports?.length > 0 && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>

          <ul className="reports-list">
            {reports.map((report) => (
              <li
                key={report._id}
                className="report-item"
                onClick={() => navigate(`/interview/${report._id}`)}
              >
                <h3>{report.title || "Untitled Position"}</h3>

                <p>
                  Generated on{" "}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>

                <p>
                  Match Score: {report.matchScore || 0}%
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="page-footer">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Help Center</a>
      </footer>
    </div>
  );
};

export default Home;