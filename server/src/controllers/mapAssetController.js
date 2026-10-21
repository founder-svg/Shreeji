import { mapAssetRepository } from '../repositories/mapAssetRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';

export const mapAssetController = {
  getByProject: async (req, res, next) => {
    try {
      const { id } = req.params;
      const project = await projectRepository.findByIdOrSlug(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: `Project '${id}' not found`,
        });
      }

      const assets = await mapAssetRepository.findByProjectId(project.id);
      res.json({
        success: true,
        projectId: project.id,
        count: assets.length,
        data: assets,
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { projectId, assetType, storageKey, url, format, fileSizeBytes, coordinateReferenceSystem, version } = req.body;

      if (!projectId || !assetType || !url || !format) {
        return res.status(400).json({
          success: false,
          error: 'projectId, assetType, url, and format are required',
        });
      }

      const project = await projectRepository.findByIdOrSlug(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: `Project '${projectId}' not found`,
        });
      }

      const asset = await mapAssetRepository.create({
        ...req.body,
        projectId: project.id,
        storageKey: storageKey || url,
      });

      res.status(201).json({
        success: true,
        message: 'Map asset registered successfully',
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  },

  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await mapAssetRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Map asset '${id}' not found`,
        });
      }

      res.json({
        success: true,
        message: 'Map asset deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
