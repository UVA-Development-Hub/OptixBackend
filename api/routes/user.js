//
//
// This file will probably be deleted in the future
//
//

const userHelper = require("../../services/user");
const userMiddleware = require("../middleware/user");
const createError = require("http-errors");

/**
 * Get users
 * @route GET /group-management/user
 * @group group management
 * @returns {object} 200 - List of users.
 * @returns {Error} default - Unexpected error
 */
async function getUser(req, res, next) {
    try {
        const userList = await userHelper.getUser();

        res.status(200).json({
            status: "success",
            data: userList,
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

/**
 * Get groups
 * @route GET /group-management/group
 * @group group management
 * @returns {object} 200 - List of groups.
 * @returns {Error} default - Unexpected error
 */
async function getGroup(req, res, next) {
    try {
        const groupList = await userHelper.getGroup();

        res.status(200).json({
            status: "success",
            data: groupList,
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

/**
 * Get users by the group
 * @route GET /group-management/group/user
 * @group group management
 * @param {string} group.required group name
 * @returns {object} 200 - List of users of the input group.
 * @returns {Error} default - Unexpected error
 */
async function getUserByGroup(req, res, next) {
    try {
        const group = req.query.group;
        const userList = await userHelper.getUserByGroup(group);

        res.status(200).json({
            status: "success",
            data: userList,
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

/**
 * Get the user's groups
 * @route GET /group-management/user/group
 * @group group management
 * @param {string} subject.required user's subject (required).
 * @returns {object} 200 - List of groups of the input user.
 * @returns {Error} default - Unexpected error
 */
async function getGroupByUser(req, res, next) {
    try {
        const subject = req.query.subject;
        const groupList = await userHelper.getGroupByUser(subject);

        res.status(200).json({
            status: "success",
            data: groupList,
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

/**
 * Create a new group
 * @route PUT /group-management/group
 * @group group management
 * @param {string} group.required group name (required).
 * @returns {object} 200
 * @returns {Error} default - Unexpected error
 */
async function createGroup(req, res, next) {
    try {
        const group = req.body.group;
        if (!(await userHelper.createGroup(group))) {
            next(createError(400, "Group exists."));
            return;
        }
        res.status(200).json({
            status: "success",
            message: `Created ${group} succecssfully!`,
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

/**
 * Add users to group
 * @route PUT /group-management/group/user
 * @group group management
 * @param {string} group.required group name (required).
 * @param {[string]} subject.required a list of users' subjects (required).
 * @returns {object} 200
 * @returns {Error} default - Unexpected error
 */
async function addUserToGroup(req, res, next) {
    try {
        const subjects = req.body.subjects;
        const group = req.body.group;
        await userHelper.addUserToGroup(subjects, group);
        res.status(200).json({
            status: "success",
            message: "Add succecssfully!",
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

/**
 * Delete users to group
 * @route DELETE /group-management/group/user
 * @group group management
 * @param {string} group.required group name (required).
 * @param {[string]} subjects.required a list of user' subjects (required).
 * @returns {object} 200
 * @returns {Error} default - Unexpected error
 */
async function deleteUserFromGroup(req, res, next) {
    try {
        const subjects = req.body.subjects;
        const group = req.body.group;
        await userHelper.deleteUserFromGroup(subjects, group);
        res.status(200).json({
            status: "success",
            message: "Delete succecssfully!",
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


/**
 * Add dataset to group
 * @route PUT /group-management/group/dataset
 * @group group management
 * @param {string} group.required group name (required).
 * @param {[string]} datasets.required list of datasets (required).
 * @returns {object} 200
 * @returns {Error} default - Unexpected error
 */
async function addDatasetToGroup(req, res, next) {
    try {
        const datasets = req.body.datasets;
        const group = req.body.group;
        await userHelper.addDatasetsToGroup(datasets, group);
        res.status(200).json({
            status: "success",
            message: "Add succecssfully!",
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

/**
 * Get dataset of the group
 * @route GET /group-management/group/dataset
 * @group group management
 * @param {string} group.required group name (required).
 * @param {[string]} datasets.required list of datasets (required).
 * @returns {object} 200 - List of dataset of the input group.
 * @returns {Error} default - Unexpected error
 */
async function getDatasetByGroup(req, res, next) {
    try {
        const group = req.query.group;
        const datasets = await userHelper.getDatasetByGroup(group);
        res.status(200).json({
            status: "success",
            data: datasets,
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

module.exports = (app) => {
    app.get("/group-management/user", getUser);
    app.get("/group-management/user/group", getGroupByUser);
    app.get("/group-management/group", getGroup);
    app.put("/group-management/group", createGroup);
    app.get("/group-management/group/user", getUserByGroup);
    app.put("/group-management/group/user", addUserToGroup);
    app.delete("/group-management/group/user", deleteUserFromGroup);
    app.put("/group-management/group/dataset", addDatasetToGroup);
    app.get("/group-management/group/dataset", getDatasetByGroup);
};
