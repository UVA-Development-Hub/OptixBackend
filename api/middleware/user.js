const userHelper = require("../../services/user");
const createError = require("http-errors");

async function isAdmin(req, res, next) {
    try {
        const subject = res.locals.user.sub;
        if (!(await userHelper.isAdmin(subject))) {
            next(createError(401, "admin user LengthRequired."));
            return;
        }
        next();
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

module.exports = {
    isAdmin: isAdmin,
};
