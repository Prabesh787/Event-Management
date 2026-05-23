import mongoose from "mongoose";
import { DB, ENVIROMENT } from "./config.js";

const buildLocalUrl = () => {
  if (ENVIROMENT === "prod") {
    return `${DB.PROTOCOL}://${DB.USER}:${DB.PWD}@${DB.HOST}:${DB.PORT}/${DB.NAME}`;
  }
  return `${DB.PROTOCOL}://${DB.HOST}:${DB.PORT}/${DB.NAME}`;
};

export const connectDB = async () => {
  const DB_URL = process.env.MONGO_URI || buildLocalUrl();
  try {
    await mongoose.connect(DB_URL, {
      autoCreate: true,
      autoIndex: true,
    });
    const { host, name } = mongoose.connection;
    console.log(`Database connected: ${host} ${name}`.cyan.underline);
  } catch (error) {
    console.error(`Database connection error: ${error}`.red.bold);
    process.exit(1);
  }
};
