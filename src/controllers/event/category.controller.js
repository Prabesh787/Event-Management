import Category from "../../models/event/category.model.js";
import { User } from "../../models/auth/user.model.js";

export const getAllCategories = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("role institution");

    let filter = {};
    
    // Logic for filtering:
    if (user && user.role === 'INSTITUTION_ADMIN') {
      // Institution admins see ONLY their own categories as requested
      filter = { institution: user.institution };
    } else if (user && (user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN')) {
      // System admins see EVERYTHING
      filter = {};
    } else {
      // Students or others see global categories
      filter = { institution: null };
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const user = await User.findById(req.userId).select("role institution");

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Prevent duplicate names within the same scope (global or institution)
    const existingFilter = { name: { $regex: `^${name.trim()}$`, $options: 'i' } };
    let institutionId = null;
    if (user && user.role === 'INSTITUTION_ADMIN' && user.institution) {
      institutionId = user.institution;
      existingFilter.institution = institutionId;
    } else {
      existingFilter.institution = null; // Global category
    }

    const existing = await Category.findOne(existingFilter);
    if (existing) {
      return res.status(400).json({ success: false, message: `Category "${name}" already exists for this scope.` });
    }

    const category = await Category.create({ 
      name: name.trim(), 
      description: description || "",
      createdBy: req.userId,
      institution: institutionId
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    await category.save();
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
