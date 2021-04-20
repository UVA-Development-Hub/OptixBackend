const dotenv = require("dotenv");

const envFound = dotenv.config();
if (envFound.error) {
    // This error should crash whole process

    throw new Error("Couldn't find .env file");
}

module.exports = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    optix: {
        username: process.env.OPTIX_TIME_USERNAME,
        password: process.env.OPTIX_TIME_PASSWORD,
        url: process.env.OPTIX_TIME_URL,
    },
    cognito: {
        region: process.env.COGNITO_REGION,
        poolId: process.env.COGNITO_POOL_ID,
        baseUrl: process.env.COGNITO_BASEURL,
        timeout: process.env.COGNITO_TIMEOUT,
        auth: process.env.COGNITO_AUTH,
        clientId: process.env.COGNITO_CLIENT_ID,
        redirectUri: process.env.COGNITO_REDIRECT_URI,
    },
    psql: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
    },
    opentsdb: {
        url: process.env.OpenTSDB_URL,
    },
};
