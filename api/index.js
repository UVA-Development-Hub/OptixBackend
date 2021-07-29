const metadata = require("./routes/metadata");
const dataset = require("./routes/dataset");
const groups = require("./routes/groups");
const entity = require("./routes/entity");
const swagger = require("./routes/swagger");
const tags = require("./routes/tags");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    dataset(app);
    groups(app);
    entity(app);
    swagger(app);
    tags(app);
    return app;
};
