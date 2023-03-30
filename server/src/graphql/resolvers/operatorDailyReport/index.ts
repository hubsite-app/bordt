import {
  OperatorDailyReport,
  OperatorDailyReportClass,
  OperatorDailyReportDocument,
  UserClass,
  VehicleClass,
  VehicleIssueClass,
} from "@models";
import { IContext, ListOptionData } from "@typescript/graphql";
import { Id } from "@typescript/models";
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import mutations, { OperatorDailyReportCreateData } from "./mutations";

@Resolver(() => OperatorDailyReportClass)
export default class OperatorDailyReportResolver {
  /**
   * ----- Field Resolvers -----
   */

  @FieldResolver(() => VehicleClass)
  async vehicle(@Root() operatorDailyReport: OperatorDailyReportDocument) {
    return operatorDailyReport.getVehicle();
  }

  @FieldResolver(() => UserClass)
  async author(@Root() operatorDailyReport: OperatorDailyReportDocument) {
    return operatorDailyReport.getAuthor();
  }

  @FieldResolver(() => [VehicleIssueClass])
  async vehicleIssues(
    @Root() operatorDailyReport: OperatorDailyReportDocument
  ) {
    return operatorDailyReport.getVehicleIssues();
  }

  /**
   * --- Query ---
   */

  @Query(() => OperatorDailyReportClass)
  async operatorDailyReport(@Arg("id", () => ID) id: Id) {
    return OperatorDailyReport.getById(id);
  }

  @Query(() => [OperatorDailyReportClass])
  async operatorDailyReports(
    @Arg("options", () => ListOptionData, { nullable: true })
    options?: ListOptionData
  ) {
    return OperatorDailyReport.getList({
      ...options,
    });
  }

  /**
   * ----- Mutations -----
   */

  @Authorized()
  @Mutation(() => OperatorDailyReportClass)
  async operatorDailyReportCreate(
    @Arg("vehicleId", () => ID) vehicleId: Id,
    @Arg("data") data: OperatorDailyReportCreateData,
    @Ctx() context: IContext
  ) {
    if (!context.user) throw new Error("Must be logged in to do this");
    return mutations.create(vehicleId, context.user, data);
  }
}
