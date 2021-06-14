const createError = require("http-errors");
const HTTPStatuses = require("statuses");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const api = require("./api");
const config = require("./config");
const app = express();

app.use(cors());
// log
const rfs = require("rotating-file-stream");
const logger = require("morgan");
const accessLogStream = rfs.createStream("access.log", {
    maxFiles: 20,
    size: "50M",
    interval: "1d", // rotate daily
    path: path.join(__dirname, "logs/access"),
});
app.use(logger("combined", { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Authenticator
const CognitoExpress = new (require("cognito-express"))({
    region: config.cognito.region,
    cognitoUserPoolId: `${config.cognito.region}_${config.cognito.poolId}`,
    tokenUse: "access",
    tokenExpiration: 3600000,
});
app.use(function(req, res, next) {
    CognitoExpress.validate(req.headers["access-control-token"], (err, authenticated_user) => {
        if(err) res.status(401).send({
            message: 'invalid authentication token provided. verify a proper token was presented in the access-control-token header'
        });
        else next();
    });
});

api(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    let messageToSend = null;
    if (err instanceof createError.HttpError) {
        // handle http err
        messageToSend = { message: err.message };

        if (config.nodeEnv === "development") {
            messageToSend.stack = err.stack;
        }

        messageToSend.status = err.statusCode;
    } else {
        // log other than HTTP errors
        console.error(err.stack);
    }

    if (config.nodeEnv === "production" && !messageToSend) {
        messageToSend = { message: "Something broke", status: 500 };
    }

    if (messageToSend) {
        let statusCode = parseInt(messageToSend.status, 10);
        let statusName = HTTPStatuses(statusCode);

        res.status(statusCode);
        let responseObject = {
            error: statusName,
            code: statusCode,
            message: messageToSend.message,
        };

        if (messageToSend.stack) {
            responseObject.stack = messageToSend.stack;
        }

        res.json(responseObject);
        return;
    }

    // if this is not HTTP error and we are not in production,
    // send all error
    res.status(500).json(err);
});

module.exports = app;
