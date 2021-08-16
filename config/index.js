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
    },
    aws: {
        access_key_id: process.env.AWS_ACCESS_KEY_ID,
        secret_key: process.env.AWS_SECRET_ACCESS_KEY,
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
