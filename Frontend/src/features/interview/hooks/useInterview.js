export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } = context;

  const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true);

    try {
      const data = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });

      if (data) {
        setReport(data);
        return data;
      } else {
        setReport(null);
        alert("Failed to generate interview");
        return null;
      }

    } catch (error) {
      console.log(error);
      setReport(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (interviewId) => {
    setLoading(true);

    try {
      const data = await getInterviewReportById(interviewId);

      if (data) {
        setReport(data);
        return data;
      } else {
        setReport(null);
        return null;
      }

    } catch (error) {
      console.log(error);
      setReport(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReports = async () => {
    setLoading(true);

    try {
      const data = await getAllInterviewReports();

      setReports(data || []);
      return data;

    } catch (error) {
      console.log(error);
      setReports([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getResumePdf = async (interviewReportId) => {
    setLoading(true);
    try {
      const response = await generateResumePdf({ interviewReportId });

      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewReportId}.pdf`);
      document.body.appendChild(link);
      link.click();

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};