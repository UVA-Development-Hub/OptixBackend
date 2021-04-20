const dbHelper = require("../db");

async function getUser() {
    const result = await dbHelper.getUser();
    const userList = result.map((userInfo) => userInfo.subject);
    return userList;
}

async function getGroup() {
    const result = await dbHelper.getGroup();
    const groupList = result.map((groupInfo) => groupInfo.name);
    return groupList;
}

async function getUserByGroup(group) {
    const result = await dbHelper.getUserByGroup(group);
    const userList = result.map((userInfo) => userInfo.subject);
    return userList;
}

async function getGroupByUser(subject) {
    const result = await dbHelper.getGroupByUser(subject);
    const groupList = result.map((groupInfo) => groupInfo.name);
    return groupList;
}

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

async function deleteUserFromGroup(subjects, group) {
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
        if (!(await dbHelper.isUserInGroup(userId, groupId))) {
            // user already in group
            continue;
        }
        await dbHelper.deleteUserFromGroup(userId, groupId);
    }
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

async function isAdmin(subject) {
    return await dbHelper.isAdmin(subject);
}

module.exports = {
    getUserByGroup: getUserByGroup,
    getGroupByUser: getGroupByUser,
    getUser: getUser,
    getGroup: getGroup,
    createGroup: createGroup,
    addUserToGroup: addUserToGroup,
    deleteUserFromGroup: deleteUserFromGroup,
    addDatasetsToGroup: addDatasetsToGroup,
    isAdmin: isAdmin,
};
