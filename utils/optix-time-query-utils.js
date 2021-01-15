const axios = require("axios");

const queryAgent = axios.create({
    baseURL: "https://uva.optix.earth/api/",
    timeout: 1000,
    auth: {
        username: "admin",
        password: "password",
    },
});

function query(endPoint, parameters, method) {
    const option = {};
    switch (method) {
        case "get":
            option.params = parameters;
            return queryAgent.get(endPoint, option);
        case "post":
            return queryAgent.post(endPoint, parameters);
        case "put":
            return queryAgent.put(endPoint, parameters);
        case "delete":
            option.data = parameters;
            return queryAgent.delete(endPoint, option);
    }
}

function wrapper(required, optional) {
    const params = {};
    for (const req in required) {
        if (required[req] === undefined) return null;
        params[req] = required[req];
    }
    for (const opt in optional) {
        if (optional[opt] !== null) params[opt] = optional[opt];
    }
    return params;
}

function search(t, options) {
    if (!options) options = {};
    const params = wrapper(
        { t: t },
        {
            q: options.hasOwnProperty("q") ? options.q : null,
            max: options.hasOwnProperty("max") ? options.max : null,
        }
    );
    if (!params) return null;
    return query("search", params, "get");
}

async function timeseries(metric, start_time, options) {
    if (!options) options = {};
    const params = wrapper(
        {
            metric: metric,
            start_time: start_time,
        },
        {
            end_time: options.hasOwnProperty("end_time") ? options.end_time : null,
            tags: options.hasOwnProperty("tags") ? options.tags : null,
        }
    );
    if (!params) return null;
    return await query("timeseries", params, "get");
}

function getEntity(options) {
    if (!options) options = {};
    const params = wrapper(
        {},
        {
            entity_id: options.hasOwnProperty("entity_id") ? options.entity_id : null,
            entity_type_id: options.hasOwnProperty("entity_type_id")
                ? options.entity_type_id
                : null,
            include_metadata: options.include_metadata || null,
            start_time: options.hasOwnProperty("start_time") ? options.start_time : null,
            end_time: options.hasOwnProperty("end_time") ? options.end_time : null,
            include_time_series: options.hasOwnProperty("include_time_series")
                ? options.include_time_series
                : null,
        }
    );
    if (!params) return null;
    return query("entity", params, "get");
}

function putEntity(type_id, options) {
    if (!options) options = {};
    const params = wrapper(
        { type_id: type_id },
        {
            parent_id: options.hasOwnProperty("parent_id") ? options.parent_id : null,
            class: options.hasOwnProperty("class") ? options.class : null,
            metadata: options.hasOwnProperty("metadata") ? options.metadata : null,
            time_series_link: options.hasOwnProperty("time_series_link")
                ? options.time_series_link
                : null,
        }
    );
    if (!params) return null;
    return query("entity", params, "put");
}

function getMetadata(entity_id, options) {
    if (!options) options = {};
    const params = wrapper(
        { entity_id: entity_id },
        {
            fields: options.hasOwnProperty("ent_type_id") ? options.fields : null,
        }
    );
    if (!params) return null;
    return query("metadata", params, "get");
}

function postMetadata(entity_id, name, options) {
    if (!options) options = {};
    const params = wrapper(
        { entity_id: entity_id, name: name },
        {
            value: options.hasOwnProperty("value") ? options.value : null,
            entity_type_id: options.hasOwnProperty("entity_type_id")
                ? options.entity_type_id
                : null,
        }
    );
    if (!params) return null;
    return query("metadata", params, "post");
}

function putMetadata(entity_id, type_id, name, value) {
    const params = wrapper(
        { entity_id: entity_id, type_id: type_id, name: name, value: value },
        {}
    );
    if (!params) return null;
    return query("metadata", params, "put");
}

function deleteMetadata(ent_id, name, options) {
    if (!options) options = {};
    const params = wrapper(
        { ent_id: ent_id, name: name },
        {
            value: options.hasOwnProperty("value") ? options.value : null,
            ent_type_id: options.hasOwnProperty("ent_type_id")
                ? options.ent_type_id
                : null,
        }
    );
    if (!params) return null;
    return query("metadata", params, "delete");
}

function putMetaControl(type_id, name, options) {
    if (!options) options = {};
    const params = wrapper(
        { type_id: type_id, name: name },
        {
            required: options.hasOwnProperty("required") ? options.required : null,
        }
    );
    if (!params) return null;
    return query("meta-control", params, "put");
}

module.exports = {
    query: query,
    search: search,
    timeseries: timeseries,
    getEntity: getEntity,
    putEntity: putEntity,
    getMetadata: getMetadata,
    postMetadata: postMetadata,
    putMetadata: putMetadata,
    deleteMetadata: deleteMetadata,
    putMetaControl: putMetaControl,
};
