const { query } = require("../utils/optix-time-query-utils");
const createError = require("http-errors");
const {
    getUserId,
    createUser,
    getDatasetByUser,
} = require("../utils/user-db-query-utils");

/**
 * Description:
 *      use user subject to get dataset ids (entity_type_id and entity_typ) and return the
 *      first data
 *      if it is newly user, it will insert the subject to user_db
 *
 * @typedef {object} showResponseLocalsData
 * @property {string} subject user subject uuid
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function initialize(req, res, next) {
    // get user subject id
    const subject = res.locals.user.sub;
    try {
        // use subject to check if the user is existed (login) or not (sign up)
        let id = await getUserId(subject);
        if (!id) {
            await createUser(subject);
            id = await getUserId(subject);
        }

        // get array of entity_id and entity_type_id
        const datasetIds = getDatasetByUser(subject);
        let data = {};
        if (datasetIds.length) {
            // return first dataset
            const entity_id = datasetIds[0].entity_id;
            const options = {
                entity_id: entity_id,
                include_metadata: true,
                include_time_series: true,
                start_time: "1h-ago",
            };
            const result = await query("entity", options, "get");
            data = result.data.results[0]["timeseries"]["dps"];
        }
        res.status(200).json({
            status: "success",
            data: data,
            datasetIds: datasetIds,
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

module.exports = {
    initialize: initialize,
};
