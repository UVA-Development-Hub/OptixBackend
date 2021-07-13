const db = require("../../db");

function ReduceSensorData(sensor) {
    return {
        name: sensor.name,
        sensor_type: sensor.sensor_type,
        entity_id: sensor.entity_id,
        entity_type_id: sensor.entity_type_id
    }
}

async function getInternalIdFromEntityId(entity_id) {
    const { rows: [{id}, _] } = await db.query(`SELECT id FROM datasets WHERE entity_id='${entity_id}'`);
    return id;
}

async function getSensors() {
    try {
        const response = await db.query("SELECT entity_id, name, sensor_type FROM datasets;");
        return {
            success: true,
            sensorCount: response.rowCount,
            sensors: response.rows
        }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

async function addSensorToGroup(entity_id, group) {

    try {
        const dataset_id = await getInternalIdFromEntityId(entity_id);

        const exists_resp = await db.query(`SELECT id FROM group_dataset WHERE dataset_id='${dataset_id}' AND group_name='${group}'`);

        if(exists_resp.rowCount !== 0) {
            return {
                success: true,
                databaseChanged: false
            }
        }

        const response = await db.query(`INSERT INTO group_dataset VALUES ('${dataset_id}', '${group}')`);
        return {
            success: response.rowCount === 1,
            databaseChanged: response.rowCount !== 0
        }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

async function addSensorTypeToGroup(entity_type_id, group) {
    try {
        const response = await db.query(`INSERT INTO group_dataset_type VALUES ('${group}', '${entity_type_id}')`);
        return {
            success: response.rowCount === 1,
            databaseChanged: response.rowCount !== 0
        }
    } catch(err) {
        if(err.routine == "_bt_check_unique") return {
            success: true,
            databaseChanged: false
        }
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

async function removeSensorFromGroup(entity_id, group) {
    try {
        const dataset_id = await getInternalIdFromEntityId(entity_id);
        const response = await db.query(`DELETE FROM group_dataset WHERE dataset_id='${dataset_id}' AND group_name='${group}'`);
        return {
            success: true,
            databaseChanged: response.rowCount === 1
        }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

async function removeSensorTypeFromGroup(entity_type_id, group) {
    try {
        const response = await db.query(`DELETE FROM group_dataset_type WHERE entity_type='${entity_type_id}' AND group_name='${group}'`);
        return {
            success: true,
            databaseChanged: response.rowCount !== 0
        }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

async function sensorAccessByGroup(group) {
    try {
        // List of sensors accessible directly
        const { rows: direct_access } = await db.query(`SELECT datasets.* FROM datasets INNER JOIN group_dataset ON datasets.id=group_dataset.dataset_id WHERE group_name='${group}' ORDER BY datasets.id ASC`);

        // List of sensors accessible through type access
        const { rows: type_access } = await db.query(`SELECT datasets.* from datasets INNER JOIN group_dataset_type ON datasets.entity_type_id=group_dataset_type.entity_type WHERE group_Name='${group}' ORDER BY datasets.id ASC`);

        const accessible = Array.from(
            new Set(direct_access.concat(type_access))
        ).map(ReduceSensorData);

        return {
            success: true,
            accessible
        }
    } catch(err) {
        console.log(err)
        return {
            success: false,
            error: err
        }
    }
}

async function sensorAccessibleBy(entity_id) {
    try {
        // Get the internal id of the sensor entity
        try {
            var sensor_id = await getInternalIdFromEntityId(entity_id);
        } catch(err) {
            return {
                success: false,
                error: "failed to retrieve internal id for specified uuid"
            }
        }
        const { rows: accessing_groups_direct } = await db.query(`SELECT group_name FROM group_dataset WHERE dataset_id='${sensor_id}'`);

        const entity_type_reponse = await db.query(`SELECT entity_type_id FROM datasets WHERE entity_id='${entity_id}'`);
        const { entity_type_id } = entity_type_reponse.rows[0];

        const { rows: accessing_groups_type } = await db.query(`SELECT group_name FROM group_dataset_type WHERE entity_type='${entity_type_id}'`);

        const accessibleBy = Array.from(
            new Set(accessing_groups_direct.concat(accessing_groups_type))
        ).map(obj => obj.group_name);

        return {
            success: true,
            groups: accessibleBy
        }
    } catch(err) {
        console.log(err);
        if(err.routine === "string_to_uuid") err = "invalid uuid";

        return {
            success: false,
            error: err
        }
    }
}

async function checkUserAccess(user_groups, entity_id) {
    const accessing_groups = await sensorAccessibleBy(entity_id);

    let access = false;
    for(let i = 0; i < accessing_groups.length; i++) {
        if(user_groups.indexOf(accessing_groups[i]) > -1) {
            access = true;
            break;
        }
    }

    return access;
}

async function getDatasetInfo(dataset) {
    const { rows } = await db.query(`SELECT * FROM datasets WHERE name='${dataset}'`);
    return rows;
}

// ------------------------------

async function getDatasets() {
    const { rows } = await db.query(
        `SELECT *
        FROM datasets`
    );
    return rows;
}

// ------------------------------
// ------------------------------
// ------------------------------
// ------------------------------
// ------------------------------

async function addDataset(entity_id, entity_type_id, name, sensor_type) {
    const id = await getDatasetIdByEntity(entity_type_id, entity_id);
    if (id) {
        return null;
    }
    await db.query(
        "INSERT INTO datasets(entity_id, entity_type_id, name, sensor_type) VALUES($1, $2, $3, $4)",
        [entity_id, entity_type_id, name, sensor_type]
    );
    return await getDatasetIdByEntity(entity_type_id, entity_id);
}

async function getDatasetIdByName(name) {
    const { rows } = await db.query("SELECT id FROM datasets WHERE name = $1", [name]);
    // dataset not found
    if (rows.length === 0) {
        return null;
    }
    return rows[0].id;
}

async function getDatasetIdByEntity(entity_type_id, entity_id) {
    const {
        rows,
    } = await db.query(
        "SELECT id FROM datasets WHERE entity_type_id = $1 AND entity_id = $2",
        [entity_type_id, entity_id]
    );
    // dataset not found
    if (rows.length === 0) {
        return null;
    }
    return rows[0].id;
}


async function getDatasetEntityByName(name) {
    const { rows } = await db.query("SELECT * FROM datasets WHERE name = $1", [name]);
    if (rows.length === 0) {
        return false;
    }
    return rows[0];
}

module.exports = {
    getSensors,
    addSensorToGroup,
    addSensorTypeToGroup,
    removeSensorFromGroup,
    removeSensorTypeFromGroup,
    sensorAccessByGroup,
    sensorAccessibleBy,
    // ------------------------------
    getDatasets: getDatasets,
    // ------------------------------
    addDataset: addDataset,
    getDatasetIdByEntity: getDatasetIdByEntity,
    getDatasetIdByName: getDatasetIdByName,
    getDatasetEntityByName: getDatasetEntityByName,
    getDatasetInfo: getDatasetInfo,
};
