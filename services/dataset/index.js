const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const optixHelper = require("../optix");
const metadataHelper = require("../metadata");
const userHelper = require("../user");
const dbHelper = require("../../utils/user-db-query-utils");

const openTSDBAgent = axios.create({
    baseURL: "http://optix-open-tsdb.optix-stack-servicelocal:4242/api/uid/",
    timeout: process.env.TIMEOUT || 0,
});

function download(data, metric, start_time, end_time) {
    start_time = start_time.replace(/\//g, "-");
    let filename = `${metric}_${start_time}`;
    if (end_time) {
        end_time = end_time.replace(/\//g, "-");
        filename += `_${end_time}`;
    }
    filename += ".json";
    const filePath = path.normalize(__dirname + `/../public/downloads/${filename}`);
    if (fs.pathExistsSync(filePath)) {
        fs.removeSync(filePath);
    }
    fs.outputJsonSync(filePath, data);
    return filePath;
}

async function createDataset(prefix, sensors, sensorType, metadata, group) {
    // set up metric name
    // check if metric exists
    let options = {
        t: "metrics",
        q: prefix,
    };
    let result = await optixHelper.query("search", options, "get");
    if (result.data.length != 0) {
        throw "metric already exists.";
    }
    const metrics = sensors.map((sensor) => `${prefix}.${sensor}`);
    // add metric name in opentsdb
    for (const metricName of metrics) {
        options = {
            metric: metricName,
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
        prefix,
        sensorType
    );
    if (datasetId == null) {
        throw "failed to create dataset.";
    }
    // add dataset to group in db
    await userHelper.addDatasetToGroup([datasetId], group);
}

module.exports = {
    download: download,
    createDataset: createDataset,
};
