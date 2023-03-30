import { Employee } from "@models";
import ExcelJS from "exceljs";

export const generateForEmployees = async () => {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("Employees");

  // Get all employees
  const employees = await Employee.find();

  let url = "";
  if (process.env.APP_NAME === "Paving") {
    url = "https://paving.bowmark.ca";
  } else {
    url = "https://concrete.bowmark.ca";
  }

  worksheet.addTable({
    name: "Employees",
    ref: worksheet.getRow(1).getCell(1).address,
    columns: [
      { name: "Name", filterButton: true },
      { name: "Role", filterButton: true },
      { name: "Link" },
      { name: "Archived", filterButton: true },
    ],
    rows: [
      ...employees.map((employee) => {
        return [
          employee.name,
          employee.jobTitle,
          url + `/employee/${employee._id}`,
          employee.archivedAt ? "true" : "",
        ];
      }),
    ],
  });

  // Auto Column Width
  worksheet.columns.forEach((column) => {
    let dataMax = 2;

    if (column.values) {
      column.values.forEach((value) => {
        if (
          value &&
          (typeof value === "string" || typeof value === "number") &&
          `${value}`.length > dataMax
        )
          dataMax = `${value}`.length + 4;
      });
    }

    column.width = dataMax;
  });

  return workbook;
};