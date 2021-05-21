const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const optixHelper = require("../optix");
const metadataHelper = require("../metadata");
const userHelper = require("../user");
const dbHelper = require("../db");
const config = require("../../config");

const openTSDBAgent = axios.create({
    baseURL: config.opentsdb.url,
    timeout: 0,
});

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
