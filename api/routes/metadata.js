const { v2: metadataHelper } = require("../../services/metadata");
const createError = require("http-errors");


/**
 * Get metadata
 * @route GET /apps/metadata/<app_id>
 * @group metadata
 * @param {string} app_id.required id of the app to fetch metadata for. You must have permission to view the app
 * @returns {object} 200 - returns metadata
 * @returns {Error} default - Unexpected error
 */
async function getMetadata(req, res, next) {
    try {
        const app_id = req.params.app_id;
        if(!app_id) {
            res.status(400).json({
                message: "missing querystring argument 'app_id'"
            });
            return;
        }
        const { error, metadata } = await metadataHelper.fetchMetadata(app_id);
        if(error) throw error;
        res.status(200).json({
            metadata: metadata
        });
    } catch (err) {
        if (
            err.response &&
            err.response.status &&
            err.response.data &&
            err.response.data.message
        ) {
            next(createError(err.response.status, err.response.data.message));
        } else {
            next(createError(500, err));
        }
    }
}


 /**
  * Update metadata
  * @route POST /apps/metadata/<app_id>
  * @group metadata
  * @param {string} app_id.required id of the app to fetch metadata for. You must have permission to view the app
  * @param {string} key.required metadata key to update or insert
  * @param {string} value.required value associated with the metadata key
  * @returns {object} 200 - returns metadata
  * @returns {Error} default - Unexpected error
  */
async function editMetadata(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const { key, value } = req.body;
        if(!app_id) {
            res.status(400).json({
                message: "missing body parameter 'app_id'"
            });
            return;
        }
        if(!key) {
            res.status(400).json({
                message: "missing body parameter 'key'"
            });
            return;
        }
        const { error, success } = await metadataHelper.modifyMetadata(app_id, key, value ?? "");
        if(error) throw error;
        res.status(200).json({
            success: success
        });
    } catch (err) {
        if (
            err.response &&
            err.response.status &&
            err.response.data &&
            err.response.data.message
        ) {
            next(createError(err.response.status, err.response.data.message));
        } else {
            next(createError(500, err));
        }
    }
}


  /**
   * Delete metadata
   * @route POST /apps/metadata/<app_id>/delete
   * @group metadata
   * @param {string} app_id.required id of the app to delete metadata for. You must have permission to view the app
   * @param {string} key.required metadata key to delete
   * @returns {object} 200 - returns metadata
   * @returns {Error} default - Unexpected error
   */
async function deleteMetadata(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const key = req.body.key;
        if(!app_id) {
            res.status(400).json({
                message: "missing body parameter 'app_id'"
            });
            return;
        }
        if(!key) {
            res.status(400).json({
                message: "missing body parameter 'key'"
            });
            return;
        }
        const { error, success } = await metadataHelper.deleteMetadata(app_id, key);
        if(error) throw error;
        res.status(200).json({
            success: success
        });
    } catch (err) {
        if (
            err.response &&
            err.response.status &&
            err.response.data &&
            err.response.data.message
        ) {
            next(createError(err.response.status, err.response.data.message));
        } else {
            next(createError(500, err));
        }
    }
}

module.exports = (app) => {
    app.get("/apps/metadata/:app_id", getMetadata);
    app.post("/apps/metadata/:app_id", editMetadata);
    app.post("/apps/metadata/:app_id/delete", deleteMetadata);
};
