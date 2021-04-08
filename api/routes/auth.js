const createError = require("http-errors");
const authHelper = require("../../services/auth");
const dashboardHelper = require("../../services/dashboard");
require("dotenv").config({ path: "../" });

/**
 * Description:
 *      get tokens from cognito using authorization code.
 *
 * @typedef {object} showRequestQuery
 * @property {string} code cognito authorization code (required).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function getToken(req, res, next) {
    const code = req.query.code;
    try {
        const result = await cognitoAgent.post(
            "oauth2/token",
            // since cognito only receive x-www-form-urlencoded
            // the body need to be processed by query string first
            querystring.stringify({
                code: code,
                grant_type: "authorization_code",
                client_id: process.env.COGNITO_CLIENT_ID,
                redirect_uri: process.env.COGNITO_REDIRECT_URI,
            })
        );

        res.locals.data = result.data;
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

/**
 * Description:
 *      authenticate the token. send the token to cognito to get user info. token will be
 *      in req.headers (user query) or res.locals.data (login, sign up)
 * @typedef {object} showRequestHeader||showResponseLocalsData
 * @property {string} access_token cognito access token (required).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function authenticate(req, res, next) {
    try {
        // get access token
        let accesstoken = undefined;
        if (req.headers.accesstoken) {
            // from header
            // user query
            accesstoken = req.headers.access_token;
        } else if (res.locals.data.access_token) {
            // from locals
            // login or sign up
            accesstoken = res.locals.data.access_token;
        }

        // Fail if token not present eithrt in header or locals.
        if (!accesstoken) {
            next(createError(401, "Access token missing."));
            return;
        }

        const result = await authHelper.validate(accesstoken);

        res.locals.user = result;
        console.log(result);
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
