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
if(config.nodeEnv === "PRODUCTION") {
    console.log("Enabled production authenticators");
    const { authenticate, require_admin, dataset_permission_check } = require("./services/auth");
    app.use(authenticate);
    app.use("/groups", require_admin);
    app.use("/dataset", dataset_permission_check);
} else {
    // Outside of production, each request is assigned a user
    // variable with access to every group in the system
    const { getGroups } = require("services/cognito");
    getGroups().then(allGroups => {
        app.use((req, res, next) => {
            req.user = {
                "cognito:groups": allGroups.map(({ GroupName }) => GroupName);
            };
            next();
        });
    });
}

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
