const dbHelper = require("../../utils/user-db-query-utils");

async function createGroup(group) {
    if (await dbHelper.hasGroup(group)) {
        return false;
    }
    await dbHelper.createGroup(group);
    return true;
}

async function addUserToGroup(subjects, group) {
    const groupId = await dbHelper.getGroupId(group);
    if (!groupId) {
        throw "group not found.";
    }
    for (const subject of subjects) {
        const userId = await dbHelper.getUserId(subject);
        if (!userId) {
            // user id not found
            continue;
        }
        if (await dbHelper.isUserInGroup(userId, groupId)) {
            // user already in group
            continue;
        }
        await dbHelper.addUserToGroup(userId, groupId);
    }
    return true;
}

async function addDatasetsToGroup(datasets, group) {
    const groupId = await dbHelper.getGroupId(group);
    if (!groupId) {
        throw "group does not exist.";
    }
    for (const dataset of datasets) {
        const datasetId = await dbHelper.getDatasetIdByName(dataset);
        if (await dbHelper.isDatasetInGroup(groupId, datasetId)) {
            // dataset already exists
            continue;
        }
        await dbHelper.addDatasetToGroup(groupId, datasetId);
    }
}

module.exports = {
    createGroup: createGroup,
    addUserToGroup: addUserToGroup,
    addDatasetsToGroup: addDatasetsToGroup,
};
