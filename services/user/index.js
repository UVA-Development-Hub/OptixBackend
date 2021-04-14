const dbHelper = require("../../utils/user-db-query-utils");

async function createGroup(group) {
    if (await dbHelper.hasGroup(group)) {
        return false;
    }
    await dbHelper.createGroup(group);
    return true;
}

async function addUserToGroup(subject, group) {
    const userId = await dbHelper.getUserId(subject);
    const groupId = await dbHelper.getGroupId(group);
    if (!userId || !groupId || (await dbHelper.isUserInGroup(userId, groupId))) {
        return false;
    }
    await dbHelper.addUserToGroup(userId, groupId);
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
