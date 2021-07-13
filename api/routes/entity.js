const dbHelper = require("../../services/db");

/**
 * Get dataset info
 * @route GET /entity/get_entity_id
 * @group dataset
 * @param {string} dataset.required dataset name in the OpenTSDB (required).
 * @returns {object} 200 - returns the entity_id of the dataset or null
 * @returns {Error} default - Unexpected error
 */
async function getEntityId(req, res) {
    const info = await dbHelper.getDatasetInfo(req.query.dataset);
    res.status(200).send({
        status: "success",
        dataset: info ? info[0] : null
    });
}

module.exports = (app) => {
    app.get("/entity/get_entity_id", getEntityId);
}
