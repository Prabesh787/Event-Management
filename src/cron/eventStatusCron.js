import cron from "node-cron";
import Event from "../models/event/event.model.js";
import { EVENT_STATUS } from "../models/enum.js";

/**
 * Cron job to update event status once the end date is reached.
 * Runs every hour to check for completed events.
 */
const initEventStatusCron = () => {
  // Run every hour: '0 * * * *'
  // For testing, run every minute: '* * * * *'
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running Event Status Cron Job: Checking for completed events...");
      
      const now = new Date();
      
      // Find events that have ended but are not yet marked as COMPLETED or CANCELLED
      const eventsToUpdate = await Event.find({
        endDate: { $lt: now },
        status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.UPCOMING] }
      });

      if (eventsToUpdate.length > 0) {
        const updateResult = await Event.updateMany(
          {
            _id: { $in: eventsToUpdate.map(e => e._id) }
          },
          {
            $set: { status: EVENT_STATUS.COMPLETED }
          }
        );

        console.log(`Updated ${updateResult.modifiedCount} events to COMPLETED status.`);
      } else {
        console.log("No events to update.");
      }
    } catch (error) {
      console.error("Error in Event Status Cron Job:", error);
    }
  });
};

export default initEventStatusCron;
