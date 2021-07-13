const optixHelper = require("../optix");
const dbHelper = require("../db");

/**
 * Description:
 *      get entity by the dataset name
 *
 * @param {string} dataset dataset name
 * @return {object} entity type id and entity id
 */
async function getEntityByDataset(dataset) {
    const { entity_type_id, entity_id } = await dbHelper.getDatasetEntityByName(dataset);
    return {
        entity_type_id: entity_type_id,
        entity_id: entity_id,
    };
}

/**
 * Description:
 *      get metadata by dataset
 *
 * @param {string} dataset dataset name
 * @param {string} entity_id entity id of the dataset (optional)
 * @return {object} metadata in json format
 */
async function getMetadata(dataset, entity_id) {
    if (!entity_id) {
        const entity = await getEntityByDataset(dataset);
        entity_id = entity.entity_id;
    }
    console.log("querying optix", entity_id);
    try {
        const result = await optixHelper.query(
            "metadata",
            {
                entity_id: entity_id,
            },
            "get"
        );
        return result.data;
    } catch(err) {
        return {};
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
 * @param {string} dataset
 * @param {object} new_metadata (required).
 */
async function modifyMetadata(dataset, new_metadata) {
    const { entity_type_id, entity_id } = await getEntityByDataset(dataset);
    const metadataToBeUpdated = [];
    const metadataToBeDeleted = [];
    const metadataToBeAdded = [];
    let originalMetadataResult = {
        status: 200,
        statusText: "OK",
        data: {}
    };
    try {
        originalMetadataResult = await optixHelper.query(
            "metadata",
            { entity_id: entity_id },
            "get"
        );
    } catch(err) {
        // do nothing
    }

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
    return getMetadata(dataset, entity_id);
}

/**
 * Description:
 *      create new entity for the new dataset (used in dataset interface)
 *
 * @param {string} type sensor type (entity type name)
 * @param {[string]} metrics array of metric
 * @param {object} metadata metadata of the dataset
 */
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

/**
 * Description:
 *      create new entity for the existed dataset
 *
 * @param {string} type sensor type
 * @param {string} dataset dataset name
 * @param {object} metadata metadata of the dataset
 * @param {string} group group name
 */
async function createEntityForExistDataset(type, dataset, metadata, group) {
    let options = {
        t: "metrics",
        q: dataset,
    };
    const result = await optixHelper.query("search", options, "get");
    // get metrics
    const metrics = result.data;
    // create entity
    const { entity_id, entity_type_id } = await createEntity(type, metrics, metadata);
    // add entity to db
    const datasetId = await dbHelper.addDataset(entity_id, entity_type_id, dataset, type);
    const groupId = await dbHelper.getGroupId(group);
    await dbHelper.addDatasetToGroup(groupId, datasetId);
}

module.exports = {
    get: getMetadata,
    edit: modifyMetadata,
    create: createEntity,
    linkEntity: createEntityForExistDataset
};
