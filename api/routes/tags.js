const optixHelper = require("../../services/optix");
const datasetHelper = require("../../services/dataset");

/**
 * Retrieve a JSON of tags for a particular datapoint of a metric
 * @route GET /tags/datapoint
 * @group tags
 * @param {string} dataset.required dataset name in the OpenTSDB
 * @param {string} datapoint.required key of the datapoint you want the tags for
 * @returns {object} 200 - returns tag key/value list
 * @returns {Error} default - Unexpected error
 */
async function getTagsForDatapoint(req, res) {
    try {
        if(!req.query.dataset || !req.query.datapoint) {
            res.status(400).send({
                message: "include 'dataset' and 'datapoint' querystring args"
            });
            return;
        }
        if(/$\d+^/.test(req.query.datapoint)) {
            res.status(400).send({
                message: "'datapoint' arg should be a unix timestamp (numerical string)"
            });
            return;
        }
        const result = await optixHelper.query("timeseries", {
            metric: req.query.dataset,
            start_time: req.query.datapoint,
            end_time: `${parseInt(req.query.datapoint) + 1}`
        }, "get");

        if(result.status !== 200 || (result.data && result.data.length === 0)) {
            res.status(500).send({
                message: "internal data query failed"
            });
            return;
        }

        res.status(200).send({
            tags: result.data[0].tags
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            message: "failed to retrieve tags"
        });
    }
}

/**
 * Retrieve a list of possible values a tag can take on within a particular metric.
 * @route GET /tags/values
 * @group tags
 * @param {string} dataset.required dataset name in the OpenTSDB
 * @param {string} tag.required name of the tag you want the possible values for
 * @returns {object} 200 - returns tag value list
 * @returns {Error} default - Unexpected error
 */
async function getTagValuesForMetric(req, res) {
    try {
        if(!req.query.dataset || !req.query.tag) {
            res.status(400).send({
                message: "include 'dataset' querystring arg"
            });
            return;
        }

        const result = await optixHelper.query("tag", {
            metric: req.query.dataset,
            tag: req.query.tag
        }, "get");

        if(result.status !== 200 || !result.data) {
            res.status(500).send({
                message: "internal data query failed"
            });
            return;
        }

        res.status(200).send({
            dataset: req.query.dataset,
            tag: req.query.tag,
            values: result.data
        });
    } catch(err) {
        console.log(err);
        res.status(500).send({
            message: "failed to retrieve tag values"
        });
    }
}

/**
 * Retrieves the same data as the /dataset endpoint does, but additionally fetches tag values for indivudual datapoint. Instead of each datapoint key mapping to a single value, it maps to an object with 'value' and 'tags' keys, where datapoint-specific tags are found under the 'tags' key.
 * @route GET /dataset_tag_combo
 * @group tags
 * @param {string} dataset.required dataset name in the OpenTSDB
 * @param {string} start_time.required the time from which the dataset search should begin
 * @param {string} end_time optionally provide a time where the dataset search should end. Defaults to now
 * @param {string} timezone optionally provide a timezone for the datetimes provided in your query. Defaults to the server's timezone
 * @param {object} tags optionally provide a JSON object specifying desired tag values (i.e. only return datapoints with a certain tag and tag value)
 * @returns {object} 200 - returns dataset values with per-datapoint tags
 * @returns {Error} default - Unexpected error
 */
async function getDatasetTagCombo(req, res) {
    try {
        if(!req.query.dataset || !req.query.start_time) {
            res.status(400).send({
                message: "include 'dataset' and 'start_time' querystring args"
            });
            return;
        }

        const raw_data = await datasetHelper.getDataset(req.query.dataset, req.query.start_time, req.query.end_time, req.query.timezone, req.query.tags || {});
        if(!raw_data) {
            res.status(500).send({
                message: "internal data query failed"
            });
            return;
        }

        let responseData = [];
        for(const {metric, tags, aggregateTags, dps} of raw_data) {
            let blob = {
                metric,
                tags,
                aggregateTags,
                dps: {}
            };

            // For each datapoint, we need to get the tags for it
            for(const timestamp in dps) {
                // Query the timeseries endpoint for this datapoint only
                const tsResponse = await optixHelper.query("timeseries", {
                    metric,
                    start_time: timestamp,
                    end_time: `${parseInt(timestamp) + 1}`
                }, "get");

                // Extract tags from the timeseries response, or use a default tag list
                if(tsReponse.status !== 200 || !tsResponse.data) var tsTags = {};
                else var tsTags = tsResponse.data[0].tags;

                // Remove tags from the datapoint-specific tag list if the tag is shared
                // across all datapoints in this query.
                for(const key in tags) {
                    delete tsTags[key];
                }

                // Each datapoint timestamp now points to a value and a
                // list of point-specific tags.
                blob.dps[timestamp] = {
                    value: dps[timestamp],
                    tags: tsTags
                }
            }

            // Add the data blob to the responseData list
            responseData.push(blob);
        }

        res.status(200).send({
            data: responseData
        });
    } catch(err) {
        console.log(err);
        res.status(500).send({
            message: "failed to generate dataset/tag combo"
        });
    }
}

module.exports = app => {
    app.get("/tags/datapoint", getTagsForDatapoint);
    app.get("/tags/values", getTagValuesForMetric);
    app.get("/dataset_tag_combo", getDatasetTagCombo);
}
