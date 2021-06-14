const config = require("../../config");
const CognitoExpress = new (require("cognito-express"))({
    region: config.cognito.region,
    cognitoUserPoolId: `${config.cognito.region}_${config.cognito.poolId}`,
    tokenUse: "access",
    tokenExpiration: 3600000,
});

function authenticate(req, res, next) {
    CognitoExpress.validate(req.headers["access-control-token"], (err, authenticated_user) => {
        if(err) res.status(401).send({
            message: 'invalid authentication token provided. verify a proper token was presented in the access-control-token header'
        });
        else next();
    });
}

module.exports = {
    authenticate
}
