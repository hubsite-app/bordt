import { JobsiteMonthReport } from "@models";
import errorHandler from "@utils/errorHandler";

const pendingJobsiteMonthReportUpdateHelper = async () => {
  const jobsiteMonthReports = await JobsiteMonthReport.getByUpdatePending();

  // Update
  for (let i = 0; i < jobsiteMonthReports.length; i++) {
    try {
      await jobsiteMonthReports[i].updateAndSaveDocument();
    } catch (e) {
      console.error(
        `Jobsite month report ${jobsiteMonthReports[i]._id} pending worker error`,
        e
      );
      errorHandler(
        `Jobsite month report ${jobsiteMonthReports[i]._id} pending worker error`,
        e
      );
    }
  }

  return;
};

export default pendingJobsiteMonthReportUpdateHelper;
