const axios = require("axios");
const CognitoExpress = require("cognito-express");
const querystring = require("querystring");
const createError = require("http-errors");
require("dotenv").config({ path: "../" });

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

async function auth(req, res, next) {
    let accessTokenFromClient = res.locals.data.access_token;

    // Fail if token not present in header.
    if (!accessTokenFromClient) {
        next(createError(401, "Access Token missing."));
        return;
    }

    cognitoExpress.validate(accessTokenFromClient, function (err, response) {
        // If API is not authenticated, Return 401 with error message.
        if (err) {
            next(createError(401, err));
            return;
        }

        //Else API has been authenticated. Proceed.
        res.locals.user = response;
        console.log(response);
        next();
    });
}

module.exports = {
    auth: auth,
    getToken: getToken,
};
