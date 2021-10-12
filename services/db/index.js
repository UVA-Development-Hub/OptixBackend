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

async function listUsersWhoCanAccessApp(app_id) {
    try {
        const query = `SELECT username from app_access WHERE app_id=${app_id}`;
        const result = await db.query(query);
        return {
            usernames: result.rows.map(row => row.username)
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function addUserToApp(app_id, username) {
    try {
        const existsQuery = `SELECT id FROM app_access WHERE app_id=${app_id} AND username='${username}'`;
        const existsResult = await db.query(existsQuery);
        if(existsQuery?.rows?.length) {
            return {
                modified: false
            }
        }
        const query = `INSERT INTO app_access(username, app_id) VALUES('${username}', ${app_id})`;
        const result = await db.query(query);
        return {
            modified: true
        };
    } catch(err) {
        console.error(err);
        return {
            error: err
        };
    }
}

async function removeUserFromApp(app_id, username) {
    try {
        const existsQuery = `SELECT id FROM app_access WHERE app_id=${app_id} AND username='${username}'`;
        const existsResult = await db.query(existsQuery);
        if(existsQuery?.rows?.length === 0) {
            return {
                modified: false
            }
        }
        const query = `INSERT INTO app_access(username, app_id) VALUES('${username}', ${app_id})`;
        const result = await db.query(query);
        return {
            modified: true
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
        metadataExists,
        metadataInsert,
        metadataReplace,
        metadataDelete,
        metadataFetch,
        listAccessibleApps,
        listOwnedApps,
        getAppMetrics,
        userAccessCheck,
        searchApps,
        listUsersWhoCanAccessApp,
        addUserToApp,
        removeUserFromApp
    }
};
