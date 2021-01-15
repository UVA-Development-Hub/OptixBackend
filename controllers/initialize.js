const { getEntity } = require("../utils/optix-time-query-utils");

async function initialize(req, res, next) {
    const entity_ids = req.body.entity_ids;
    let timeseries = [];
    for (const entity_id of entity_ids) {
        try {
            const result = await getEntity({
                entity_id: entity_id,
                include_metadata: true,
                include_time_series: true,
            });
            if (result && result.status === 200 && result.statusText === "OK") {
                timeseries = timeseries.concat(result.data.results);
            }
        } catch (err) {
            console.error(err.response.config, err.response.data);
        }
    }
    res.locals.timeseries = timeseries;
    next();
}

module.exports = initialize;
