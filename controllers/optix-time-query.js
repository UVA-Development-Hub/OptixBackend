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
        if (req.originalUrl.includes("download")) {
            // return data to next for download
            res.locals.data = result.data;
            next();
        } else {
            // return data to json
            res.status(200).json({
                status: "success",
                data: result.data,
            });
        }
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
 * @param {object[]} metadata metadata to be updated
 * @param {string} metadata[].entity_id
 * @param {string} metadata[].name
 * @param {string} metadata[].value
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
 * @param {object[]} metadata metadata to be deleted
 * @param {string} metadata[].ent_id
 * @param {string} metadata[].name
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
 * @param {string} metadata[].entity_id
 * @param {string} metadata[].type_id
 * @param {string} metadata[].name
 * @param {string} metadata[].value
 */
async function addMetadata(metadata) {
    // no metadata need to be added
    if (!metadata.length) return;
    // make a set of field name of the entity type
    const entity_type_id = metadata[0]["type_id"];
    // check if entity type has the field
    const result = await optixHelper.query(
        "meta-control",
        { entity_type_id: entity_type_id },
        "get"
    );
    const fieldSet = new Set();
    for (const info of result.data.results) {
        fieldSet.add(info.name);
    }
    // add metadata
    for (const item of metadata) {
        // if field not in entity type
        if (!fieldSet.has(item.name)) {
            const metaControlOption = {
                type_id: item.entity_type_id,
                name: item.name,
                required: false,
            };
            // add metadata fields to entity type
            await optixHelper.query("meta-control", metaControlOption, "put");
        }
        // add metadata
        await optixHelper.query("metadata", item, "put");
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
                    entity_id: entity_id,
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

/**
 * Description:
 *      create entity
 *
 * @typedef {object} showRequestQuery
 * @property {string} type the entity type name (required).
 * @property {string} metric metric name (required)
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function createEntity(req, res, next) {
    const type = req.body.type;
    const metric = req.body.metric;
    // check if entity type exists
    try {
        let result = undefined;
        try {
            result = await optixHelper.query("entity-types", { type: type }, "get");
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message &&
                err.response.data.message === "this query has no results"
            ) {
                // entity type does not exist
                // create one
                result = await optixHelper.query(
                    "entity-types",
                    {
                        type: type,
                        meta_control: JSON.stringify({ location: false }),
                        time_series_control: JSON.stringify(["metric"]),
                    },
                    "put"
                );
            } else {
                throw err;
            }
        }
        let entity_type_id = undefined;
        if (result.data.results) {
            entity_type_id = result.data.results[0].entity_type_id;
        } else {
            entity_type_id = result.data.ID;
        }

        // create entity id
        result = await optixHelper.query(
            "entity",
            {
                type_id: entity_type_id,
                time_series_link: JSON.stringify([["metric", metric]]),
            },
            "put"
        );
        const entity_id = result.data.ID;
        res.locals.data = {
            entity_id: entity_id,
            entity_type_id: entity_type_id,
        };
        next();
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

module.exports = {
    timeseries: timeseries,
    getMetadata: getMetadata,
    editMetadata: editMetadata,
    createEntity: createEntity,
};
