import { mediaRepository } from '../repositories/mediaRepository.js';

export const mediaStudioController = {
  create: async (req, res, next) => {
    try {
      const { title, description, projectId, plotNumber } = req.body;
      const mediaUrl = req.body.mediaUrl || req.body.url;
      const mediaType = req.body.mediaType || req.body.type || 'photo';
      const thumbnailUrl = req.body.thumbnailUrl || req.body.thumbnail;

      if (!title || !mediaUrl) {
        return res.status(400).json({
          success: false,
          error: 'Media title and mediaUrl are required',
        });
      }

      const media = await mediaRepository.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        mediaType,
        mediaUrl: mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : mediaUrl.trim(),
        projectId: projectId || 'nagavaladiya',
        plotNumber: plotNumber || null,
        author: req.user?.name || 'Shreeji Admin',
      });

      return res.status(201).json({
        success: true,
        message: 'Media published successfully with detailed description',
        data: media,
      });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 50, projectId } = req.query;
      const type = req.query.type || req.query.mediaType;
      const result = await mediaRepository.getAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 50,
        type,
        projectId,
      });

      return res.json({
        success: true,
        count: result.media.length,
        total: result.total,
        page: result.page,
        data: result.media,
      });
    } catch (err) {
      next(err);
    }
  },

  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      await mediaRepository.delete(id);
      return res.json({
        success: true,
        message: 'Media item removed successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
