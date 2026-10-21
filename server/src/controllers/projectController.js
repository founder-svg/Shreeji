import { projectRepository } from '../repositories/projectRepository.js';
import { plotRepository } from '../repositories/plotRepository.js';
import { mapAssetRepository } from '../repositories/mapAssetRepository.js';
import { cacheService } from '../config/cache.js';

export const projectController = {
  getAll: async (req, res, next) => {
    try {
      const { status = 'active', publicationState = 'published' } = req.query;
      const projects = await projectRepository.findAll({ status, publicationState });
      res.json({
        success: true,
        count: projects.length,
        data: projects,
      });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const project = await projectRepository.findByIdOrSlug(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: `Project '${id}' not found`,
        });
      }

      // Fetch related plots and map assets
      const plots = await plotRepository.findAll({ projectId: project.id });
      const assets = await mapAssetRepository.findByProjectId(project.id);

      res.json({
        success: true,
        data: {
          ...project,
          plotsCount: plots.length,
          availablePlotsCount: plots.filter(
            (p) => (p.availability_status || p.availabilityStatus) === 'available'
          ).length,
          assets,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getPlots: async (req, res, next) => {
    try {
      const { id } = req.params;
      const project = await projectRepository.findByIdOrSlug(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: `Project '${id}' not found`,
        });
      }

      const { category, availabilityStatus, minPrice, maxPrice } = req.query;
      const plots = await plotRepository.findAll({
        projectId: project.id,
        category,
        availabilityStatus,
        minPrice,
        maxPrice,
      });

      res.json({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          city: project.city,
        },
        count: plots.length,
        data: plots,
      });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, address, description, city, latitude, longitude, boundaryGeometry } = req.body;

      if (!name || !address) {
        return res.status(400).json({
          success: false,
          error: 'Project name and address are required',
        });
      }

      const newProject = await projectRepository.create(req.body);
      cacheService.flush();

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: newProject,
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await projectRepository.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: `Project '${id}' not found`,
        });
      }

      cacheService.flush();
      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await projectRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Project '${id}' not found`,
        });
      }

      cacheService.flush();
      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
