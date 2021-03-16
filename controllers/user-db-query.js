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

async function addUserToGroup(req, res, next) {
    const group = req.query.group;
    const users = req.query.users;
    try {
        const groupId = await userDbQuery.getGroupId(group);
        if (!groupId) {
            next(createError(400, "Group does not exist"));
            return;
        }
        for (const subject of users) {
            // check if user exists
            const userId = await userDbQuery.getUserId(subject);
            if (!userId) {
                next(createError(400, `User ${subject} does not exist`));
                return;
            }
            // check if user is already in the group
            if (!(await userDbQuery.isUserInGroup(userId, groupId))) {
                await userDbQuery.addUserToGroup(userId, groupId);
            }
        }
        res.status(200).json({
            status: "success",
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
    const group = req.query.group;
    // datasets (entity_type_id, entity_id) to be added to the group
    const datasets = req.query.datasets;
    try {
        const groupId = await userDbQuery.getGroupId(group);
        // add datasets to group
        for (const { entity_type_id, entity_id } of datasets) {
            // check if dataset exists
            const datasetId = userDbQuery.getDatasetId(entity_type_id, entity_id);
            if (!datasetId) {
                next(
                    createError(
                        400,
                        `Dataset (${entity_type_id}, ${entity_id}) does not exist`
                    )
                );
                return;
            }
            // check if dataset is already in the group
            if (!(await userDbQuery.isDatasetInGroup(groupId, datasetId))) {
                await userDbQuery.addDatasetToGroup(groupId, datasetId);
            }
        }
        res.status(200).json({
            status: "success",
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
    addUserToGroup: addUserToGroup,
};
