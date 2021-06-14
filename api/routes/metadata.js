const metadataHelper = require("../../services/metadata");
const createError = require("http-errors");

/**
 * Get metadata
 * @route GET /metadata
 * @group metadata
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @returns {object} 200 - returns metadata
 * @returns {Error} default - Unexpected error
 */
async function getMetadata(req, res, next) {
    try {
        const dataset = req.query.dataset;
        const metadata = await metadataHelper.get(dataset);
        res.status(200).json({
            status: "success",
            data: metadata,
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
 * Edit metadata
 * @route POST /metadata
 * @group metadata
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @param {object} new_metadata.required new metadata of the dataset
 * @returns {object} 200 - returns metadata
 * @returns {Error} default - Unexpected error
 */
async function editMetadata(req, res, next) {
    const dataset = req.body.dataset;
    const new_metadata = req.body.new_metadata;
    try {
        const metadata = await metadataHelper.edit(dataset, new_metadata);
        res.status(200).json({
            status: "success",
            data: metadata,
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
 * Create entity for existed dataset
 * @route PUT /metadata
 * @group metadata
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @param {string} type.required sensor type name (required).
 * @param {string} group.required group name where the dataset belongs to (required).
 * @param {object} metadata new metadata of the dataset (optional).
 * @returns {object} 200
 * @returns {Error} default - Unexpected error
 */
async function createEntity(req, res, next) {
    // check if entity type exists
    try {
        const type = req.body.type;
        const dataset = req.body.dataset;
        const metadata = req.body.metadata;
        const group = req.body.group;
        await metadataHelper.linkEntity(type, dataset, metadata, group);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        if (err.response && err.response.status && err.response.data) {
            const errorData = err.response.data;
            if (
                errorData.hasOwnProperty("error") &&
                errorData.hasOwnProperty("message")
            ) {
                next(
                    createError(
                        err.response.status,
                        errorData.message + " " + errorData.error
                    )
                );
            } else if (errorData.hasOwnProperty("error")) {
                next(createError(err.response.status, errorData.error));
            } else {
                next(createError(err.response.status, errorData.message));
            }
        } else {
            next(createError(500, err));
        }
    }
}

module.exports = (app) => {
    app.get("/metadata", getMetadata);
    app.post("/metadata", editMetadata);
    app.put("/metadata", createEntity);
};
