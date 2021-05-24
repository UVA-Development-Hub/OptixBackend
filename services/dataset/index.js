const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const optixHelper = require("../optix");
const metadataHelper = require("../metadata");
const userHelper = require("../user");
const dbHelper = require("../db");
const config = require("../../config");

// agent for query openTSDB endpoint
const openTSDBAgent = axios.create({
    baseURL: config.opentsdb.url,
    timeout: 0,
});

/**
 * Description:
 *      get data from Optix timeseries endpoint
 *
 * @param {string} dataset dataset name (required).
 * @param {string} startTime start time (required).
 * @param {string} endTime end time (optional).
 * @param {object} tags key:value pairs to filter on (optional).
 * @return {object} data
 */
async function getDataset(dataset, startTime, endTime, tags) {
    const metrics = await search(dataset);
    const data = [];
    for(const metric of metrics) {
        const result = await optixHelper.query(
            "timeseries",
            {
                metric: metric,
                start_time: startTime,
                end_time: endTime,
                tags: tags,
            },  
            "get"
        );
        if(result.data.length === 0) {
            break;
        }
        data.push(result.data[0]);
    }
    return data;
}

/**
 * Description:
 *      get data from Optix timeseries endpoint and store in the /public/download
 * @param {string} dataset dataset name (required).
 * @param {string} startTime start time(required).
 * @param {string} endTime end time (optional).
 * @return {string} file path
 */
async function download(dataset, startTime, endTime) {
    const data = await getDataset(dataset, startTime, endTime);
    startTime = moment(new Date(startTime)).format("YYYY-MM-DDTHH-mm-ss");
    let filename = `${dataset}_${startTime}`;
    if (endTime) {
        endTime = moment(new Date(endTime)).format("YYYY-MM-DDTHH-mm-ss");
        filename += `_${endTime}`;
    }

    filename += ".json";
    const filePath = path.normalize(__dirname + `/../../public/downloads/${filename}`);

    if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
    }
    await fs.outputJson(filePath, data);
    return filePath;
}

/**
 * Description:
 *      create a new dataset
 * @param {string} dataset dataset name (required).
 * @param {string} sensors start time(required).
 * @param {string} sensorType sensor type name (required).
 * @param {string} metadata end time (optional).
 * @param {string} group group name where the dataset belongs to (required).
 */
async function createDataset(dataset, sensors, sensorType, metadata, group) {
    // set up metric name
    // check if metric exists
    let result = await search(dataset);
    if (result.length != 0) {
        throw "metric already exists.";
    }
    const metrics = sensors.map((sensor) => `${dataset}.${sensor}`);
    // add metric name in opentsdb
    for (const metricName of metrics) {
        const options = {
            params: {
                metric: metricName,
            }
        };
        await openTSDBAgent.get("assign", options);
    }
    // create entity
    const { entity_id, entity_type_id } = await metadataHelper.create(
        sensorType,
        metrics,
        metadata
    );
    // create entity_id and entity_type_id in db
    const datasetId = await dbHelper.addDataset(
        entity_id,
        entity_type_id,
        dataset,
        sensorType
    );
    if (!datasetId) {
        throw "failed to create dataset.";
    }
    // add dataset to group in db
    await userHelper.addDatasetsToGroup([dataset], group);
}

/**
 * Description:
 *      search the dataset
 * @param {string} dataset dataset name (required).
 * @param {integer} max maximum number of values (optional).
 * @return {[string]} a list of dataset
 */
async function search(dataset, max) {
    let options = {
        t: "metrics",
        q: dataset,
        max: max || 9999,
    };
    let result = await optixHelper.query("search", options, "get");
    return result.data;
}

module.exports = {
    getDataset: getDataset,
    download: download,
    createDataset: createDataset,
    search: search,
};
