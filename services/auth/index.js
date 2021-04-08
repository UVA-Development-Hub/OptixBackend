const axios = require("axios");
const CognitoExpress = require("cognito-express");
require("dotenv").config({ path: "../../" });
const querystring = require("querystring");

const cognitoExpress = new CognitoExpress({
    region: process.env.COGNITO_REGION,
    cognitoUserPoolId: `${process.env.COGNITO_REGION}_${process.env.COGNITO_POOL_ID}`,
    tokenUse: "access", //Possible Values: access | id
    tokenExpiration: 3600000, //Up to default expiration of 1 hour (3600000 ms)
});

const cognitoAgent = axios.create({
    baseURL: process.env.COGNITO_BASEURL,
    timeout: parseInt(process.env.COGNITO_TIMEOUT) || 0,
    headers: {
        Authorization: `Basic ${process.env.COGNITO_AUTH}`,
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
            client_id: process.env.COGNITO_CLIENT_ID,
            redirect_uri: process.env.COGNITO_REDIRECT_URI,
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
