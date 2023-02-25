import * as dotenv from "dotenv";
import path from "path";
import "reflect-metadata";

// Setup environment variables
const production = process.env.NODE_ENV === "production";
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  dotenv.config({ path: path.join(__dirname, "..", ".env.development") });
}

import { Company, System, Vehicle } from "@models";
import updateDocuments from "@utils/updateDocuments";
import workers from "@workers";
import mongoose from "mongoose";
import createApp from "./app";
import elasticsearch from "./elasticsearch";
import errorHandler from "@utils/errorHandler";
import { bindEventEmitters } from "@events";
import saveAll from "@testing/saveAll";

// import saveAll from "@testing/saveAll";

let workerEnabled = true,
  apiEnabled = true;

if (process.env.APP_TYPE === "api") {
  apiEnabled = true;
  workerEnabled = false;
} else if (process.env.APP_TYPE === "worker") {
  workerEnabled = true;
  apiEnabled = false;
}

const main = async () => {
  try {
    if (process.env.NODE_ENV !== "test" && process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB Connected");

      if (!production) {
        // await seedDatabase();
      }
    }

    // Bind Event Emitters
    bindEventEmitters();

    // Start API server
    if (apiEnabled) {
      elasticsearch().catch((err) => {
        errorHandler(err.message, err);
      });

      const port = process.env.PORT || 8080;

      const app = await createApp();

      const server = app.listen(port, () =>
        console.log(`Server running on port: ${port}`)
      );

      // Set timeout to 3 minutes
      server.setTimeout(5 * 60 * 1000);
    }

    if (process.env.NODE_ENV !== "test") {
      if (apiEnabled) {
        if (production) {
          // await saveAll();
        } else {
          await saveAll([], "es");
        }

        // Temp: Find and remove all vehicles who's code starts with "ren"
        const rentalVehicles = await Vehicle.find({
          vehicleCode: { $regex: /^ren/i },
          archivedAt: null,
        });
        for (let i = 0; i < rentalVehicles.length; i++) {
          await rentalVehicles[i].archive();
          await rentalVehicles[i].save();
        }
        console.log(rentalVehicles.length);
      }

      await updateDocuments();

      await System.validateSystem();
      await Company.validateCompanies();

      // Enable worker
      if (workerEnabled) {
        workers();
      }
    }
  } catch (error: unknown) {
    console.error("Unknown server error:", error);
  }
};

main().catch((err) => console.error(err));
