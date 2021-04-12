const db = require("../db");

async function createGroup(name) {
    return await db.query("INSERT INTO groups(name) VALUES($1)", [name]);
}

async function createUser(subject) {
    return await db.query("INSERT INTO users(subject) VALUES($1)", [subject]);
}

async function addUserToGroup(user_id, group_id) {
    return await db.query("INSERT INTO user_group(user_id, group_id) VALUES($1, $2)", [
        user_id,
        group_id,
    ]);
}

async function addDataset(entity_id, entity_type_id, prefix, sensor_type) {
    await db.query(
        "INSERT INTO datasets(entity_id, entity_type_id, prefix, sensor_type) VALUES($1, $2, $3, $4)",
        [entity_id, entity_type_id, prefix, sensor_type]
    );
    return await getDatasetId(entity_type_id, entity_id);
}

async function addDatasetToGroup(group_id, dataset_id) {
    db.query("INSERT INTO group_dataset(group_id, dataset_id) VALUES($1, $2)", [
        group_id,
        dataset_id,
    ]);
}

async function getGroupId(name) {
    const { rows } = await db.query("SELECT id FROM groups WHERE name = $1", [name]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0].id;
}

async function getUserId(subject) {
    const { rows } = await db.query("SELECT id FROM users WHERE subject = $1", [subject]);
    // if subject not in user_db (sign up)
    if (rows.length === 0) {
        return null;
    }
    return rows[0].id;
}

async function getDatasetId(entity_type_id, entity_id) {
    const {
        rows,
    } = await db.query(
        "SELECT id FROM datasets WHERE entity_type_id = $1 AND entity_id = $2",
        [entity_type_id, entity_id]
    );
    // if subject not in user_db (sign up)
    if (rows.length === 0) {
        return null;
    }
    return rows[0].id;
}

async function getDatasetByGroup(name) {
    const { rows } = await db.query(
        `SELECT ds.entity_id, ds.entity_type_id 
         FROM datasets as ds
         INNER JOIN group_dataset as gd
            ON ds.id = gd.dataset_id 
         INNER JOIN groups as g
            ON gd.group_id = g.id
         WHERE g.name = $1`,
        [name]
    );
    return rows;
}

async function getGroupsByUser(subject) {
    const { rows } = await db.query(
        `SELECT g.name 
         FROM groups as g
         INNER JOIN user_group as ug
            ON g.id = ug.group_id
         INNER JOIN users as u
            ON ug.user_id = u.id
         WHERE u.subject = $1`,
        [subject]
    );
    return rows;
}

async function getDatasetByUser(subject) {
    const groups = await getGroupsByUser(subject);
    const datasets = [];
    for (const group of groups) {
        datasets = datasets.concat(await getDatasetByGroup(group.name));
    }
    return datasets;
}

async function getDataset() {
    const { rows } = await db.query(
        `SELECT * 
         FROM datasets`
    );
    return rows;
}

async function isUserInGroup(userId, group_id) {
    const {
        rows,
    } = await db.query(`SELECT * FROM user_group WHERE user_id = $1 AND group_id = $2`, [
        userId,
        group_id,
    ]);
    if (rows.length === 0) {
        return false;
    }
    return true;
}

async function isDatasetInGroup(group_id, dataset_id) {
    const {
        rows,
    } = await db.query(
        `SELECT * FROM group_dataset WHERE group_id = $1 AND dataset_id = $2`,
        [group_id, dataset_id]
    );
    if (rows.length === 0) {
        return false;
    }
    return true;
}

async function hasGroup(name) {
    const { rows } = await db.query(`SELECT * FROM groups WHERE name = $1`, [name]);
    console.log(rows.length);
    if (rows.length === 0) {
        return false;
    }
    return true;
}

module.exports = {
    createGroup: createGroup,
    createUser: createUser,
    addUserToGroup: addUserToGroup,
    addDataset: addDataset,
    addDatasetToGroup: addDatasetToGroup,
    getGroupId: getGroupId,
    getUserId: getUserId,
    getDatasetId: getDatasetId,
    getDatasetByGroup: getDatasetByGroup,
    getGroupsByUser: getGroupsByUser,
    getDatasetByUser: getDatasetByUser,
    isUserInGroup: isUserInGroup,
    isDatasetInGroup: isDatasetInGroup,
    hasGroup: hasGroup,
};
