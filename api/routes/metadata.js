const metadataHelper = require("../../services/metadata");
const authMiddleware = require("../middleware/auth");
const createError = require("http-errors");

/**
 * Description:
 *      get metadata
 *
 * @typedef {object} showRequestQuery
 * @property {string} dataset dataset name (required).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function getMetadata(req, res, next) {
    try {
        const dataset = req.query.dataset;
        const metadata = await metadataHelper.get(dataset);
        res.status(200).json({
            status: "success",
            data: metadata,
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
 * Description:
 *      editMetadata middleware
 *
 * @typedef {object} showRequestQuery
 * @property {string} dataset (required).
 * @property {object} new_metadata (required).
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function editMetadata(req, res, next) {
    const dataset = req.body.dataset;
    const new_metadata = req.body.new_metadata;
    try {
        const metadata = await metadataHelper.edit(dataset, new_metadata);
        res.status(200).json({
            status: "success",
            data: metadata,
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
 * Description:
 *      create entity
 *
 * @typedef {object} showRequestQuery
 * @property {string} type the entity type name (required).
 * @property {string[]} dataset dataset name (required)
 * @property {object} metadata json of the metadata
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
async function createEntity(req, res, next) {
    // check if entity type exists
    try {
        const type = req.body.type;
        const dataset = req.body.dataset;
        const metadata = req.body.metadata;
        const group = req.body.group;
        await metadataHelper.create(type, dataset, metadata, group);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        if (err.response && err.response.status && err.response.data) {
            const errorData = err.response.data;
            if (
                errorData.hasOwnProperty("error") &&
                errorData.hasOwnProperty("message")
            ) {
                next(
                    createError(
                        err.response.status,
                        errorData.message + " " + errorData.error
                    )
                );
            } else if (errorData.hasOwnProperty("error")) {
                next(createError(err.response.status, errorData.error));
            } else {
                next(createError(err.response.status, errorData.message));
            }
        } else {
            next(createError(500, err));
        }
    }
}

module.exports = (app) => {
    // app.use("/metadata", authMiddleware.authenticate);
    app.get("/metadata", getMetadata);
    app.post("/metadata", editMetadata);
    app.put("/metadata", createEntity);
};
