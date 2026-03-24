import React, { useState, useEffect } from "react";
import "../style/interview.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useParams } from "react-router";

const NAV_ITEMS = [
  { id: "technical", label: "Technical Questions" },
  { id: "behavioral", label: "Behavioral Questions" },
  { id: "roadmap", label: "Road Map" },
];

const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const { report, getReportById, loading, getResumePdf } = useInterview();
  const { interviewId } = useParams();

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    }
  }, [interviewId]);

  // ✅ LOADING STATE
  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  // ✅ NO DATA STATE
  if (!report) {
    return (
      <main className="loading-screen">
        <h1>No report found</h1>
      </main>
    );
  }

  // ✅ SAFE DEFAULTS
  const technicalQuestions = report?.technicalQuestions || [];
  const behavioralQuestions = report?.behavioralQuestions || [];
  const preparationPlan = report?.preparationPlan || [];
  const skillGaps = report?.skillGaps || [];
  const matchScore = report?.matchScore || 0;

  const scoreColor =
    matchScore >= 80
      ? "score--high"
      : matchScore >= 60
      ? "score--mid"
      : "score--low";

  return (
    <div className="interview-page">
      <div className="interview-layout">

        {/* LEFT NAV */}
        <nav className="interview-nav">
          <p>Sections</p>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={activeNav === item.id ? "active" : ""}
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => getResumePdf(interviewId)}
            className="button primary-button"
          >
            Download Resume
          </button>
        </nav>

        {/* CONTENT */}
        <main className="interview-content">

          {/* TECHNICAL */}
          {activeNav === "technical" && (
            <section>
              <h2>Technical Questions</h2>

              {technicalQuestions.length === 0 ? (
                <p>No technical questions available</p>
              ) : (
                technicalQuestions.map((q, i) => (
                  <div key={i} className="q-card">
                    <p><b>Q{i + 1}:</b> {q.question}</p>
                    <p><b>Intention:</b> {q.intention}</p>
                    <p><b>Answer:</b> {q.answer}</p>
                  </div>
                ))
              )}
            </section>
          )}

          {/* BEHAVIORAL */}
          {activeNav === "behavioral" && (
            <section>
              <h2>Behavioral Questions</h2>

              {behavioralQuestions.length === 0 ? (
                <p>No behavioral questions available</p>
              ) : (
                behavioralQuestions.map((q, i) => (
                  <div key={i} className="q-card">
                    <p><b>Q{i + 1}:</b> {q.question}</p>
                    <p><b>Intention:</b> {q.intention}</p>
                    <p><b>Answer:</b> {q.answer}</p>
                  </div>
                ))
              )}
            </section>
          )}

          {/* ROADMAP */}
          {activeNav === "roadmap" && (
            <section>
              <h2>Preparation Roadmap</h2>

              {preparationPlan.length === 0 ? (
                <p>No roadmap available</p>
              ) : (
                preparationPlan.map((day) => (
                  <div key={day.day} className="roadmap-day">
                    <h3>Day {day.day} - {day.focus}</h3>
                    <ul>
                      {day.tasks.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          )}
        </main>

        {/* SIDEBAR */}
        <aside className="interview-sidebar">
          <h3>Match Score</h3>
          <div className={`score ${scoreColor}`}>
            {matchScore}%
          </div>

          <h3>Skill Gaps</h3>
          {skillGaps.length === 0 ? (
            <p>No skill gaps</p>
          ) : (
            skillGaps.map((gap, i) => (
              <span key={i} className={`skill-tag ${gap.severity}`}>
                {gap.skill}
              </span>
            ))
          )}
        </aside>

      </div>
    </div>
  );
};

export default Interview;