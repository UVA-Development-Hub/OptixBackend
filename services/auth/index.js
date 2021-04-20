const axios = require("axios");
const CognitoExpress = require("cognito-express");
const config = require("../../config");
const querystring = require("querystring");

const cognitoExpress = new CognitoExpress({
    region: config.cognito.region,
    cognitoUserPoolId: `${config.cognito.region}_${config.cognito.poolId}`,
    tokenUse: "access", //Possible Values: access | id
    tokenExpiration: 3600000, //Up to default expiration of 1 hour (3600000 ms)
});

const cognitoAgent = axios.create({
    baseURL: config.cognito.baseUrl,
    timeout: parseInt(config.cognito.timeout) || 0,
    headers: {
        Authorization: `Basic ${config.cognito.auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
    },
});

async function getToken(code) {
    const result = await cognitoAgent.post(
        "oauth2/token",
        // since cognito only receive x-www-form-urlencoded
        // the body need to be processed by query string first
        querystring.stringify({
            code: code,
            grant_type: "authorization_code",
            client_id: config.cognito.clientId,
            redirect_uri: config.cognito.redirectUri,
        })
    );
    return result;
}

async function validate(accesstoken) {
    return await cognitoExpress.validate(accesstoken);
}

module.exports = {
    getToken: getToken,
    validate: validate,
};
