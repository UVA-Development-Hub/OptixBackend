const config = require("../../config");
const CognitoExpress = new (require("cognito-express"))({
    region: config.cognito.region,
    cognitoUserPoolId: `${config.cognito.region}_${config.cognito.poolId}`,
    tokenUse: "access",
    tokenExpiration: 3600000,
});

const NeedsAdmin = "this endpoint requires admin access. ensure the access token provided in the access-control-token header is valid and that its owner has membership in the admin_group_crud group";
const NeedsApprovedUser = "a valid access-control-token was provided, but the user must be approved before accessing endpoints";

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
        if(req._parsedUrl.pathname === "/") {
            next();
            return;
        }
        if(!req.headers) unauthorized(res);
        CognitoExpress.validate(req.headers["access-control-token"], (err, authenticated_user) => {
            req.user = authenticated_user;
            if(err) unauthorized(res);
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
        console.log("permission check engaged");
        if(req._parsedUrl.pathname === "/dataset/search") {
            console.log("exempted");
            next();
            return;
        }

        const { getDatasetInfo, checkUserAccess } = require("../db");

        const [{ entity_id }] = await getDatasetInfo(req.query.dataset);
        const accessible = await checkUserAccess(req.user["cognito:groups"], entity_id);

        if(accessible) next();
        else res.status(403).send({
            message: "dataset inaccessible"
        });
    } catch(err) {
        console.log("Unexpected failure in verification of sensor access");
        res.status(500).send({
            message: "admin sensor access verification failed"
        });
    }
}

module.exports = {
    authenticate,
    require_admin,
    dataset_permission_check
}
