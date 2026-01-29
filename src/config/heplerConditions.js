import mongoose from "mongoose";
import ProductManagement from "../models/inventory/productModel/product.management.model.js";

export const buildSearchConditions = (fields) => {
  const condition = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;

    // Check if this field exists in the schema
    const schemaPath = ProductManagement.schema.paths[key];

    if (!schemaPath) {
      // Unknown field — skip it
      continue;
    }

    const fieldType = schemaPath.instance;

    if (fieldType === "ObjectID") {
      condition[key] = new mongoose.Types.ObjectId(value);
    } else if (fieldType === "String") {
      // Text search
      condition[key] = { $regex: value.trim(), $options: "i" };
    } else if (fieldType === "Number") {
      condition[key] = Number(value);
    } else if (fieldType === "Boolean") {
      condition[key] = value === "true" || value === true;
    } else {
      // Fallback: match exactly
      condition[key] = value;
    }
  }

  return condition;
};
