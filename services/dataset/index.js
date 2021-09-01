const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const optixHelper = require("../optix");
const metadataHelper = require("../metadata");
const userHelper = require("../user");
const dbHelper = require("../db");
const config = require("../../config");

const { DateTime } = require("luxon");

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
async function getDataset(dataset, startTime, endTime, timezone, tags) {
    const metrics = await search(dataset);
    const data = [];
    for(const metric of metrics) {
        function toUTC(time) {
            if(/^\d+$/.test(time)) return time;
            return DateTime.fromFormat(time, "yyyy/MM/dd HH:mm:ss", {
                zone: timezone
            }).setZone("UTC").toFormat("x");
        }
        const result = await optixHelper.query(
            "timeseries",
            {
                metric: metric,
                start_time: toUTC(startTime),
                end_time: endTime ? toUTC(endTime) : endTime,
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
 *      get data from Optix timeseries endpoint and transform it into tsv format
 * @param {string} dataset dataset name (required).
 * @param {string} chunkStart start time(required).
 * @param {string} chunkEnd end time (required).
 * @return {string} tsv string containing data from the time chunk starting at chunkStart
 */
async function getTsvData(dataset, chunkStart, chunkEnd) {
    startTime = chunkStart.format("YYYY/MM/DD HH:mm:ss");
    endTime = chunkEnd.format("YYYY/MM/DD HH:mm:ss");

    try {
        const chunk_data =
        await getDataset(
            dataset,
            startTime,
            endTime);
        const tsv_data = chunk_data.map(({metric, tags, aggregateTags, dps}) =>
            Object.entries(dps).map(([epoch_time, value]) =>
                `${metric}\t${epoch_time}\t${value}\t${JSON.stringify(tags)}\t[${aggregateTags.toString()}]`
            ).join("\n")
        ).join("\n");
        return tsv_data;
    } catch(err) { return false; }
}

/**
 * Description:
 *      create a new dataset
 * @param {string} dataset dataset name (required).
 * @param {string} sensors start time(required).
 * @param {string} sensorType sensor type name (required).
 * @param {string} metadata end time (optional).
 */
async function createDataset(dataset, sensors, sensorType, metadata) {
    async function addMetrics(metrics) {
        const add_metrics = metrics.map(metric => `${dataset}.${metric}`);
        // add metric name in opentsdb
        for (const metricName of add_metrics) {
            const options = {
                params: {
                    metric: metricName,
                }
            };
            await openTSDBAgent.get("assign", options);
        }
    }

    let result = await search(dataset);
    const datasetExists = result.length != 0;
    if(datasetExists) {
        // The dataset already exists. The only thing we need to do is see if there are any new metrics to add.
        const existingMetrics = result.map(metric => metric.split(".")[1]);
        const newMetrics = sensors.filter(sensor => existingMetrics.indexOf(sensor) === -1);
        if(newMetrics.length === 0) return {status: 200, message: "There are no new metrics to add. Nothing has changed."};
        await addMetrics(newMetrics);
        return {status: 200, message: `New metrics (${newMetrics.toString()}) added.`};
    } else {
        // This is a new dataset. We need to create it.
        const metrics = sensors.map(sensor => `${dataset}.${sensor}`);
        const { entity_id, entity_type_id } = await metadataHelper.create(
            sensorType,
            metrics,
            metadata
        );

        // create entity
        // create entity_id and entity_type_id in db
        const datasetId = await dbHelper.addDataset(
            entity_id,
            entity_type_id,
            dataset,
            sensorType
        );
        if (!datasetId) {
            return {status: 500, message: "Dataset creation failed."};
            // throw "failed to create dataset.";
        }

        await addMetrics(sensors);
        return {status: 200, message: "Created new dataset and added metrics."};
    }
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
    getTsvData: getTsvData,
};
