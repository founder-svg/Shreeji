import { plotRepository } from '../repositories/plotRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { cacheService } from '../config/cache.js';

export const plotController = {
  getAll: async (req, res, next) => {
    try {
      const { projectId, category, availabilityStatus, minPrice, maxPrice } = req.query;
      const plots = await plotRepository.findAll({
        projectId,
        category,
        availabilityStatus,
        minPrice,
        maxPrice,
      });

      res.json({
        success: true,
        count: plots.length,
        data: plots,
      });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const plot = await plotRepository.findById(id);

      if (!plot) {
        return res.status(404).json({
          success: false,
          error: `Plot '${id}' not found`,
        });
      }

      // Attach project details for richer context
      const projId = plot.project_id || plot.projectId;
      const project = projId ? await projectRepository.findByIdOrSlug(projId) : null;

      res.json({
        success: true,
        data: {
          ...plot,
          boundaryGeometry: plot.surveyedBoundaryGeometry || plot.surveyed_boundary_geometry || plot.boundaryGeometry,
          surveyedBoundaryGeometry: plot.surveyedBoundaryGeometry || plot.surveyed_boundary_geometry || plot.boundaryGeometry,
          project: project
            ? {
                id: project.id,
                name: project.name,
                slug: project.slug,
                address: project.address,
                city: project.city,
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { projectId, plotNumber, area, price } = req.body;

      if (!projectId || !plotNumber || area === undefined || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'projectId, plotNumber, area, and price are required',
        });
      }

      // Verify project exists
      const project = await projectRepository.findByIdOrSlug(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: `Project '${projectId}' does not exist`,
        });
      }

      const newPlot = await plotRepository.create({
        ...req.body,
        projectId: project.id,
      });

      cacheService.flush();
      res.status(201).json({
        success: true,
        message: 'Plot registered successfully',
        data: newPlot,
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await plotRepository.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: `Plot '${id}' not found`,
        });
      }

      cacheService.flush();
      res.json({
        success: true,
        message: 'Plot updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await plotRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Plot '${id}' not found`,
        });
      }

      cacheService.flush();
      res.json({
        success: true,
        message: 'Plot removed successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
