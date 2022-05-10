import { SearchOptions } from "@graphql/types/query";
import {
  CrewClass,
  DailyReportClass,
  InvoiceClass,
  Jobsite,
  JobsiteClass,
  JobsiteDayReportClass,
  JobsiteDocument,
  JobsiteMaterialClass,
  MaterialShipmentClass,
  JobsiteMonthReportClass,
  JobsiteYearReportClass,
} from "@models";
import { ListOptionData } from "@typescript/graphql";
import { Id } from "@typescript/models";
import {
  Arg,
  Authorized,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { InvoiceData } from "../invoice/mutations";
import { JobsiteMaterialCreateData } from "../jobsiteMaterial/mutations";
import mutations, {
  JobsiteCreateData,
  JobsiteUpdateData,
  TruckingTypeRateData,
} from "./mutations";

@Resolver(() => JobsiteClass)
export default class JobsiteResolver {
  /**
   * ----- Field Resolvers -----
   */

  @FieldResolver(() => [CrewClass])
  async crews(@Root() jobsite: JobsiteDocument) {
    return jobsite.getCrews();
  }

  @FieldResolver(() => [DailyReportClass])
  async dailyReports(@Root() jobsite: JobsiteDocument) {
    return jobsite.getDailyReports();
  }

  @FieldResolver(() => [JobsiteMaterialClass])
  async materials(@Root() jobsite: JobsiteDocument) {
    return jobsite.getMaterials();
  }

  @FieldResolver(() => [InvoiceClass])
  async expenseInvoices(@Root() jobsite: JobsiteDocument) {
    return jobsite.getExpenseInvoices();
  }

  @FieldResolver(() => [InvoiceClass])
  async revenueInvoices(@Root() jobsite: JobsiteDocument) {
    return jobsite.getRevenueInvoices();
  }

  @FieldResolver(() => [MaterialShipmentClass])
  async nonCostedMaterialShipments(@Root() jobsite: JobsiteDocument) {
    return jobsite.getNonCostedMaterialShipments();
  }

  @FieldResolver(() => [JobsiteDayReportClass])
  async dayReports(@Root() jobsite: JobsiteDocument) {
    return jobsite.getDayReports();
  }

  @FieldResolver(() => [JobsiteMonthReportClass])
  async monthReports(@Root() jobsite: JobsiteDocument) {
    return jobsite.getMonthReports();
  }

  @FieldResolver(() => [JobsiteYearReportClass])
  async yearReports(@Root() jobsite: JobsiteDocument) {
    return jobsite.getYearReports();
  }

  /**
   * ----- Queries -----
   */

  @Query(() => JobsiteClass)
  async jobsite(@Arg("id") id: string) {
    return Jobsite.getById(id);
  }

  @Query(() => [JobsiteClass])
  async jobsites(
    @Arg("options", () => ListOptionData, { nullable: true })
    options?: ListOptionData
  ) {
    return Jobsite.getList(options);
  }

  @Query(() => [JobsiteClass])
  async jobsiteSearch(
    @Arg("searchString") searchString: string,
    @Arg("options", () => SearchOptions, { nullable: true })
    options: SearchOptions
  ) {
    return (await Jobsite.search(searchString, options)).map(
      (object) => object.jobsite
    );
  }

  /**
   * ----- Mutations -----
   */

  @Authorized(["ADMIN"])
  @Mutation(() => JobsiteClass)
  async jobsiteCreate(@Arg("data") data: JobsiteCreateData) {
    return mutations.create(data);
  }

  @Authorized(["ADMIN"])
  @Mutation(() => JobsiteClass)
  async jobsiteUpdate(
    @Arg("id", () => ID, { nullable: false }) id: Id,
    @Arg("data", () => JobsiteUpdateData, { nullable: false })
    data: JobsiteUpdateData
  ) {
    return mutations.update(id, data);
  }

  @Authorized(["ADMIN"])
  @Mutation(() => JobsiteClass)
  async jobsiteAddMaterial(
    @Arg("jobsiteId") jobsiteId: string,
    @Arg("data") data: JobsiteMaterialCreateData
  ) {
    return mutations.addMaterial(jobsiteId, data);
  }

  @Authorized(["ADMIN"])
  @Mutation(() => JobsiteClass)
  async jobsiteAddExpenseInvoice(
    @Arg("jobsiteId") jobsiteId: string,
    @Arg("data") data: InvoiceData
  ) {
    return mutations.addExpenseInvoice(jobsiteId, data);
  }

  @Authorized(["ADMIN"])
  @Mutation(() => JobsiteClass)
  async jobsiteAddRevenueInvoice(
    @Arg("jobsiteId") jobsiteId: string,
    @Arg("data") data: InvoiceData
  ) {
    return mutations.addRevenueInvoice(jobsiteId, data);
  }

  @Authorized(["ADMIN"])
  @Mutation(() => JobsiteClass)
  async jobsiteSetTruckingRates(
    @Arg("id") id: string,
    @Arg("data", () => [TruckingTypeRateData]) data: TruckingTypeRateData[]
  ) {
    return mutations.setTruckingRates(id, data);
  }

  @Authorized(["ADMIN", "PM"])
  @Mutation(() => JobsiteClass)
  async jobsiteGenerateDayReports(@Arg("id") id: string) {
    return mutations.generateDayReports(id);
  }
}