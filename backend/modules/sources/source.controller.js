import { JobSource } from "./JobSource.js";
import Source from "./source.model.js";

/**
 * POST /api/source/register
 */
export const registerSource = async (req, res, next) => {
  try {
    const {
      source_name,
      base_url,
      active,
      max_application_per_hour,
      pollingInterval,
    } = req.body;

    // Because `name` is unique, don't allow registration
    // of an already existing source.
    const existingSource = await Source.exists({
      name: source_name,
    });

    if (existingSource) {
      return res.status(409).json({
        success: false,
        message: `Source '${source_name}' already exists`,
      });
    }

    const jobSource = new JobSource({
      source_name,
      base_url,
      active,
      max_application_per_hour,
      pollingInterval,
    });

    const source = await jobSource.register();

    return res.status(201).json({
      success: true,
      message: "Source registered successfully",
      data: {
        id: source._id,
        name: source.name,
        base_url: source.base_url,
        polling_interval: source.polling_interval,
        max_applications_per_hour: source.max_applications_per_hour,
        active: source.active,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      },
    });
  } catch (error) {
    console.error("[SourceController] Failed to register source:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register source",
      error: error.message || error,
    });
  }
};

/**
 * PATCH /api/source/:sourceName
 */
export const updateSource = async (req, res, next) => {
  try {
    const currentSourceName = req.params.sourceName;

    const {
      source_name,
      base_url,
      active,
      max_application_per_hour,
      pollingInterval,
    } = req.body;

    const existingSource = await Source.findOne({
      name: currentSourceName,
    });

    if (!existingSource) {
      return res.status(404).json({
        success: false,
        message: `Source '${currentSourceName}' not found`,
      });
    }

    /**
     * If the source name is being changed, make sure
     * the new name doesn't already belong to another source.
     */
    if (source_name && source_name !== currentSourceName) {
      const duplicateSource = await Source.exists({
        name: source_name,
        _id: { $ne: existingSource._id },
      });

      if (duplicateSource) {
        return res.status(409).json({
          success: false,
          message: `Source '${source_name}' already exists`,
        });
      }
    }

    const jobSource = new JobSource({
      source_name: currentSourceName,
    });
    const updatedSource = await jobSource.update({
      ...(source_name !== undefined && {
        name: source_name,
      }),
      ...(base_url !== undefined && {
        base_url,
      }),
      ...(active !== undefined && {
        active,
      }),
      ...(max_application_per_hour !== undefined && {
        max_applications_per_hour: max_application_per_hour,
      }),
      ...(pollingInterval !== undefined && {
        polling_interval: pollingInterval,
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Source updated successfully",
      data: {
        id: updatedSource._id,
        name: updatedSource.name,
        base_url: updatedSource.base_url,
        polling_interval: updatedSource.polling_interval,
        max_applications_per_hour: updatedSource.max_applications_per_hour,
        active: updatedSource.active,
        createdAt: updatedSource.createdAt,
        updatedAt: updatedSource.updatedAt,
      },
    });
  } catch (error) {
    console.error("[SourceController] Failed to update source:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update source",
      error: error.message || error,
    });
  }
};
