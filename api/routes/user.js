const userHelper = require("../../services/user");
const createError = require("http-errors");

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
        const subject = req.body.subject;
        const group = req.body.group;
        if (!(await userHelper.addUserToGroup(subject, group))) {
            next(createError(400, "Already in group."));
            return;
        }
        res.status(200).json({
            status: "success",
            message: `Add succecssfully!`,
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
    app.put("/group-management", createGroup);
    app.post("/group-management/group", addUserToGroup);
};
