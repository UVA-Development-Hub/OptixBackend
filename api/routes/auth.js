const createError = require("http-errors");
const authHelper = require("../../services/auth");
const dashboardHelper = require("../../services/dashboard");

async function login(req, res, next) {
    try {
        const code = req.query.code;
        let result = await authHelper.getToken(code);
        const accesstoken = result.data.access_token;
        result = await authHelper.validate(accesstoken);
        const subject = result.sub;
        const initializeData = await dashboardHelper.initialize(subject);

        // TODO: inistailize dashboard
        res.status(200).json({
            status: "success",
            data: initializeData.data,
            datasetIds: initializeData.datasetIds,
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
    app.get("/auth/login", login);
    // app.get("/auth/logout", logout);
};
