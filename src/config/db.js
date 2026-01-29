import mongoose from "mongoose";
import { DB, ENVIROMENT } from "./config.js";

let DB_URL = "";
if (ENVIROMENT === "dev") {
  DB_URL = `${DB.PROTOCOL}://${DB.HOST}:${DB.PORT}/${DB.NAME}`;
} else if (ENVIROMENT === "prod") {
  DB_URL = `${DB.PROTOCOL}://${DB.USER}:${DB.PWD}@${DB.HOST}:${DB.PORT}/${DB.NAME}`;
}

export const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL, {
      autoCreate: true,
      autoIndex: true,
    });
    console.log(`Database connected: ${DB.HOST} ${DB.NAME}`.cyan.underline);
  } catch (error) {
    console.error(`Database connection error: ${error}`. red.bold);
    process.exit(1);
  }
};

