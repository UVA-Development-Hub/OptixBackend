// ------------------------------------------
// ------------------------------------------
// -- Cognito portion of the groups system --
// ------------------------------------------
// ------------------------------------------
// Maps users to groups, groups to group metadata (description).
const cognitoHelper = require("../../services/cognito");

/**
 * Retrieve a list of system groups
 * @route GET /groups/list/groups
 * @group groups
 * @returns {object} 200 - returns an array of group objects
 * @returns {Error} default - Unexpected error
*/
async function getGroups(req, res) {
    try {
        const result = await cognitoHelper.getGroups();
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({
            success: false,
            message: "failed to retrieve groups",
            error: err
        });
    }
}

/**
 * Add a user to a group
 * @route POST /groups/add/user
 * @group groups
 * @param {string} username.required the username of the account to be added to the group
 * @param {string} groupname.required the group the specified account should be added to
 * @returns {object} 200 - object with a boolean value indicating whether the user was added to the group
 * @returns {Error} default - Unexpected error
*/
async function addUserToGroup(req, res) {
    try {
        const result = await cognitoHelper.addUserToGroup(req.body.username, req.body.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to add user to group", error: err});
    }
}

/**
 * Remove a user from a group
 * @route POST /groups/remove/user
 * @group groups
 * @param {string} username.required the username of the account to be removed from the group
 * @param {string} groupname.required the group the specified account should be removed from
 * @returns {object} 200 - object with a boolean value indicating whether the user was removed from the group
 * @returns {Error} default - Unexpected error
*/
async function removeUserFromGroup(req, res) {
    try {
        const result = await cognitoHelper.removeUserFromGroup(req.body.username, req.body.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to remove user from group", error: err});
    }
}

/**
 * Retrieve the list of groups a user has membership in
 * @route GET /groups/membership
 * @group groups
 * @param {string} username.required the user to find group memberships for
 * @returns {object} 200 - object containing a boolean success value and a list of groups
 * @returns {Error} default - Unexpected error
*/
async function getUserGroupMembership(req, res) {
    try {
        const result = await cognitoHelper.getGroupMembership(req.query.username);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({
            success: false,
            message: "failed to get group membership for user",
            error: err
        });
    }
}

// -------------------------------------------
// -------------------------------------------
// -- Postgres portion of the groups system --
// -------------------------------------------
// -------------------------------------------
// Maps groups to sensors. I.e. group X can access sensors A, B, C.
const dbHelper = require("../../services/db");

/**
 * Retrieve a list of sensors (datasets) in the system
 * @route GET /groups/list/sensors
 * @group groups
 * @returns {object} 200 - object containing a boolean success value and a list of sensors
 * @returns {Error} default - Unexpected error
*/
async function getSensors(req, res) {
    try {
        const result = await dbHelper.getSensors();
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to retrieve sensor list", error: err});
    }
}

/**
 * Add a sensor to a group
 * @route POST /groups/add/sensor
 * @group groups
 * @param {uuid} entity_id.required entity id of the sensor to add to a group
 * @param {string} groupname.required name of the group the sensor should be added to
 * @returns {object} 200 - object containing a boolean success value
 * @returns {Error} default - Unexpected error
*/
async function addSensorToGroup(req, res) {
    try {
        const result = await dbHelper.addSensorToGroup(req.body.entity_id, req.body.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to add sensor to group", error: err});
    }
}

/**
 * Add a sensor type (a class of sensors) to a group
 * @route POST /groups/add/sensor-type
 * @group groups
 * @param {uuid} entity_type.required entity type for the class of sensors to add to a group
 * @param {string} groupname.required name of the group the sensor class should be added to
 * @returns {object} 200 - object containing a boolean success value
 * @returns {Error} default - Unexpected error
*/
async function addSensorTypeToGroup(req, res) {
    try {
        const result = await dbHelper.addSensorTypeToGroup(req.body.entity_type, req.body.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({
            message: "failed to add sensor type to group",
            error: err
        });
    }
}

/**
 * Remove a sensor from a group
 * @route POST /groups/remove/sensor
 * @group groups
 * @param {uuid} entity_id.required entity id of the sensor to remove from a group
 * @param {string} groupname.required name of the group the sensor should be removed from
 * @returns {object} 200 - object containing a boolean success value
 * @returns {Error} default - Unexpected error
*/
async function removeSensorFromGroup(req, res) {
    try {
        const result = await dbHelper.removeSensorFromGroup(req.body.entity_id, req.body.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to remove sensor from group", error: err});
    }
}

/**
 * Remove a sensor type (a class of sensors) from a group
 * @route POST /groups/remove/sensor-type
 * @group groups
 * @param {uuid} entity_type.required entity type for the class of sensors to remove from a group
 * @param {string} groupname.required name of the group the sensor sclass hould be removed from
 * @returns {object} 200 - object containing a boolean success value
 * @returns {Error} default - Unexpected error
*/
async function removeSensorTypeFromGroup(req, res) {
    try {
        const result = await dbHelper.removeSensorTypeFromGroup(req.body.entity_type, req.body.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({
            message: "failed to add sensor type to group",
            error: err
        });
    }
}

/**
 * Retrieve a list of sensors accessible by a group
 * @route GET /groups/access/group
 * @group groups
 * @param {string} groupname.required the name of the group to check access for
 * @returns {object} 200 - object containing a boolean success value and a list of sensors (datasets)
 * @returns {Error} default - Unexpected error
*/
async function getSensorAccessByGroup(req, res) {
    try {
        const result = await dbHelper.sensorAccessByGroup(req.query.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to retrieve accessible sensors for group", error: err});
    }
}

/**
 * Retrieve a list of groups which can access a given sensor
 * @route GET /groups/access/sensor
 * @group groups
 * @param {string} entity_id.required entity_id of the sensor (dataset) that should be checked
 * @returns {object} 200 - object containing a boolean success value and a groups
 * @returns {Error} default - Unexpected error
*/
async function getGroupsForSensor(req, res) {
    try {
        const result = await dbHelper.sensorAccessibleBy(req.query.entity_id);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to retrieve accessing groups for sensor", error: err});
    }
}

async function getGroupMetadata(req, res) {
    try {
        const result = await cognitoHelper.getGroupMetadata(req.query.groupname);
        res.status(200).send(result);
    } catch(err) {
        console.error(err);
        res.status(500).send({message: "failed to retrieve metadata for group", error: err});
    }
}

module.exports = app => {
    // Endpoints using the Cognito service
    app.get("/groups/list/groups", getGroups);
    app.post("/groups/add/user", addUserToGroup);
    app.post("/groups/remove/user", removeUserFromGroup);
    app.get("/groups/membership", getUserGroupMembership);

    // Endpoints using the PostgreSQL service
    app.get("/groups/list/sensors", getSensors);

    app.post("/groups/add/sensor", addSensorToGroup);
    app.post("/groups/add/sensor-type", addSensorTypeToGroup);

    app.post("/groups/remove/sensor", removeSensorFromGroup);
    app.post("/groups/remove/sensor-type", removeSensorTypeFromGroup);

    app.get("/groups/access/group", getSensorAccessByGroup);
    app.get("/groups/access/sensor", getGroupsForSensor);

    app.get("/groups/get", getGroupMetadata);
};
