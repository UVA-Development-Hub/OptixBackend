const userHelper = require("../../services/user");
const authMiddleware = require("../middleware/auth");
const userMiddleware = require("../middleware/user");
const createError = require("http-errors");

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
    // app.use("/group-management", authMiddleware.authenticate);
    // app.use("/group-management/group", userMiddleware.isAdmin);
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
