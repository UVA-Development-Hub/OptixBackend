const optixHelper = require("../utils/optix-time-query-utils");

async function timeseries(req, res, next) {
    const metric = req.query.metric;
    const start_time = req.query.start_time;
    const options = req.query;
    try {
        const result = await optixHelper.timeseries(metric, start_time, options);
        if (result && result.status === 200 && result.statusText === "OK") {
            res.locals.data = result.data;
            next();
        } else {
            res.status(404);
            res.render("query parameter error");
        }
    } catch (err) {
        if (err.response && err.response.config && err.response.data) {
            console.error(err.response.config, err.response.data);
        }
        res.status(404);
        res.render("error");
    }
}

async function getMetadata(req, res, next) {
    const entity_id = req.query.entity_id;
    const options = req.query;
    const result = await optixHelper.getMetadata(entity_id, options);

    if (result && result.status === 200 && result.statusText === "OK") {
        res.json(result.data);
    } else {
        res.status(404);
        res.render("error");
    }
}

async function updateMetadataFields(updateFields) {
    for (const updateItem of updateFields) {
        try {
            await optixHelper.postMetadata(
                updateItem.entity_id,
                updateItem.name,
                updateItem
            );
        } catch (err) {
            console.error(err.response.config, err.response.data);
        }
    }
}

async function deleteMetadataFields(deleteFields) {
    for (const deleteItem of deleteFields) {
        try {
            await optixHelper.deleteMetadata(deleteItem.ent_id, deleteItem.name);
        } catch (err) {
            console.error(err.response.config, err.response.data);
        }
    }
}

async function addMetadataFields(addFields) {
    for (const addItem of addFields) {
        try {
            await optixHelper.putMetadata(
                addItem.entity_id,
                addItem.type_id,
                addItem.name,
                addItem.value
            );
        } catch (err) {
            console.error("put metadata failed");
            console.error(err.response.data);
            if (
                err.response.status === 400 &&
                err.response.data.message === "failed creation"
            ) {
                try {
                    let result = await optixHelper.putMetaControl(
                        addItem.type_id,
                        addItem.name,
                        {
                            required: false,
                        }
                    );
                } catch (err) {
                    console.error("put meta-control");
                    console.error(err.response.config, err.response.data);
                }
                try {
                    let result = await optixHelper.putMetadata(
                        addItem.entity_id,
                        addItem.type_id,
                        addItem.name,
                        addItem.value
                    );
                } catch (err) {
                    console.error("put metadata");
                    console.error(err.response.config, err.response.data);
                }
            }
        }
    }
}

async function updateMetadata(entity_id, entity_type_id, newMetadata) {
    const updateFields = [];
    const deleteFields = [];
    const addFields = [];
    const originalMetadataResult = await optixHelper.getMetadata(entity_id);
    if (
        originalMetadataResult &&
        originalMetadataResult.status === 200 &&
        originalMetadataResult.statusText === "OK"
    ) {
        const originalMetadata = originalMetadataResult.data;
        for (const field in originalMetadataResult.data) {
            if (!newMetadata.hasOwnProperty(field)) {
                deleteFields.push({
                    ent_id: entity_id,
                    name: field,
                });
            }
        }
        await deleteMetadataFields(deleteFields);
        for (const field in newMetadata) {
            if (originalMetadata.hasOwnProperty(field)) {
                if (originalMetadata[field] !== newMetadata[field]) {
                    updateFields.push({
                        entity_id: entity_id,
                        name: field,
                        value: newMetadata[field],
                    });
                }
            } else {
                addFields.push({
                    entity_id: entity_id,
                    type_id: entity_type_id,
                    name: field,
                    value: newMetadata[field],
                });
            }
        }
        await updateMetadataFields(updateFields);
        await addMetadataFields(addFields);
    }
}

async function editMetadata(req, res, next) {
    const entity_id = req.body.entity_id;
    const entity_type_id = req.body.entity_type_id;
    const newMetadata = req.body.newMetadata;
    await updateMetadata(entity_id, entity_type_id, newMetadata);

    req.query.entity_id = entity_id;
    next();
}

module.exports = {
    timeseries: timeseries,
    getMetadata: getMetadata,
    editMetadata: editMetadata,
};
