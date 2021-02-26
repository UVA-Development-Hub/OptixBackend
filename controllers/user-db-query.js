const db = require("../db");

async function createGroup(name) {
    const { rows } = await db.query("INSERT INTO groups(name) VALUES($1)", [name]);
    return rows[0].id;
}

async function createUser(subject) {
    const { rows } = await db.query("INSERT INTO users(subject) VALUES($1)", [subject]);
    return rows[0].id;
}

async function addUserToGroup(user_id, group_id) {
    const {
        rows,
    } = await db.query("INSERT INTO user_group(user_id, group_id) VALUES($1, $2)", [
        user_id,
        group_id,
    ]);
}

async function addDataset(entity_id, entity_type_id) {
    const {
        rows,
    } = await db.query("INSERT INTO datasets(entity_id, entity_type_id) VALUES($1, $2)", [
        entity_id,
        entity_type_id,
    ]);
    return rows[0].id;
}

async function addDatasetToGroup(group_id, dataset_id) {
    const {
        rows,
    } = await db.query("INSERT INTO group_dataset(group_id, dataset_id) VALUES($1, $2)", [
        group_id,
        dataset_id,
    ]);
}

async function getGroupId(name) {
    const { rows } = await db.query("SELECT id FROM groups WHERE name = $1", [name]);
    return rows[0].id;
}

async function getUserId(subject) {
    const { rows } = await db.query("SELECT id FROM users WHERE subject = $1", [subject]);
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

module.exports = {
    createGroup: createGroup,
    createUser: createUser,
    addUserToGroup: addUserToGroup,
    addDataset: addDataset,
    addDatasetToGroup: addDatasetToGroup,
    getDatasetByGroup: getDatasetByGroup,
    getGroupsByUser: getGroupsByUser,
};
