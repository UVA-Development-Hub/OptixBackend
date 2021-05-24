const authMiddleware = require("../middleware/auth");
const datasetHelper = require("../../services/dataset");
const createError = require("http-errors");

/**
 * Get dataset
 * @route GET /dataset
 * @group dataset
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @param {string} start_time.required start time of the time range (required).
 * @param {string} end_time end time of the time range (optional).
 * @param {object} tags key:value pairs to filter on (optional).
 * @returns {object} 200 - returns timeseries data that matching the given query
 * @returns {Error} default - Unexpected error
 */
async function getDataset(req, res, next) {
    try {
        const dataset = req.query.dataset;
        const startTime = req.query.start_time;
        const endTime = req.query.end_time;
        const tags = req.query.tags;
        if(!dataset || dataset === "") {
            res.status(400).json({
                error: "empty dataset"
            });
            return;
        }
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

/**
 * Download dataset
 * @route GET /dataset/download
 * @group dataset
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @param {string} start_time.required start time of the time range (required).
 * @param {string} end_time end time of the time range (optional).
 * @returns {object} 200 - returns timeseries data that matching the given query
 * @returns {Error} default - Unexpected error
 */
async function download(req, res, next) {
    try {
        const start_time = req.query.start_time;
        const end_time = req.query.end_time;
        const dataset = req.query.dataset;
        if(!dataset || dataset === "") {
            res.status(400).json({
                error: "empty dataset"
            });
            return;
        }
        const filePath = await datasetHelper.download(dataset, start_time, end_time);

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

/**
 * Search dataset
 * @route GET /dataset/search
 * @group dataset
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @param {integer} max maximum number of values (optional).
 * @returns {[string]} 200 - list of datasets
 * @returns {Error} default - Unexpected error
 */
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

/**
 * Add new dataset
 * @route PUT /dataset
 * @group dataset
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @param {[string]} sensors.required sensors of the new dataset (requried).
 * @param {string} sensor_type.required sensor type name (required).
 * @param {string} group.required group name where the dataset belongs to (required).
 * @param {object} metadata metadata of the dataset in json format (optional).
 * @returns {[string]} 200
 * @returns {Error} default - Unexpected error
 */
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
