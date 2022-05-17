import { DefaultRateData, RatesData } from "@graphql/types/mutation";
import {
  Company,
  Invoice,
  Jobsite,
  JobsiteDocument,
  JobsiteMaterial,
  Material,
} from "@models";
import { TruckingRateTypes } from "@typescript/jobsite";
import { Id } from "@typescript/models";
import { Field, InputType } from "type-graphql";
import { InvoiceData } from "../invoice/mutations";
import { JobsiteMaterialCreateData } from "../jobsiteMaterial/mutations";

@InputType()
export class JobsiteCreateData {
  @Field({ nullable: false })
  public name!: string;

  @Field({ nullable: false })
  public jobcode!: string;

  @Field({ nullable: true })
  public description?: string;
}

@InputType()
export class JobsiteUpdateData {
  @Field({ nullable: false })
  public name!: string;
}

@InputType()
export class TruckingRateData extends RatesData {
  @Field(() => TruckingRateTypes, { nullable: false })
  public type!: TruckingRateTypes;
}

@InputType()
export class TruckingTypeRateData extends DefaultRateData {
  @Field(() => [TruckingRateData], { nullable: false })
  public rates!: TruckingRateData[];
}

const create = async (data: JobsiteCreateData): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.createDocument(data);

  await jobsite.save();

  return jobsite;
};

const update = async (
  id: Id,
  data: JobsiteUpdateData
): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.getById(id);
  if (!jobsite) throw new Error("Unable to find jobsite with that Id");

  await jobsite.updateDocument(data);

  await jobsite.save();

  return jobsite;
};

const addMaterial = async (
  jobsiteId: string,
  data: JobsiteMaterialCreateData
): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.getById(jobsiteId, { throwError: true });
  if (!jobsite) throw new Error("Unable to find jobsite");

  const material = await Material.getById(data.materialId, {
    throwError: true,
  });
  if (!material) throw new Error("Unable to find material");
  const supplier = await Company.getById(data.supplierId, {
    throwError: true,
  });
  if (!supplier) throw new Error("Unable to find supplier");

  const jobsiteMaterial = await JobsiteMaterial.createDocument({
    ...data,
    jobsite,
    material,
    supplier,
  });

  await jobsiteMaterial.save();

  await jobsite.save();

  return jobsite;
};

const addExpenseInvoice = async (
  jobsiteId: string,
  data: InvoiceData
): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.getById(jobsiteId, { throwError: true });
  if (!jobsite) throw new Error("Unable to find jobsite");

  const company = await Company.getById(data.companyId, {
    throwError: true,
  });
  if (!company) throw new Error("Unable to find company");

  const invoice = await Invoice.createDocument({
    ...data,
    company,
  });

  await jobsite.addExpenseInvoice(invoice);

  await invoice.save();

  await jobsite.save();

  return jobsite;
};

const addRevenueInvoice = async (
  jobsiteId: string,
  data: InvoiceData
): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.getById(jobsiteId, { throwError: true });
  if (!jobsite) throw new Error("Unable to find jobsite");

  const company = await Company.getById(data.companyId, {
    throwError: true,
  });
  if (!company) throw new Error("Unable to find company");

  const invoice = await Invoice.createDocument({
    ...data,
    company,
  });

  await jobsite.addRevenueInvoice(invoice);

  await invoice.save();

  await jobsite.save();

  return jobsite;
};

const setTruckingRates = async (
  jobsiteId: string,
  data: TruckingTypeRateData[]
): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.getById(jobsiteId, { throwError: true });
  if (!jobsite) throw new Error("Unable to find jobsite");

  await jobsite.setTruckingRates(data);

  await jobsite.save();

  return jobsite;
};

const generateDayReports = async (
  jobsiteId: string
): Promise<JobsiteDocument> => {
  const jobsite = await Jobsite.getById(jobsiteId, { throwError: true });
  if (!jobsite) throw new Error("Unable to find jobsite");

  await jobsite.requestGenerateDayReports();

  return jobsite;
};

const addTruckingRateToAll = async (
  systemRateItemIndex: number,
  systemRateIndex: number
) => {
  const jobsites = await Jobsite.addTruckingRateToAll(
    systemRateItemIndex,
    systemRateIndex
  );

  for (let i = 0; i < jobsites.length; i++) {
    await jobsites[i].save();
  }

  return jobsites;
};

export default {
  create,
  update,
  addMaterial,
  addExpenseInvoice,
  addRevenueInvoice,
  setTruckingRates,
  generateDayReports,
  addTruckingRateToAll,
};
