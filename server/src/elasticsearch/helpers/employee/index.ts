import ElasticsearchClient from "../../client";
import { EmployeeDocument } from "@models";
import { logger } from "@logger";
import { ES_ensureEmployeeSettings } from "./settings";
import { ES_ensureEmployeeMapping } from "./mapping";
import ElasticSearchIndices from "@constants/ElasticSearchIndices";

export const ES_ensureEmployeeIndex = async () => {
  await ES_ensureEmployeeSettings();
  await ES_ensureEmployeeMapping();

  return;
};

export const ES_updateEmployee = async (employee: EmployeeDocument) => {
  if (process.env.NODE_ENV !== "test") {
    logger.debug(`Updating employee ${employee._id} in ES`);

    if (!employee.archivedAt) {
      await ElasticsearchClient.update({
        index: ElasticSearchIndices.Employee,
        id: employee._id.toString(),
        body: {
          doc: {
            name: employee.name,
            jobTitle: employee.jobTitle,
          },
          doc_as_upsert: true,
        },
      });
    } else {
      const existing = await ElasticsearchClient.get({
        id: employee._id.toString(),
        index: ElasticSearchIndices.Employee,
      });

      // Remove if necessary
      if (existing) {
        await ElasticsearchClient.delete({
          id: employee._id.toString(),
          index: ElasticSearchIndices.Employee,
        });
      }
    }
  }

  return;
};

export const ES_clearEmployee = async () => {
  logger.debug("Clearing employee index in ES");

  await ElasticsearchClient.indices.delete({
    index: ElasticSearchIndices.Employee,
  });

  return;
};