const config = require("../../config");
const CognitoExpress = new (require("cognito-express"))({
    region: config.cognito.region,
    cognitoUserPoolId: `${config.cognito.region}_${config.cognito.poolId}`,
    tokenUse: "access",
    tokenExpiration: 3600000,
});
const { v2: dbHelper } = require("../db");

const NeedsAdmin = "this endpoint requires admin access. ensure the access token provided in the access-control-token header is valid and that its owner has membership in the admin_group_crud group";
const NeedsApprovedUser = "a valid access-control-token was provided, but the user must be approved before accessing endpoints";
const NoUser = "invalid or expired access-control-token provided";
const AuthException = "unexpected exception during authentication prevented validation of the presented token";

function unauthorized(res, message) {
    res.status(401).send({
        message
    });
}

// All api endpoints are locked behind this function
// In order to access any endpoint, a user must furnish
// a valid access token.
function authenticate(req, res, next) {
    try {
        // Send through requests to the base url
        // to support basic check-if-alive pings
        if(req._parsedUrl.pathname === "/") {
            next();
            return;
        }

        // If there are no provided headers,
        // immediately deny the request
        if(!req.headers) {
            unauthorized(res);
            return;
        }

        // TSV downloa requests have their authentication
        // sent in via query string argument
        if (req._parsedUrl.pathname === "/dataset/tsvdownload") {
            Object.assign(req.headers, {
                "access-control-token": req.query["access-control-token"]
            });
        }
        CognitoExpress.validate(req.headers["access-control-token"], (err, authenticated_user) => {
            if(!authenticated_user) {
                unauthorized(res, NoUser);
                return;
            }
            if(!authenticated_user["cognito:groups"]) authenticated_user = [];
            req.user = authenticated_user;
            if(err) unauthorized(res, AuthException);
            else if(req.user["cognito:groups"].indexOf("approved") === -1) unauthorized(res, NeedsApprovedUser);
            else next();
        });
    } catch(err) {
        console.log("Unexpected authentication error:", err);
        res.status(500).send({
            message: "token verification failed"
        });
    }
}

// Endpoints under /groups are locked to admin_group_crud
// group members only. In order to access them, a user must
// furnish an access token representing a user account
// possessing membership of this group.
function require_admin(req, res, next) {
    try {
        if(req.user["cognito:groups"].indexOf("admin_group_crud") === -1) unauthorized(res);
        else next();
    } catch(err) {
        console.log("Unexpected admin authentication error:", err);
        res.status(500).send({
            message: "admin group verification failed"
        });
    }
}

async function dataset_permission_check(req, res, next) {
    try {
        // All requests are authenticated at this point,
        // so we definitely have user data in req.user

        // ----------------------------------------------
        // TODO: handle the PUT request??
        // If this is the PUT /dataset, the user needs
        // to be in the following group: admin_group_crud
        // ----------------------------------------------

        // The dataset search method works outside the realm
        // of this check... :)
        if(req._parsedUrl.pathname === "/dataset/search") {
            next();
            return;
        }

        const { getDatasetInfo, checkUserAccess } = require("../db");

        const [ entry ] = await getDatasetInfo(req.query.dataset);

        const accessible = req.user["cognito:groups"].indexOf("admin_allow_all") > -1 ? true
            : entry ? await checkUserAccess(req.user["cognito:groups"], entry.entity_id) : false;

        if(accessible) next();
        else res.status(403).send({
            message: "dataset inaccessible"
        });
    } catch(err) {
        console.log("Unexpected failure in verification of sensor access");
        console.log(err);
        res.status(500).send({
            message: "admin sensor access verification failed"
        });
    }
}

// Checks to see if the user represented by the presented token
// actually has permission to view the app which they requested.
async function appAccessCheck(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const { accessible, error } = await dbHelper.userAccessCheck(
            req.user.username,
            req.user["cognito:groups"],
            app_id
        );
        // (accessible && error) is not possible
        if(accessible && !error) {
            next();
            return;
        }
        if(!accessible && !error) {
            res.status(403).send({
                message: "insufficient permissions to view this resource"
            });
            return;
        }
        throw error;
    } catch(err) {
        console.error(err);
        res.status(500).send({
            error: err,
            message: "unexpected error in appAccessCheck"
        });
    }
}

module.exports = {
    v2: {
        authenticate,
        appAccessCheck
    },
    authenticate,
    require_admin,
    dataset_permission_check
}
