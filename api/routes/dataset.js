const authMiddleware = require("../middleware/auth");
const datasetHelper = require("../../services/dataset");
const createError = require("http-errors");

/**
 * Description:
 *      timeseries middleware
 *
 * @typedef {object} showRequestQuery
 * @property {string} metric metric name in the OpenTSDB (required).
 * @property {string} start_time start time of the time range (required).
 * @property {string} end_time end time of the time range (optional).
 * @property {object} tags key:value pairs to filter (optional).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function getDataset(req, res, next) {
    try {
        const dataset = req.query.dataset;
        const startTime = req.query.start_time;
        const endTime = req.query.end_time;
        const tags = req.query.tags;
        const data = await datasetHelper.getDataset(dataset, startTime, endTime, tags);
        res.status(200).json({
            status: "success",
            data: data,
        });
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

async function download(req, res, next) {
    try {
        const start_time = req.query.start_time;
        const end_time = req.query.end_time;
        const metric = req.query.metric;

        const filePath = await datasetHelper.download(metric, start_time, end_time);

        res.download(filePath);
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

async function search(req, res, next) {
    try {
        const dataset = req.query.dataset;
        const max = req.query.max;
        const result = await datasetHelper.search(dataset, max);
        res.status(200).json({
            status: "success",
            data: result,
        });
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

async function createDataset(req, res, next) {
    try {
        const dataset = req.body.dataset;
        const sensors = req.body.sensors;
        const sensorType = req.body.sensor_type;
        const metadata = req.body.metadata || {};
        const group = req.body.group;
        await datasetHelper.createDataset(dataset, sensors, sensorType, metadata, group);
        res.status(200).json({
            status: "success",
        });
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

module.exports = (app) => {
    // app.use("/dataset", authMiddleware.authenticate);
    app.get("/dataset", getDataset);
    app.put("/dataset", createDataset);
    app.get("/dataset/download", download);
    app.get("/dataset/search", search);
};
