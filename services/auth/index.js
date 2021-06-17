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
        if(!req.headers) unauthorized(res);
        CognitoExpress.validate(req.headers["access-control-token"], (err, authenticated_user) => {
            req.user = authenticated_user;
            if(err) unauthorized(res);
            else if(req.user.accessToken.payload["cognito:groups"].indexOf("approved") === -1) unauthorized(res, NeedsApprovedUser);
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
        if(req.user.accessToken.payload["cognito:groups"].indexOf("admin_group_crud") === -1) unauthorized(res);
        else next();
    } catch(err) {
        console.log("Unexpected admin authentication error:", err);
        res.status(500).send({
            message: "admin group verification failed"
        });
    }
}

module.exports = {
    authenticate,
    require_admin
}
