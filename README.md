# Smart Infrastructure (SIF) Backend

### Features

- Authenticate user JWTs
- Discover apps you have access to
- List the apps you own
- Grant/revoke permission for others to view your apps
- Retrieve data from apps you can access
- See the Swagger API reference for a full list of features.


## How to run
1. Clone the repository:
```sh
git clone git@github.com:UVAMobileDev/OptixBackend.git backend
```

2. Install the required packages:
```sh
npm i
```

3. Create a .env file like this:
```sh
PORT= # port to run the web server on. if specifying certificates, use 443
CERTIFICATE=/path/to/fullchain.pem
KEY_FILE=/path/to/privkey.pem
NODE_ENV= # "PRODUCTION" will force SSL and activate jwt authenticators, "DEVELOPMENT" will not
OPTIX_TIME_USERNAME= # username to authenticate optix api requests
OPTIX_TIME_PASSWORD= # password to authenticate optix api requests
OPTIX_TIME_URL= # optix api base url
COGNITO_REGION= # aws region where the cognito pool exists, i.e. us-west-1
COGNITO_POOL_ID= # unique pool id, usually ~10 characters
AWS_ACCESS_KEY_ID= # access key id for an IAM user with CognitoAdmin permissions
AWS_SECRET_ACCESS_KEY= # secret key for the IAM user mentioned above
DB_USER= # username to login to the psql server
DB_PASSWORD= # password to login to the psql server
DB_HOST= # host/ip of the psql server
DB_PORT= # port where the psql server is running
DB_DATABASE= # name of the psql db to attach to once connected
OpenTSDB_URL= # hostname/ip of the machine running the opentsdb agent
```

4. Run the server
```sh
npm start
```

## Read the docs!

Documention is accessible on the server once you have it running. If the server runs on some `{base_url}`, like `localhost:8080/`, then Swagger will automatically generate documentation at `{base_url}/api-docs`.
