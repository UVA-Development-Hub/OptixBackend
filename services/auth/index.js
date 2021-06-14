const config = require("../../config");
const CognitoExpress = new (require("cognito-express"))({
    region: config.cognito.region,
    cognitoUserPoolId: `${config.cognito.region}_${config.cognito.poolId}`,
    tokenUse: "access",
    tokenExpiration: 3600000,
});

function authenticate(req, res, next) {
    function unauthorized() {
        res.status(401).send({
            message: "invalid authentication token provided. verify a proper token was presented in the access-control-token header"
        });
    }
    try {
        if(!req.headers) unauthorized();
        CognitoExpress.validate(req.headers["access-control-token"], (err, authenticated_user) => {
            if(err) unauthorized();
            else next();
        });
    } catch(err) {
        console.log("Unexpected authentication error:", err);
        unauthorized();
    }
}

module.exports = {
    authenticate
}
