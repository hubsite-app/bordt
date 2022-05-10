import { logger } from "@logger";
import {
  DailyReport,
  DailyReportDocument,
  Employee,
  EmployeeWorkDocument,
  JobsiteDayReportDocument,
  JobsiteMaterial,
  MaterialShipmentDocument,
  Vehicle,
  VehicleWorkDocument,
} from "@models";
import { CrewTypes } from "@typescript/crew";
import {
  CrewTypeOnSiteSummaryClass,
  OnSiteSummaryReportClass,
} from "@typescript/jobsiteReports";
import { Id } from "@typescript/models";
import errorHandler from "@utils/errorHandler";
import getRateForTime from "@utils/getRateForTime";
import getTruckingRateForTime from "@utils/getTruckingRateForTime";
import dayjs from "dayjs";
import {
  EmployeeReportClass,
  MaterialReportClass,
  VehicleReportClass,
  NonCostedMaterialReportClass,
  TruckingReportClass,
} from "../schema/subDocument";

const reports = async (jobsiteDayReport: JobsiteDayReportDocument) => {
  const dailyReports = await DailyReport.getByJobsiteDayReport(
    jobsiteDayReport
  );

  jobsiteDayReport.dailyReports = dailyReports.map((report) => report._id);

  /**
   * Generate Employee reports
   */
  await jobsiteDayReport.generateEmployeeReports(dailyReports);

  /**
   * Generate Vehicle reports
   */
  await jobsiteDayReport.generateVehicleReports(dailyReports);

  /**
   * Generate Material reports
   */
  await jobsiteDayReport.generateMaterialReports(dailyReports);

  /**
   * Generate Non-costed Material reports
   */
  await jobsiteDayReport.generateNonCostedMaterialReports(dailyReports);

  /**
   * Generate Trucking reports
   */
  await jobsiteDayReport.generateTruckingReports(dailyReports);

  /**
   * Generate Crew Types
   */

  await jobsiteDayReport.generateCrewTypes();

  /**
   * Generate Summary report
   */
  await jobsiteDayReport.generateSummaryReports();

  return;
};

const employeeReports = async (
  jobsiteDayReport: JobsiteDayReportDocument,
  dailyReports?: DailyReportDocument[]
) => {
  if (!dailyReports || dailyReports.length === 0) {
    dailyReports = await DailyReport.getByJobsiteDayReport(jobsiteDayReport);
  }

  // Get all employee hours
  interface EmployeeWorkObject {
    work: EmployeeWorkDocument;
    crewType: CrewTypes;
  }
  let employeeWorkObject: EmployeeWorkObject[] = [];
  for (let i = 0; i < dailyReports.length; i++) {
    let crewType = CrewTypes.Other;
    try {
      crewType = (await dailyReports[i].getCrew()).type;
    } catch (e) {
      logger.error("employeeReports: unable to find crew");
    }

    const employeeWork = await dailyReports[i].getEmployeeWork();

    employeeWorkObject = [
      ...employeeWorkObject,
      ...employeeWork.map((work) => {
        return {
          work,
          crewType,
        };
      }),
    ];
  }

  // Catalog all employees and their work
  const employeeObjects: {
    employee: Id;
    employeeWork: EmployeeWorkDocument[];
    crewType: CrewTypes;
  }[] = [];
  for (let i = 0; i < employeeWorkObject.length; i++) {
    let matchedIndex = -1;
    for (let j = 0; j < employeeObjects.length; j++) {
      if (
        employeeObjects[j].employee.toString() ===
          employeeWorkObject[i].work.employee?.toString() &&
        employeeObjects[j].crewType === employeeWorkObject[i].crewType
      )
        matchedIndex = j;
    }

    if (matchedIndex === -1) {
      employeeObjects.push({
        employee: employeeWorkObject[i].work.employee?.toString() || "",
        employeeWork: [employeeWorkObject[i].work],
        crewType: employeeWorkObject[i].crewType,
      });
    } else {
      employeeObjects[matchedIndex].employeeWork.push(
        employeeWorkObject[i].work
      );
    }
  }

  // Create all EmployeeReports
  const employeeReports: EmployeeReportClass[] = [];
  for (let i = 0; i < employeeObjects.length; i++) {
    const employeeObject = employeeObjects[i];

    let hours = 0;
    for (let j = 0; j < employeeObject.employeeWork.length; j++) {
      const work = employeeObject.employeeWork[j];

      hours += Math.abs(
        dayjs(work.startTime).diff(dayjs(work.endTime), "hours", true)
      );
    }

    // Create and push report
    try {
      const employee = await Employee.getById(employeeObject.employee, {
        throwError: true,
      });

      if (!employee) throw new Error("Cannot find employee");

      const employeeReport: EmployeeReportClass = {
        employee: employee._id,
        employeeWork: employeeObject.employeeWork.map((object) => object._id),
        crewType: employeeObject.crewType,
        hours,
        rate: await employee.getRateForTime(jobsiteDayReport.date),
      };

      employeeReports.push(employeeReport);
    } catch (error) {
      errorHandler("Unable to create employee report", error);
    }
  }

  jobsiteDayReport.employees = employeeReports;

  return;
};

const vehicleReports = async (
  jobsiteDayReport: JobsiteDayReportDocument,
  dailyReports?: DailyReportDocument[]
) => {
  if (!dailyReports || dailyReports.length === 0) {
    dailyReports = await DailyReport.getByJobsiteDayReport(jobsiteDayReport);
  }

  // Get all vehicle hours
  interface VehicleWorkObject {
    work: VehicleWorkDocument;
    crewType: CrewTypes;
  }
  let vehicleWorkObject: VehicleWorkObject[] = [];
  for (let i = 0; i < dailyReports.length; i++) {
    let crewType = CrewTypes.Other;
    try {
      crewType = (await dailyReports[i].getCrew()).type;
    } catch (e) {
      logger.error("vehicleReports: unable to find crew");
    }

    const vehicleWork = await dailyReports[i].getVehicleWork();

    vehicleWorkObject = [
      ...vehicleWorkObject,
      ...vehicleWork.map((work) => {
        return {
          work,
          crewType,
        };
      }),
    ];
  }

  // Catalog all vehicles and their work
  const vehicleObjects: {
    vehicle: Id;
    vehicleWork: VehicleWorkDocument[];
    crewType: CrewTypes;
  }[] = [];
  for (let i = 0; i < vehicleWorkObject.length; i++) {
    let matchedIndex = -1;
    for (let j = 0; j < vehicleObjects.length; j++) {
      if (
        vehicleObjects[j].vehicle.toString() ===
          vehicleWorkObject[i].work.vehicle?.toString() &&
        vehicleObjects[j].crewType === vehicleWorkObject[i].crewType
      )
        matchedIndex = j;
    }

    if (matchedIndex === -1) {
      vehicleObjects.push({
        vehicle: vehicleWorkObject[i].work.vehicle?.toString() || "",
        vehicleWork: [vehicleWorkObject[i].work],
        crewType: vehicleWorkObject[i].crewType,
      });
    } else {
      vehicleObjects[matchedIndex].vehicleWork.push(vehicleWorkObject[i].work);
    }
  }

  // Create all Vehicle Reports
  const vehicleReports: VehicleReportClass[] = [];
  for (let i = 0; i < vehicleObjects.length; i++) {
    const vehicleObject = vehicleObjects[i];

    let hours = 0;
    for (let j = 0; j < vehicleObject.vehicleWork.length; j++) {
      const work = vehicleObject.vehicleWork[j];

      hours += work.hours;
    }

    // Create and push report
    try {
      const vehicle = await Vehicle.getById(vehicleObject.vehicle, {
        throwError: true,
      });

      if (!vehicle) throw new Error("unable to find vehicle");

      const vehicleReport: VehicleReportClass = {
        vehicle: vehicle._id,
        vehicleWork: vehicleObject.vehicleWork.map((object) => object._id),
        crewType: vehicleObject.crewType,
        hours,
        rate: await vehicle.getRateForTime(jobsiteDayReport.date),
      };

      vehicleReports.push(vehicleReport);
    } catch (error) {
      errorHandler("Unable to create vehicle report", error);
    }
  }

  jobsiteDayReport.vehicles = vehicleReports;

  return;
};

const materialReports = async (
  jobsiteDayReport: JobsiteDayReportDocument,
  dailyReports?: DailyReportDocument[]
) => {
  if (!dailyReports || dailyReports.length === 0) {
    dailyReports = await DailyReport.getByJobsiteDayReport(jobsiteDayReport);
  }

  // Get all relevant material shipments
  interface ShipmentObject {
    materialShipment: MaterialShipmentDocument;
    crewType: CrewTypes;
  }
  let materialShipmentObjects: ShipmentObject[] = [];
  for (let i = 0; i < dailyReports.length; i++) {
    let crewType = CrewTypes.Other;
    try {
      crewType = (await dailyReports[i].getCrew()).type;
    } catch (e) {
      logger.error("materialReports: unable to find crew");
    }

    const materialShipments = await dailyReports[i].getMaterialShipments();
    const sortedShipments = materialShipments.filter(
      (shipment) => shipment.noJobsiteMaterial === false
    );

    materialShipmentObjects = [
      ...materialShipmentObjects,
      ...sortedShipments.map((shipment) => {
        return {
          materialShipment: shipment,
          crewType,
        };
      }),
    ];
  }

  // Catalog all jobsiteMaterials and their shipments
  const jobsiteMaterialObjects: {
    jobsiteMaterial: Id;
    deliveredRateId?: Id;
    materialShipments: MaterialShipmentDocument[];
    crewType: CrewTypes;
  }[] = [];
  for (let i = 0; i < materialShipmentObjects.length; i++) {
    let matchedIndex = -1;
    for (let j = 0; j < jobsiteMaterialObjects.length; j++) {
      if (
        jobsiteMaterialObjects[j].jobsiteMaterial.toString() ===
          materialShipmentObjects[
            i
          ].materialShipment.jobsiteMaterial?.toString() &&
        jobsiteMaterialObjects[j].crewType ===
          materialShipmentObjects[i].crewType &&
        jobsiteMaterialObjects[j].deliveredRateId?.toString() ===
          materialShipmentObjects[
            i
          ].materialShipment.vehicleObject?.deliveredRateId?.toString()
      )
        matchedIndex = j;
    }

    if (matchedIndex === -1) {
      jobsiteMaterialObjects.push({
        jobsiteMaterial:
          materialShipmentObjects[
            i
          ].materialShipment.jobsiteMaterial?.toString() || "",
        materialShipments: [materialShipmentObjects[i].materialShipment],
        crewType: materialShipmentObjects[i].crewType,
        deliveredRateId:
          materialShipmentObjects[i].materialShipment.vehicleObject
            ?.deliveredRateId,
      });
    } else {
      jobsiteMaterialObjects[matchedIndex].materialShipments.push(
        materialShipmentObjects[i].materialShipment
      );
    }
  }

  // Create all MaterialReports
  const materialReports: MaterialReportClass[] = [];
  for (let i = 0; i < jobsiteMaterialObjects.length; i++) {
    const jobsiteMaterialObject = jobsiteMaterialObjects[i];

    let quantity = 0;
    for (let j = 0; j < jobsiteMaterialObject.materialShipments.length; j++) {
      const shipment = jobsiteMaterialObject.materialShipments[j];

      quantity += shipment.quantity;
    }

    // Create and push report
    try {
      const jobsiteMaterial = await JobsiteMaterial.getById(
        jobsiteMaterialObject.jobsiteMaterial,
        {
          throwError: true,
        }
      );

      if (!jobsiteMaterial) throw new Error("Could not find jobsite material");

      if (jobsiteMaterialObject.deliveredRateId) {
        const deliveredRate = jobsiteMaterial.deliveredRates.find(
          (rate) =>
            rate._id?.toString() ===
            jobsiteMaterialObject.deliveredRateId?.toString()
        );

        if (deliveredRate) {
          const materialReport: MaterialReportClass = {
            jobsiteMaterial: jobsiteMaterial._id,
            deliveredRateId: deliveredRate._id,
            materialShipments: jobsiteMaterialObject.materialShipments
              .filter(
                (shipment) =>
                  shipment.vehicleObject?.deliveredRateId?.toString() ===
                  deliveredRate._id?.toString()
              )
              .map((object) => object._id),
            crewType: jobsiteMaterialObject.crewType,
            quantity,
            rate: getRateForTime(deliveredRate.rates, jobsiteDayReport.date),
          };

          materialReports.push(materialReport);
        }
      } else {
        const materialReport: MaterialReportClass = {
          jobsiteMaterial: jobsiteMaterial._id,
          materialShipments: jobsiteMaterialObject.materialShipments.map(
            (object) => object._id
          ),
          crewType: jobsiteMaterialObject.crewType,
          quantity,
          rate: await jobsiteMaterial.getRateForTime(jobsiteDayReport.date),
        };

        materialReports.push(materialReport);
      }
    } catch (error) {
      errorHandler("Unable to create material report", error);
    }
  }

  jobsiteDayReport.materials = materialReports;

  return;
};

const nonCostedMaterialReports = async (
  jobsiteDayReport: JobsiteDayReportDocument,
  dailyReports?: DailyReportDocument[]
) => {
  if (!dailyReports || dailyReports.length === 0) {
    dailyReports = await DailyReport.getByJobsiteDayReport(jobsiteDayReport);
  }

  // Get all relevant material shipments
  interface ShipmentObject {
    materialShipment: MaterialShipmentDocument;
    crewType: CrewTypes;
  }
  let materialShipmentObjects: ShipmentObject[] = [];
  for (let i = 0; i < dailyReports.length; i++) {
    let crewType = CrewTypes.Other;
    try {
      crewType = (await dailyReports[i].getCrew()).type;
    } catch (e) {
      logger.error("nonCostedMaterials: unable to find crew");
    }

    const materialShipments = await dailyReports[i].getMaterialShipments();
    const sortedShipments = materialShipments.filter(
      (shipment) => shipment.noJobsiteMaterial === true
    );

    materialShipmentObjects = [
      ...materialShipmentObjects,
      ...sortedShipments.map((shipment) => {
        return {
          materialShipment: shipment,
          crewType,
        };
      }),
    ];
  }

  // Catalog all material supplier combinations and their shipments
  const uniqueMaterialObjects: {
    materialName: string;
    supplierName: string;
    materialShipments: MaterialShipmentDocument[];
    crewType: CrewTypes;
  }[] = [];
  for (let i = 0; i < materialShipmentObjects.length; i++) {
    let matchedIndex = -1;
    for (let j = 0; j < uniqueMaterialObjects.length; j++) {
      if (
        uniqueMaterialObjects[j].materialName.toString() ===
          materialShipmentObjects[i].materialShipment.shipmentType &&
        uniqueMaterialObjects[j].supplierName.toString() ===
          materialShipmentObjects[i].materialShipment.supplier &&
        uniqueMaterialObjects[j].crewType ===
          materialShipmentObjects[i].crewType
      )
        matchedIndex = j;
    }

    if (matchedIndex === -1) {
      uniqueMaterialObjects.push({
        materialName:
          materialShipmentObjects[i].materialShipment.shipmentType || "",
        supplierName:
          materialShipmentObjects[i].materialShipment.supplier || "",
        materialShipments: [materialShipmentObjects[i].materialShipment],
        crewType: materialShipmentObjects[i].crewType,
      });
    } else {
      uniqueMaterialObjects[matchedIndex].materialShipments.push(
        materialShipmentObjects[i].materialShipment
      );
    }
  }

  // Create all NonCostedMaterialReports
  const nonCostedMaterialReports: NonCostedMaterialReportClass[] = [];
  for (let i = 0; i < uniqueMaterialObjects.length; i++) {
    const uniqueMaterialObject = uniqueMaterialObjects[i];

    let quantity = 0;
    for (let j = 0; j < uniqueMaterialObject.materialShipments.length; j++) {
      const shipment = uniqueMaterialObject.materialShipments[j];

      quantity += shipment.quantity;
    }

    // Create and push report
    try {
      const materialReport: NonCostedMaterialReportClass = {
        materialName: uniqueMaterialObject.materialName || "Not Found",
        supplierName: uniqueMaterialObject.supplierName || "Not Found",
        materialShipments: uniqueMaterialObject.materialShipments.map(
          (object) => object._id
        ),
        crewType: uniqueMaterialObject.crewType,
        quantity,
      };

      nonCostedMaterialReports.push(materialReport);
    } catch (error) {
      errorHandler("Unable to create material report", error);
    }
  }

  jobsiteDayReport.nonCostedMaterials = nonCostedMaterialReports;

  return;
};

const truckingReports = async (
  jobsiteDayReport: JobsiteDayReportDocument,
  dailyReports?: DailyReportDocument[]
) => {
  if (!dailyReports || dailyReports.length === 0) {
    dailyReports = await DailyReport.getByJobsiteDayReport(jobsiteDayReport);
  }

  // Get all relevant material shipments
  interface ShipmentObject {
    materialShipment: MaterialShipmentDocument;
    crewType: CrewTypes;
  }
  let materialShipmentObjects: ShipmentObject[] = [];
  for (let i = 0; i < dailyReports.length; i++) {
    let crewType = CrewTypes.Other;
    try {
      crewType = (await dailyReports[i].getCrew()).type;
    } catch (e) {
      logger.error("truckingReports: unable to find crew");
    }

    const materialShipments = await dailyReports[i].getMaterialShipments();

    // All material shipments w/ costed trucking
    const sortedShipments = materialShipments.filter(
      (shipment) => !!shipment.vehicleObject?.truckingRateId
    );

    materialShipmentObjects = [
      ...materialShipmentObjects,
      ...sortedShipments.map((shipment) => {
        return {
          materialShipment: shipment,
          crewType,
        };
      }),
    ];
  }

  // Catalog all trucks and their shipments
  const uniqueTruckingObjects: {
    truckingRateId: Id;
    materialShipments: MaterialShipmentDocument[];
    crewType: CrewTypes;
  }[] = [];
  for (let i = 0; i < materialShipmentObjects.length; i++) {
    let matchedIndex = -1;
    for (let j = 0; j < uniqueTruckingObjects.length; j++) {
      if (
        materialShipmentObjects[i].materialShipment.vehicleObject
          ?.truckingRateId &&
        uniqueTruckingObjects[j].truckingRateId.toString() ===
          materialShipmentObjects[
            i
          ].materialShipment.vehicleObject?.truckingRateId?.toString() &&
        uniqueTruckingObjects[j].crewType ===
          materialShipmentObjects[i].crewType
      )
        matchedIndex = j;
    }

    if (matchedIndex === -1) {
      uniqueTruckingObjects.push({
        truckingRateId:
          materialShipmentObjects[i].materialShipment.vehicleObject
            ?.truckingRateId || "",
        materialShipments: [materialShipmentObjects[i].materialShipment],
        crewType: materialShipmentObjects[i].crewType,
      });
    } else {
      uniqueTruckingObjects[matchedIndex].materialShipments.push(
        materialShipmentObjects[i].materialShipment
      );
    }
  }

  // Create all NonCostedMaterialReports
  const truckingReports: TruckingReportClass[] = [];
  for (let i = 0; i < uniqueTruckingObjects.length; i++) {
    const uniqueTruckingObject = uniqueTruckingObjects[i];

    let quantity = 0,
      hours = 0;
    for (let j = 0; j < uniqueTruckingObject.materialShipments.length; j++) {
      const shipment = uniqueTruckingObject.materialShipments[j];

      quantity += shipment.quantity;

      if (shipment.startTime && shipment.endTime)
        hours += Math.abs(
          dayjs(shipment.startTime).diff(dayjs(shipment.endTime), "hours", true)
        );
    }

    // Try create and push report
    try {
      const jobsite = await jobsiteDayReport.getJobsite();

      const truckingRate = jobsite.truckingRates.find(
        (rate) =>
          rate._id?.toString() ===
          uniqueTruckingObject.truckingRateId.toString()
      );
      if (!truckingRate)
        throw new Error("unable to find trucking rate in report creation");

      const finalRate = getTruckingRateForTime(
        truckingRate,
        jobsiteDayReport.date
      );
      if (!finalRate) throw new Error("unable to find trucking rate");

      const truckingReport: TruckingReportClass = {
        materialShipments: uniqueTruckingObject.materialShipments.map(
          (object) => object._id
        ),
        crewType: uniqueTruckingObject.crewType,
        quantity,
        hours,
        truckingType: truckingRate.title,
        rate: finalRate.rate,
        type: finalRate.type,
      };

      truckingReports.push(truckingReport);
    } catch (error) {
      errorHandler("Unable to create material report", error);
    }
  }

  jobsiteDayReport.trucking = truckingReports;

  return;
};

const crewTypes = async (jobsiteDayReport: JobsiteDayReportDocument) => {
  const crewTypes: CrewTypes[] = [];

  // Employee Crew Types
  for (let j = 0; j < jobsiteDayReport.employees.length; j++) {
    if (!crewTypes.includes(jobsiteDayReport.employees[j].crewType))
      crewTypes.push(jobsiteDayReport.employees[j].crewType);
  }

  // Vehicle Crew Types
  for (let j = 0; j < jobsiteDayReport.vehicles.length; j++) {
    if (!crewTypes.includes(jobsiteDayReport.vehicles[j].crewType))
      crewTypes.push(jobsiteDayReport.vehicles[j].crewType);
  }

  // Material Crew Types
  for (let j = 0; j < jobsiteDayReport.materials.length; j++) {
    if (!crewTypes.includes(jobsiteDayReport.materials[j].crewType))
      crewTypes.push(jobsiteDayReport.materials[j].crewType);
  }

  // Non-costed Material Crew Types
  for (let j = 0; j < jobsiteDayReport.nonCostedMaterials.length; j++) {
    if (!crewTypes.includes(jobsiteDayReport.nonCostedMaterials[j].crewType))
      crewTypes.push(jobsiteDayReport.nonCostedMaterials[j].crewType);
  }

  // Trucking Crew Types
  for (let j = 0; j < jobsiteDayReport.trucking.length; j++) {
    if (!crewTypes.includes(jobsiteDayReport.trucking[j].crewType))
      crewTypes.push(jobsiteDayReport.trucking[j].crewType);
  }

  jobsiteDayReport.crewTypes = crewTypes;

  return;
};

const summaryReport = async (jobsiteDayReport: JobsiteDayReportDocument) => {
  const crewTypeSummaries: CrewTypeOnSiteSummaryClass[] = [];
  const crewTypeIndices: { [crewType in CrewTypes]?: number } = {};
  for (let i = 0; i < jobsiteDayReport.crewTypes.length; i++) {
    const crewType = jobsiteDayReport.crewTypes[i];

    crewTypeSummaries.push({
      crewType,
      employeeCost: 0,
      employeeHours: 0,
      materialCost: 0,
      materialQuantity: 0,
      truckingCost: 0,
      truckingHours: 0,
      truckingQuantity: 0,
      vehicleCost: 0,
      vehicleHours: 0,
      nonCostedMaterialQuantity: 0,
    });

    crewTypeIndices[crewType] = crewTypeSummaries.length - 1;
  }

  /**
   * Employees
   */
  let employeeHours = 0,
    employeeCost = 0;
  for (let i = 0; i < jobsiteDayReport.employees.length; i++) {
    const report = jobsiteDayReport.employees[i];

    const hours = report.hours;
    const cost = report.hours * report.rate;

    employeeHours += jobsiteDayReport.employees[i].hours;
    employeeCost += cost;

    if (crewTypeIndices[report.crewType] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].employeeHours +=
        hours;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].employeeCost += cost;
    }
  }

  /**
   * Vehicles
   */
  let vehicleHours = 0,
    vehicleCost = 0;
  for (let i = 0; i < jobsiteDayReport.vehicles.length; i++) {
    const report = jobsiteDayReport.vehicles[i];

    const hours = report.hours;
    const cost = report.hours * report.rate;

    vehicleHours += hours;

    vehicleCost += cost;

    if (crewTypeIndices[report.crewType] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].vehicleHours +=
        hours;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].vehicleCost += cost;
    }
  }

  /**
   * Materials
   */
  let materialQuantity = 0,
    materialCost = 0;
  for (let i = 0; i < jobsiteDayReport.materials.length; i++) {
    const report = jobsiteDayReport.materials[i];

    const quantity = report.quantity;
    const cost = report.quantity * report.rate;

    materialQuantity += jobsiteDayReport.materials[i].quantity;
    materialCost += cost;

    if (crewTypeIndices[report.crewType] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].materialQuantity +=
        quantity;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].materialCost += cost;
    }
  }

  /**
   * Non Costed Materials
   */
  const nonCostedMaterialQuantity = 0;
  for (let i = 0; i < jobsiteDayReport.nonCostedMaterials.length; i++) {
    const report = jobsiteDayReport.nonCostedMaterials[i];

    const quantity = report.quantity;

    materialQuantity += quantity;

    if (crewTypeIndices[report.crewType] !== undefined) {
      crewTypeSummaries[
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        crewTypeIndices[report.crewType]!
      ].nonCostedMaterialQuantity += quantity;
    }
  }

  /**
   * Trucking
   */
  let truckingQuantity = 0,
    truckingHours = 0,
    truckingCost = 0;
  for (let i = 0; i < jobsiteDayReport.trucking.length; i++) {
    const report = jobsiteDayReport.trucking[i];

    const quantity = report.quantity;
    const hours = report.hours || 0;
    let cost = 0;
    if (report.type === "Hour") {
      cost = report.rate * (report.hours || 0);
    } else if (report.type === "Quantity") {
      cost = report.rate & report.quantity;
    }

    if (crewTypeIndices[report.crewType] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].truckingQuantity +=
        quantity;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].truckingHours +=
        hours;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      crewTypeSummaries[crewTypeIndices[report.crewType]!].truckingCost += cost;
    }

    truckingQuantity += quantity;

    truckingHours += hours;

    truckingCost += cost;
  }

  const summary: OnSiteSummaryReportClass = {
    crewTypeSummaries,
    employeeHours,
    employeeCost,
    vehicleHours,
    vehicleCost,
    materialQuantity,
    materialCost,
    nonCostedMaterialQuantity,
    truckingQuantity,
    truckingHours,
    truckingCost,
  };

  jobsiteDayReport.summary = summary;

  return;
};

export default {
  reports,
  employeeReports,
  vehicleReports,
  materialReports,
  nonCostedMaterialReports,
  truckingReports,
  crewTypes,
  summaryReport,
};