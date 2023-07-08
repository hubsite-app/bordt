import { JobsiteMonthReportDocument } from "@models";
import { SupportedMimeTypes } from "@typescript/file";
import { InvoiceReportClass } from "@typescript/invoice";
import { RangeSummaryReportClass } from "@typescript/jobsiteReports";
import { generateForRangeReport, getWorkbookBuffer } from "@utils/excel";
import { uploadFile } from "@utils/fileStorage";
import {
  dayReportIssueGeneration,
  jobsiteReportIssueGenerator,
} from "@utils/jobsiteReports/issues";
import dayjs from "dayjs";

const expenseInvoiceReports = async (
  jobsiteMonthReport: JobsiteMonthReportDocument
) => {
  try {
    // Get all expense invoices
    const jobsite = await jobsiteMonthReport.getJobsite();
    const expenseInvoices = await jobsite.getExpenseInvoices();

    const invoices: InvoiceReportClass[] = [];
    for (let i = 0; i < expenseInvoices.length; i++) {
      const expenseInvoice = expenseInvoices[i];

      if (
        dayjs(expenseInvoice.date).isSame(
          dayjs(jobsiteMonthReport.startOfMonth),
          "month"
        )
      ) {
        const invoice: InvoiceReportClass = {
          invoice: expenseInvoice._id,
          value: expenseInvoice.cost,
          internal: expenseInvoice.internal,
          accrual: expenseInvoice.accrual,
        };

        invoices.push(invoice);
      }
    }

    jobsiteMonthReport.expenseInvoices = invoices;

    return;
  } catch (error) {
    console.error("Error in Expense Invoice Reports", error);
  }
};

const revenueInvoiceReports = async (
  jobsiteMonthReport: JobsiteMonthReportDocument
) => {
  try {
    // Get all revenue invoices
    const jobsite = await jobsiteMonthReport.getJobsite();
    const revenueInvoices = await jobsite.getRevenueInvoices();

    const invoices: InvoiceReportClass[] = [];
    for (let i = 0; i < revenueInvoices.length; i++) {
      const revenueInvoice = revenueInvoices[i];

      if (
        dayjs(revenueInvoice.date).isSame(
          dayjs(jobsiteMonthReport.startOfMonth),
          "month"
        )
      ) {
        const invoice: InvoiceReportClass = {
          invoice: revenueInvoice._id,
          value: revenueInvoice.cost,
          internal: revenueInvoice.internal,
          accrual: revenueInvoice.accrual,
        };

        invoices.push(invoice);
      }
    }

    jobsiteMonthReport.revenueInvoices = invoices;

    return;
  } catch (error) {
    console.error("Error in Revenue Invoice Reports", error);
  }
};

const summary = async (jobsiteMonthReport: JobsiteMonthReportDocument) => {
  try {
    let externalExpenseInvoiceValue = 0,
      internalExpenseInvoiceValue = 0,
      accrualExpenseInvoiceValue = 0;
    for (let i = 0; i < jobsiteMonthReport.expenseInvoices.length; i++) {
      if (jobsiteMonthReport.expenseInvoices[i].accrual) {
        accrualExpenseInvoiceValue +=
          jobsiteMonthReport.expenseInvoices[i].value;
      } else if (jobsiteMonthReport.expenseInvoices[i].internal) {
        internalExpenseInvoiceValue +=
          jobsiteMonthReport.expenseInvoices[i].value;
      } else {
        externalExpenseInvoiceValue +=
          jobsiteMonthReport.expenseInvoices[i].value;
      }
    }

    let externalRevenueInvoiceValue = 0,
      internalRevenueInvoiceValue = 0,
      accrualRevenueInvoiceValue = 0;
    for (let i = 0; i < jobsiteMonthReport.revenueInvoices.length; i++) {
      if (jobsiteMonthReport.revenueInvoices[i].accrual) {
        accrualRevenueInvoiceValue +=
          jobsiteMonthReport.revenueInvoices[i].value;
      } else if (jobsiteMonthReport.revenueInvoices[i].internal) {
        internalRevenueInvoiceValue +=
          jobsiteMonthReport.revenueInvoices[i].value;
      } else {
        externalRevenueInvoiceValue +=
          jobsiteMonthReport.revenueInvoices[i].value;
      }
    }

    const summary: RangeSummaryReportClass = {
      externalExpenseInvoiceValue,
      internalExpenseInvoiceValue,
      accrualExpenseInvoiceValue,
      externalRevenueInvoiceValue,
      internalRevenueInvoiceValue,
      accrualRevenueInvoiceValue,
    };

    jobsiteMonthReport.summary = summary;

    return;
  } catch (error) {
    console.error("Error in summer", error);
  }
};

const issues = async (jobsiteMonthReport: JobsiteMonthReportDocument) => {
  try {
    const dayReports = await jobsiteMonthReport.getDayReports();

    jobsiteMonthReport.issues = [
      ...dayReportIssueGeneration(dayReports),
      ...(await jobsiteReportIssueGenerator(
        await jobsiteMonthReport.getJobsite(),
        {
          startTime: jobsiteMonthReport.startOfMonth,
          endTime: dayjs(jobsiteMonthReport.startOfMonth)
            .endOf("month")
            .toDate(),
        }
      )),
    ];
  } catch (error) {
    console.error("Error in issues", error);
  }
};

const excel = async (jobsiteMonthReport: JobsiteMonthReportDocument) => {
  try {
    const workbook = await generateForRangeReport(jobsiteMonthReport);

    const buffer = await getWorkbookBuffer(workbook);

    console.log("got here");

    await uploadFile(
      await jobsiteMonthReport.getExcelName(),
      buffer,
      SupportedMimeTypes.XLSX
    );
  } catch (error) {
    console.error("Error in excel", error);
  }
};

export default {
  expenseInvoiceReports,
  revenueInvoiceReports,
  summary,
  issues,
  excel,
};
