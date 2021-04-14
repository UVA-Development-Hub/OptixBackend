const optixHelper = require("../optix");
const dbHelper = require("../../utils/user-db-query-utils");

async function getEntityByDataset(dataset) {
    const { entity_type_id, entity_id } = await dbHelper.getDatasetEntityByName(dataset);
    return {
        entity_type_id: entity_type_id,
        entity_id: entity_id,
    };
}

async function getMetadata(dataset) {
    const { entity_id } = await getEntityByDataset(dataset);

    const result = await optixHelper.query(
        "metadata",
        {
            entity_id: entity_id,
        },
        "get"
    );
    return result.data;
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
                type_id: item.type_id,
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

async function createEntity(type, metrics, metadata) {
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
    const metricNames = metrics.map((metric) => ["metric", metric]);
    // create entity id
    result = await optixHelper.query(
        "entity",
        {
            type_id: entity_type_id,
            metadata: JSON.stringify(metadata),
            time_series_link: JSON.stringify(metricNames),
        },
        "put"
    );
    return {
        entity_id: result.data.ID,
        entity_type_id: entity_type_id,
    };
}

module.exports = {
    get: getMetadata,
    edit: modifyMetadata,
    create: createEntity,
};
