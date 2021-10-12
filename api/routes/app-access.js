const { v2: dbHelper } = require("../../services/db");
const createError = require("http-errors");

/**
 * Grant a user permission to access an app that you own
 * @route POST /apps/access/<app_id>/add
 * @param {string} app_id.required in the path, specify the app id of the application the user should be granted permission to access
 * @param {string} username.required the username to grant permission to
 * @group permission
 * @returns {object} 200 - returns an object containing a boolean success field
 * @return {Error} default - Unexpected error
*/
async function addUserToApp(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const username = req.body.username;
        const result = await dbHelper.addUserToApp(app_id, username);
        if(result.error)
            throw result.error;
        res.send({
            modified: result.modified === true
        });
    } catch(err) {
        console.error(err);
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
 * Revoke permission from a given user to access an app that you own
 * @route POST /apps/access/<app_id>/remove
 * @param {string} app_id.required in the path, specify the app id of the application the user should have their permission revoked for
 * @param {string} username.required the username to revoke permission from
 * @group permission
 * @returns {object} 200 - returns an object containing a boolean success field
 * @returns {Error} default - Unexpected error
*/
async function removeUserFromApp(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const username = req.body.username;
        const result = await dbHelper.removeUserFromApp(app_id, username);
        if(result.error)
            throw result.error;
        res.send({
            modified: result.modified === true
        });
    } catch(err) {
        console.error(err);
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
 * Generate a list of users that are able to access an app you own
 * @route GET /apps/access/<app_id>
 * @param {string} app_id.required in the path, specify the app id of the application to list users for
 * @group permission
 * @returns {object} 200 - returns an object containing a list of usernames
 * @returns {Error} default - Unexpected error
*/
async function getUsersWhoCanAccessApp(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const result = await dbHelper.listUsersWhoCanAccessApp(app_id);
        if(result.error)
            throw result.error;
        res.send({
            usernames: result?.usernames || []
        });
    } catch(err) {
        console.error(err);
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

module.exports = app => {
    app.post("/apps/access/:app_id/add", addUserToApp);
    app.post("/apps/access/:app_id/remove", removeUserFromApp);
    app.get("/apps/access/:app_id", getUsersWhoCanAccessApp);
}
