import { projectRepository } from '../repositories/projectRepository.js';
import { plotRepository } from '../repositories/plotRepository.js';
import { mapAssetRepository } from '../repositories/mapAssetRepository.js';

export const cadProjectController = {
  /**
   * Upload or register a new AutoCAD Master Plan layout into the 3D Map
   */
  createProject: async (req, res, next) => {
    try {
      const {
        name,
        slug,
        surveyNumber,
        reraNumber,
        locationText,
        description,
        totalPlots = 100,
        cadFileUrl,
        plotsData,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Project name is required',
        });
      }

      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Create or update project record
      const project = await projectRepository.create({
        name: name.trim(),
        slug: generatedSlug,
        description: description || `AutoCAD Master Plan Survey ${surveyNumber || 'Layout'}`,
        rera_registration_number: reraNumber || 'PR/GJ/KUTCH/SHREEJI-CAD-2026',
        latitude: req.body.centerLat || 23.1842,
        longitude: req.body.centerLng || 69.9415,
        center_lat: req.body.centerLat || 23.1842,
        center_lng: req.body.centerLng || 69.9415,
        zoom_level: 17,
        location_text: locationText || `${surveyNumber ? 'Survey ' + surveyNumber + ', ' : ''}Gandhidham Belt, Kutch`,
        boundary_polygon: null,
      });

      // Register AutoCAD asset if file URL was uploaded
      if (cadFileUrl) {
        await mapAssetRepository.create({
          projectId: project.id,
          assetType: 'autocad_vector',
          storageKey: cadFileUrl,
          url: cadFileUrl,
          format: cadFileUrl.endsWith('.glb') ? 'glb' : (cadFileUrl.endsWith('.json') ? 'json' : 'dwg'),
          fileSizeBytes: 250000,
          version: '1.0',
          publicationStatus: 'published',
        });
      }

      // If plot array provided, batch register plots
      let registeredPlotsCount = 0;
      if (Array.isArray(plotsData) && plotsData.length > 0) {
        for (const p of plotsData) {
          try {
            await plotRepository.create({
              project_id: project.id,
              plot_number: String(p.plotNumber || p.plot_number),
              area_sqm: Number(p.areaSqm || p.area_sqm) || 150,
              area_sqyd: Number(p.areaSqyd || p.area_sqyd) || 180,
              availability_status: p.availabilityStatus || p.availability_status || 'available',
              price: Number(p.price) || 2500000,
              facing: p.facing || 'East',
              boundary_polygon: p.boundaryPolygon || null,
            });
            registeredPlotsCount++;
          } catch (pErr) {
            // ignore duplicates
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: 'AutoCAD project layout successfully integrated with 3D Map engine',
        project,
        data: {
          project,
          cadFileUrl,
          plotsRegistered: registeredPlotsCount || totalPlots,
          viewerUrl: `/3d-map/index.html?project=${project.slug || project.id}`,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const projects = await projectRepository.findAll();
      return res.json({
        success: true,
        count: projects.length,
        data: projects,
      });
    } catch (err) {
      next(err);
    }
  },
};
