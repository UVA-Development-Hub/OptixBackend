const db = require("../../db");

async function metadataExists(app_id, key) {
    const query = `SELECT id FROM metadata WHERE app_id=${app_id} AND key='${key}'`;
    try {
        const result = await db.query(query);
        return {
            exists: result.rows.length > 0
        }
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function metadataInsert(app_id, key, value) {
    const query = `INSERT INTO metadata(app_id, key, value) VALUES(${app_id}, '${key}', '${value}')`;
    try {
        const result = await db.query(query);
        console.debug(result);
        return {
            success: true
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function metadataReplace(app_id, key, value) {
    const query = `UPDATE metadata SET value='${value}' WHERE app_id=${app_id} AND key='${key}'`;
    try {
        const result = await db.query(query);
        console.debug(result);
        return {
            success: true
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function metadataDelete(app_id, key) {
    const query = `DELETE FROM metadata WHERE app_id=${app_id} AND key='${key}'`;
    try {
        const result = await db.query(query);
        console.debug(result);
        return {
            success: true
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function metadataFetch(app_id) {
    const query = `SELECT key, value FROM metadata WHERE app_id=${app_id}`;
    try {
        const result = await db.query(query);
        return {
            metadata: result.rows
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

function generateAccessibilityQuery(username, groups) {
    const query = `
        select
            id,
            username,
            app_name
        from apps
        where username='${username}'
        union
        select
            id,
            username,
            app_name
        from apps
        where id in (
            select
                app_id
            from group_access
            where group_name in (${groups.map(group => `'${group}'`).toString()})
            union
            select
                app_id
            from app_access
            where username='${username}'
        )
        order by id asc
    `;
    return query;
}

async function listAccessibleApps(username, groups) {
    try {
        const query = generateAccessibilityQuery(username, groups);
        const result = await db.query(query);
        return {
            apps: result.rows
        }
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }

}

async function listOwnedApps(username) {
    // select id, username, app_name from apps where username=${username}
    try {
        const query = `SELECT id, username, app_name from apps where username='${username}'`;
        const result = await db.query(query);
        return {
            apps: result.rows
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function searchApps(username, groups, searchQuery) {
    try {
        const query = `
            select *
            from (
                ${generateAccessibilityQuery(username, groups)}
            ) as subquery
            where lower(subquery.app_name) like lower('%${searchQuery}%')
        `;
        const result = await db.query(query);
        return {
            apps: result.rows
        }
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function getAppMetrics(app_id) {
    // select metric from metrics where app_id=${app_id}
    try {
        const query = `SELECT metric FROM metrics WHERE app_id=${app_id}`;
        const result = await db.query(query);
        return {
            metrics: result.rows.map(row => row.metric)
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function userAccessCheck(username, groups, app_id) {
    try {
        const query = `
            select *
            from (
                ${generateAccessibilityQuery(username, groups)}
            ) as subquery
            where subquery.id=${app_id}`;
        const result = await db.query(query);
        return {
            accessible: result.rows?.length === 1
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

// ------------------------------
// ------------------------------
// ------------------------------
// ------------------------------
// ------------------------------
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

        const response = await db.query(`INSERT INTO group_dataset(dataset_id, group_name) VALUES ('${dataset_id}', '${group}')`);
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
        const response = await db.query(`INSERT INTO group_dataset_type(group_name, entity_type) VALUES ('${group}', '${entity_type_id}')`);
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

        // This group overrides all other permission
        // roles and grants access to everything
        if(group === "admin_allow_all") {
            console.log("admin request");
            var { rows: direct_access } = await db.query(`select name from datasets;`);
            var type_access = [];
        } else {
            // List of sensors accessible directly
            var { rows: direct_access } = await db.query(`SELECT datasets.* FROM datasets INNER JOIN group_dataset ON datasets.id=group_dataset.dataset_id WHERE group_name='${group}' ORDER BY datasets.id ASC`);

            // List of sensors accessible through type access
            var { rows: type_access } = await db.query(`SELECT datasets.* from datasets INNER JOIN group_dataset_type ON datasets.entity_type_id=group_dataset_type.entity_type WHERE group_Name='${group}' ORDER BY datasets.id ASC`);
        }

        const accessible = Array.from(
            new Set(direct_access.concat(type_access))
        ).map(ReduceSensorData);

        return {
            success: true,
            accessible
        }
    } catch(err) {
        console.error(err)
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
    const { success, groups: accessing_groups } = await sensorAccessibleBy(entity_id);
    if(!success) return false;
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
    v2: {
        metadataExists,
        metadataInsert,
        metadataReplace,
        metadataDelete,
        metadataFetch,
        listAccessibleApps,
        listOwnedApps,
        getAppMetrics,
        userAccessCheck,
        searchApps
    },
    getSensors,
    addSensorToGroup,
    addSensorTypeToGroup,
    removeSensorFromGroup,
    removeSensorTypeFromGroup,
    sensorAccessByGroup,
    sensorAccessibleBy,
    checkUserAccess,
    // ------------------------------
    getDatasets: getDatasets,
    // ------------------------------
    addDataset: addDataset,
    getDatasetIdByEntity: getDatasetIdByEntity,
    getDatasetIdByName: getDatasetIdByName,
    getDatasetEntityByName: getDatasetEntityByName,
    getDatasetInfo: getDatasetInfo,
};
