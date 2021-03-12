const userDbQuery = require("../utils/user-db-query-utils");
const createError = require("http-errors");

async function createGroup(req, res, next) {
    // group name
    const name = req.query.name;
    // datasets (entity_type_id, entity_id) to be added to the group
    const datasets = req.query.datasets;
    try {
        // check if the group name existed
        let id = await userDbQuery.getGroupId(name);
        if (id) {
            next(createError(400, "Group name existed"));
            return;
        }
        // create group name
        await userDbQuery.createGroup(name);
        id = await userDbQuery.getGroupId(name);
        if (datasets) {
            // add datasets to group
            for (const { entity_type_id, entity_id } of datasets) {
                userDbQuery.addDataset(entity_id, entity_type_id);
            }
        }
        res.status(200).json({
            status: "success",
            id: id,
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

async function addDatasetToGroup(req, res, next) {
    // group name
    const name = req.query.name;
    // datasets (entity_type_id, entity_id) to be added to the group
    const datasets = req.query.datasets;
    try {
        const id = await userDbQuery.getGroupId(name);
        // add datasets to group
        for (const { entity_type_id, entity_id } of datasets) {
            userDbQuery.addDataset(entity_id, entity_type_id);
        }
        res.status(200).json({
            status: "success",
            id: id,
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
module.exports = {
    createGroup: createGroup,
    addDatasetToGroup: addDatasetToGroup,
};
