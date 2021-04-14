const authMiddleware = require("../middleware/auth");
const optixHelper = require("../../services/optix");
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
        const endpoint = "timeseries";
        const options = req.query;
        const result = await optixHelper.query(endpoint, options, "get");
        if (req.originalUrl.includes("download")) {
            // return data to next for download
            res.locals.data = result.data;
            next();
        } else {
            // return data to json
            res.status(200).json({
                status: "success",
                data: result.data,
            });
        }
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

async function download(req, res) {
    try {
        const start_time = req.query.start_time;
        const end_time = req.query.end_time;
        const metric = req.query.metric;
        const data = res.locals.data;

        const filePath = datasetHelper.download(data, metric, start_time, end_time);

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
        const endpoint = "search";
        const options = req.query;
        const result = await optixHelper.query(endpoint, options, "get");
        res.status(200).json({
            status: "success",
            data: result.data,
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
    app.use("/dataset", authMiddleware.authenticate);
    app.get("/dataset", getDataset);
    app.put("/dataset", createDataset);
    app.get("/dataset/download", getDataset, download);
    app.get("/dataset/search-metrics", search);
};
