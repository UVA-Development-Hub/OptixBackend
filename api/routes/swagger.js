const swagger = require("express-swagger-generator");
const path = require("path");

module.exports = (app) => {
    const options = {
        swaggerDefinition: {
            info: {
                description: "DevHub Optix Backend Server",
                title: "Swagger",
                version: "1.0.0",
            },
            produces: [
                "application/json",
            ],
            schemes: ["http"],
        },
        basedir: path.normalize(__dirname + "/../.."),  // app absolute path
        files: ["./api/routes/*.js"]                    // Path to the API handle folder
    };
    const expressSwagger = swagger(app);
    expressSwagger(options);
};
