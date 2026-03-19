const Script = require("../models/Script");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

/**
 * GET /api/scripts
 * Get all scripts for the authenticated user.
 */
exports.getScripts = async (req, res, next) => {
  try {
    const scripts = await Script.find({
      userId: req.user._id,
      isArchived: false,
    })
      .sort({ updatedAt: -1 })
      .select("-blocks"); // exclude heavy blocks from list view

    res.status(200).json({
      status: "success",
      results: scripts.length,
      data: { scripts },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/scripts/:id
 * Get a single script with all blocks.
 */
exports.getScript = async (req, res, next) => {
  try {
    const script = await Script.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!script) {
      return next(new AppError("Script not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { script },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/scripts
 * Create a new script.
 */
exports.createScript = async (req, res, next) => {
  try {
    const { title, blocks } = req.body;

    const script = await Script.create({
      title: title || "Untitled Screenplay",
      userId: req.user._id,
      blocks: blocks || [
        { type: "scene", content: "INT. COFFEE SHOP - DAY" },
        {
          type: "action",
          content: "The morning rush. Steam rises from a hundred cups.",
        },
      ],
    });

    logger.info(`Script created: "${script.title}" by ${req.user.email}`);

    res.status(201).json({
      status: "success",
      data: { script },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/scripts/:id
 * Update a script (title and/or blocks).
 */
exports.updateScript = async (req, res, next) => {
  try {
    const { title, blocks } = req.body;

    const script = await Script.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!script) return next(new AppError("Script not found.", 404));

    if (title !== undefined) script.title = title;
    if (blocks !== undefined) script.blocks = blocks;

    await script.save(); // triggers pre-save hook to recalc stats

    res.status(200).json({
      status: "success",
      data: { script },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/scripts/:id
 * Delete a script (hard delete).
 */
exports.deleteScript = async (req, res, next) => {
  try {
    const script = await Script.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!script) return next(new AppError("Script not found.", 404));

    logger.info(`Script deleted: "${script.title}" by ${req.user.email}`);

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/scripts/:id/archive
 * Soft-archive a script.
 */
exports.archiveScript = async (req, res, next) => {
  try {
    const script = await Script.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isArchived: true },
      { new: true }
    );

    if (!script) return next(new AppError("Script not found.", 404));

    res.status(200).json({ status: "success", data: { script } });
  } catch (err) {
    next(err);
  }
};
