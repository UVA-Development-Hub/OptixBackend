// routes here are exposed to the world
const { v2: dbHelper } = require("../../services/db");
const { v2: datasetHelper } = require("../../services/dataset");
const { DateTime } = require("luxon");
const createError = require("http-errors");

/**
 * List apps
 * @route GET /apps/list
 * @group apps
 * @returns {object} 200 - returns a list of apps that you have permission to view
 * @returns {Error} default - Unexpected error
 */
async function listApps(req, res, next) {
    try {
        const username = req.user.username;
        const groups = req.user["cognito:groups"];
        const { error, apps } = await dbHelper.listAccessibleApps(username, groups);
        res.send({
            error,
            apps
        });
    } catch(err) {
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

/**
 * List apps owned by the requesting user
 * @route GET /apps/myapps
 * @group apps
 * @returns {object} 200 - returns a list of apps that you own
 * @returns {Error} default - Unexpected error
 */
async function myApps(req, res, next) {
    try {
        const username = req.user.username;
        const { error, apps } = await dbHelper.listOwnedApps(username);
        res.send({
            error,
            apps
        });
    } catch(err) {
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

/**
 * List apps
 * @route GET /apps/search
 * @param {string} query.required
 * @group apps
 * @returns {object} 200 - returns a list of apps that match the given query and you have permission to view
 * @returns {Error} default - Unexpected error
 */
async function searchApps(req, res, next) {
    try {
        const username = req.user.username;
        const groups = req.user["cognito:groups"];
        const searchQuery = req.query.query || "";
        const { error, apps } = await dbHelper.searchApps(username, groups, searchQuery);
        res.send({
            error,
            apps
        });
    } catch(err) {
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

/**
 * List metrics for a particular app. You must have permission to access the requested app
 * @route GET /apps/metrics/<app_id>
 * @param {int} app_id.required in the path, provide the unique integer id of the app you'd like metrics for (required)
 * @group apps
 * @returns {object} 200 - returns a list of metrics for the requested app
 * @returns {Error} default - Unexpected error
 */
async function listMetrics(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const { error, metrics } = await dbHelper.getAppMetrics(app_id);
        res.send({
            error,
            metrics
        });
    } catch(err) {
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

/**
 * Retrieve data from a particular app in a particular time range
 * @route GET /apps/data/<app_id>
 * @group apps
 * @param {int} app_id.required in the path, specify the unique integer id of the app you'd like data for (required)
 * @param {string} timezone optionally provide the timezones the provided times are relative to. defaults to EST/EDT
 * @param {string} start_time.required  start of the time range to retrieve data from (required)
 * @param {string} end_time optionally provide the end of the time range. by default, this is the current time
 * @param {string} metric optionally provide a metric to request data for. if not provided, all metrics are retrieved
 * @param {object} tags optionally provide an object of tag key/value pairs to filter on
 * @returns {object} 200 - returns a list of data points for the given app in the
 * @returns {Error} default - Unexpected error
 */
async function dataFromApp(req, res, next) {
    try {
        const app_id = req.params.app_id;
        const timezone = req.query.timezone || DateTime.local().zoneName;
        const startTime = req.query.start_time;
        const endTime = req.query.end_time;
        const tags = req.query.tags;

        const { data, error } = await datasetHelper.getDataFromApp(app_id, startTime, endTime, timezone, tags);
        res.send({
            data,
            error
        });
    } catch(err) {
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

/**
 * Does the same thing as /apps/data/<app_id>, but automatically downloads it as a formatted tsv (tab-separated-values) file
 * @route GET /apps/download/<app_id>
 * @group apps
 * @param {int} app_id.required in the path, specify the unique integer id of the app you'd like data for (required)
 * @param {string} timezone optionally provide the timezones the provided times are relative to. defaults to EST/EDT
 * @param {string} start_time.required  start of the time range to retrieve data from (required)
 * @param {string} end_time optionally provide the end of the time range. by default, this is the current time
 * @param {string} metric optionally provide a metric to request data for. if not provided, all metrics are retrieved
 * @param {object} tags optionally provide an object of tag key/value pairs to filter on
 * @returns {object} 200 - returns a list of data points for the given app in the
 * @returns {Error} default - Unexpected error
 */
async function downloadDataFromApp(req, res, next) {
    const input_date_format = 'YYYY/MM/DD HH:mm:ss';
    try {
        // todo
        // use generator app under the hood to do the data transmission
        const app_id = req.params.app_id;
        const start_time = req.query.start_time;
        const end_time = req.query.end_time;
        const metric = req.query.metric;
        const tags = req.query.tags;
        const timezone = req.query.timezone || DateTime.local().zoneName;

        if(!start_time) {
            res.status(400).send({
                message: "missing required querystring argument start_time"
            });
            return;
        }

        const asyncIterator = datasetHelper.downloadTSVData(app_id, start_time, end_time, timezone, metric, tags)
        const filename = await asyncIterator.next();
        if(!filename.value) {
            throw "filename failed to generate";
        }
        res.set({
            "Content-Disposition": `attachment; filename="${filename.value}"`,
            "Content-Type": "text/csv",
        });
        res.write("metric\ttimestamp\tvalue\ttags\taggregate tags");

        let abort = false;
        function cancelDownload() { abort = true; }
        res.on("aborted", cancelDownload);
        res.on("close", cancelDownload);
        for await (const chunk of asyncIterator) {
            if(abort) break;
            res.write(`\n${chunk}`);
        }
        res.end();
    } catch(err) {
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



module.exports = app => {
    app.get("/apps/list", listApps);
    app.get("/apps/myapps", myApps);
    app.get("/apps/metrics/:app_id", listMetrics);
    app.get("/apps/data/:app_id", dataFromApp);
    app.get("/apps/download/:app_id", downloadDataFromApp);
    app.get("/apps/search", searchApps);
}
