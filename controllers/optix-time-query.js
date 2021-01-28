const optixHelper = require("../utils/optix-time-query-utils");
const createError = require("http-errors");

/**
 * Description:
 *      timeseries middleware
 *
 * @typedef {object} showRequestQuery
 * @property {string} metric metric name in the OpenTSDB (required).
 * @property {string} start_time start time of the time range (required).
 * @property {string} end_time end time of the time range (optional).
 * @property {object} tags key:value pairs to filter (optional).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function timeseries(req, res, next) {
    const endpoint = "timeseries";
    const options = req.query;
    try {
        const result = await optixHelper.query(endpoint, options, "get");
        res.status(200).json({
            status: "success",
            data: result.data,
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
 * Description:
 *      timeseries middleware
 *
 * @typedef {object} showRequestQuery
 * @property {string} entity_id the entity which metadata is being added (required).
 * @property {string} fields metadata fields you want returned. use semicolon separated
 *                           list of metadata field names. (optional)
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function getMetadata(req, res, next) {
    const endpoint = "metadata";
    const options = req.query;
    try {
        const result = await optixHelper.query(endpoint, options, "get");

        res.status(200).json({
            status: "success",
            data: result.data,
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
 * Description:
 *      update metadata
 *
 * @param {object[]} metadata metadata to be added
 */
async function updateMetadata(metadata) {
    for (const item of metadata) {
        await optixHelper.query("metadata", item, "post");
    }
}

/**
 * Description:
 *      delete metadata
 *
 * @param {object[]} metadata metadata to be added
 */
async function deleteMetadata(metadata) {
    for (const item of metadata) {
        await optixHelper.query("metadata", item, "delete");
    }
}

/**
 * Description:
 *      add metadata
 *
 * @param {object[]} metadata metadata to be added
 */
async function addMetadata(metadata) {
    for (const item of metadata) {
        try {
            // add metadata
            // check if the entity type has the field by adding metadata directly

            await optixHelper.query("metadata", item, "put");
        } catch (err) {
            if (
                err.response.status === 400 &&
                err.response.data.message === "failed creation"
            ) {
                const metaControlOption = {
                    type_id: item.type_id,
                    name: item.namem,
                    required: false,
                };
                // add metadata fields to entity type
                await optixHelper.query("meta-control", metaControlOption, "put");
                // add metadata again
                await optixHelper.query("metadata", item, "put");
            } else {
                throw err;
            }
        }
    }
}

/**
 * Description:
 *      update metadata
 *
 * @param {string} entity_id the entity id which metadata is being edited (required).
 * @param {string} entity_type_id the entity type id which metadata is being edited.
 *                                only for delete field. (optional)
 * @param {object} new_metadata (required).
 */
async function modifyMetadata(entity_id, entity_type_id, new_metadata) {
    const metadataToBeUpdated = [];
    const metadataToBeDeleted = [];
    const metadataToBeAdded = [];
    const originalMetadataResult = await optixHelper.query(
        "metadata",
        { entity_id: entity_id },
        "get"
    );
    if (
        originalMetadataResult &&
        originalMetadataResult.status === 200 &&
        originalMetadataResult.statusText === "OK"
    ) {
        const originalMetadata = originalMetadataResult.data;
        // check fields to delete
        for (const field in originalMetadataResult.data) {
            if (!new_metadata.hasOwnProperty(field)) {
                metadataToBeDeleted.push({
                    ent_id: entity_id,
                    name: field,
                });
            }
        }
        await deleteMetadata(metadataToBeDeleted);
        // check if fields needs to be update
        for (const field in new_metadata) {
            if (originalMetadata.hasOwnProperty(field)) {
                // edit field value
                if (originalMetadata[field] !== new_metadata[field]) {
                    metadataToBeUpdated.push({
                        entity_id: entity_id,
                        name: field,
                        value: new_metadata[field],
                    });
                }
            } else {
                // add field
                metadataToBeAdded.push({
                    entity_id: entity_id,
                    type_id: entity_type_id,
                    name: field,
                    value: new_metadata[field],
                });
            }
        }
        await updateMetadata(metadataToBeUpdated);
        await addMetadata(metadataToBeAdded);
    }
}

/**
 * Description:
 *      editMetadata middleware
 *
 * @typedef {object} showRequestQuery
 * @property {string} entity_id the entity id which metadata is being edited (required).
 * @property {string} entity_type_id the entity type id which metadata is being edited.
 *                                   only for delete field. (optional)
 * @property {object} new_metadata (required).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function editMetadata(req, res, next) {
    const entity_id = req.body.entity_id;
    const entity_type_id = req.body.entity_type_id;
    const new_metadata = req.body.new_metadata;
    try {
        await modifyMetadata(entity_id, entity_type_id, new_metadata);

        // add entity id in query for next middleware
        req.query.entity_id = entity_id;
        next();
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

module.exports = {
    timeseries: timeseries,
    getMetadata: getMetadata,
    editMetadata: editMetadata,
};
