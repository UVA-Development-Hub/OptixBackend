const fs = require("fs-extra");
const path = require("path");
const moment = require("moment");
const optixHelper = require("../optix");
const metadataHelper = require("../metadata");
const userHelper = require("../user");


const axios = require("axios");
const config = require("../../config");
const { v2: dbHelper } = require("../db");
const { DateTime } = require("luxon");

// agent for query openTSDB endpoint
const openTSDBAgent = axios.create({
    baseURL: config.opentsdb.url,
    timeout: 0,
});

//
//
//
//
//

async function getDataFromApp(app_id, startTime, endTime, timezone, metric, tags) {
    try {
        var metrics;
        if(metric) metrics = [metric];
        else {
            const metricsQuery = await dbHelper.getAppMetrics(app_id);
            if(metricsQuery.err)
            throw metricsQuery.err;
            metrics = metricsQuery.metrics;
        }
        metrics = metrics.map(metric => `m.${app_id}.${metric}`);

        const data = {};
        for(const metric of metrics) {
            const queryResult = await optixHelper.query(
                "timeseries",
                {
                    metric: metric,
                    start_time: toUTC(startTime),
                    end_time: endTime ? toUTC(endTime) : endTime,
                    tags: tags
                },
                "get"
            );
            if(queryResult.data.length > 0) {
                data[metric] = queryResult.data[0];
            }
        }
        return {
            data
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

// Helper function for the main TSV downloading function
async function getTsvData(app_id, chunkStart, chunkEnd, timezone, metric, tags) {
    startTime = chunkStart.format("YYYY/MM/DD HH:mm:ss");
    endTime = chunkEnd.format("YYYY/MM/DD HH:mm:ss");

    try {
        const { data, error } =
            await getDataFromApp(
                app_id,
                startTime,
                endTime,
                timezone,
                metric,
                tags
            );

        if(error)
            throw error;

        console.debug("data");
        console.debug(data);

        const tsv_data =
            Object.keys(data).map(key =>
                Object.entries(data[key].dps).map(([epoch_time, value]) =>
                    `${key}\t${epoch_time}\t${value}\t${JSON.stringify(data[key].tags)}\t[${data[key].aggregateTags.toString()}]`
                ).join("\n")
            );

        console.debug("tsv data");
        console.debug(tsv_data);
        console.debug('.');


        return tsv_data;
    } catch(err) { console.log(err); return false; }
}

/**
 * Download data from a particular dataset in tsv format. From a particular dataset, a single metric or all metrics can be downloaded.
 * @route GET /dataset/tsvdownload
 * @group dataset
 * @param {string} dataset.required dataset name formatted as either 'dataset.metric' (if data for a single metric is desired) or 'dataset' (if all metrics are desired) (required)
 * @param {string} start_time.required start time of the time range (required)
 * @param {string} end_time end time of the time range (optional)
 * @param {string} timezone optionally provide the timezones the provided times are relative to. defaults to EST/EDT
 * @param {string} metric optionally provide a metric to request data for. if not provided, all metrics are retrieved
 * @param {object} tags optionally provide an object of tag key/value pairs to filter on
 * @returns {object} 200 - returns
 * @returns {Error} default - Unexpected error
 */
async function* downloadTSVData(app_id, start_time, end_time, timezone, metric, tags) {
    try {
        function toUTC(time) {
            if(/^\d+$/.test(time)) return time;
            return DateTime.fromFormat(time, "yyyy/MM/dd HH:mm:ss", {
                zone: timezone
            }).setZone("UTC").toFormat("x");
        }

        let chunk_time = moment(toUTC(start_time), "x");
        let chunk_end = end_time ? moment(toUTC(endTime), "x") : moment();
        const filename = `app${app_id}.start${chunk_time.format("x")}.end${chunk_end.format("x")}.tsv`;
        yield filename;

        // Break the request into 30m chunks
        while(chunk_time.isBefore(chunk_end)) {
            // Compute the current chunk boundary
            let next_chunk_end = moment(chunk_time)
                .seconds(chunk_time.seconds() + 1800);

            // request tsv data for the current chunk
            let chunk =
                await getTsvData(
                    app_id,
                    chunk_time,
                    next_chunk_end,
                    timezone,
                    metric,
                    tags
                );

            // if there was not an arror with fetching the chunk, write
            // the chunk data to the response
            // also don't write the chunk if it's empty
            if(chunk && chunk !== '' && !/^\s*$/.test(chunk)) yield chunk;

            // move chunk start time forwards
            chunk_time = next_chunk_end;
        }
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}


//
//
//
//
//

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
    v2: {
        getDataFromApp: getDataFromApp,
        downloadTSVData: downloadTSVData,
    },
    getDataset: getDataset,
    download: download,
    createDataset: createDataset,
    search: search,
    getTsvData: getTsvData,
};
