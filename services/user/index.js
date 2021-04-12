const db = require("../../db");
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

module.exports = {
    createGroup: createGroup,
    addUserToGroup: addUserToGroup,
};
