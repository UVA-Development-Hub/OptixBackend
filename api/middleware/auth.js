const authHelper = require("../../services/auth");
const createError = require("http-errors");

/**
 * Description:
 *      authenticate the token. send the token to Cognito to get user info.
 * @typedef {object} showRequestHeader
 * @property {string} access_token cognito access token (required).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function authenticate(req, res, next) {
    try {
        // get access token
        let accesstoken = req.headers.access_token;
        // Fail if token not present
        if (!accesstoken) {
            next(createError(401, "Access token missing."));
            return;
        }
        const result = await authHelper.validate(accesstoken);

        res.locals.user = result;
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
    authenticate: authenticate,
};
