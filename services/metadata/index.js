const { v2: dbHelper } = require("../db");


// Fetch metdata
async function fetchMetadata(app_id) {
    try {
        const { error, metadata } = await dbHelper.metadataFetch(app_id);
        if(error) throw error;
        return {
            metadata: metadata
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}
// Delete metadata
async function deleteMetadata(app_id, key) {
    try {
        const { error, success } = await dbHelper.metadataDelete(app_id, key);
        if(error) throw error;
        return {
            success: success
        }
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}


// Modify metadata (add/update as necessary)
async function modifyMetadata(app_id, key, value) {
    try {
        const { error, exists } = await dbHelper.metadataExists(app_id, key);
        if(error) throw error;

        if(!exists) {
            var { error: err, success } = await dbHelper.metadataInsert(app_id, key, value);
        } else {
            var { error: err, success } = await dbHelper.metadataReplace(app_id, key, value);
        }

        if(err) throw err;
        return {
            success: success
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}


module.exports = {
    v2: {
        fetchMetadata: fetchMetadata,
        modifyMetadata: modifyMetadata,
        deleteMetadata: deleteMetadata
    }
};
