const { cognito: config } = require("../../config");
const libCognito = require("@aws-sdk/client-cognito-identity-provider");
const cognitoClient = new libCognito.CognitoIdentityProviderClient({region: config.region});

const userPoolId = config.region + "_" + config.poolId;

function ReduceGroupData(group) {
    return {
        CreationDate: group.CreationDate,
        Description: group.Description,
        GroupName: group.GroupName,
        LastModifiedDate: group.LastModifiedDate,
        RoleArn: group.RoleArn
    }
}

async function getGroups() {
    try {
        // Create cognito command to list groups
        const command = new libCognito.ListGroupsCommand({
            UserPoolId: userPoolId
        });

        // Send the command to the cognito client, and return a
        // empty list if reponse is not nominal
        const response = await cognitoClient.send(command);
        if(response["$metadata"].httpStatusCode !== 200) {
            console.log("group list request failed", response["$metadata"]);
            return {
                success: false,
                groups: []
            }
        }

        // Not all group fields are necessary. This only passes on
        // the ones which have strong potential to be useful.
        console.log(response.Groups);
        return {
            success: true,
            groups: response.Groups.map(ReduceGroupData)
        };
    } catch(err) {
        console.log(err);
        return {
            success: false,
            groups: [],
            error: err
        }
    }
}

async function addUserToGroup(user, group) {
    try {
        const command = new libCognito.AdminAddUserToGroupCommand({
            GroupName: group,
            Username: user,
            UserPoolId: userPoolId
        });

        const response = await cognitoClient.send(command);
        if(response["$metadata"].httpStatusCode !== 200) {
            console.log("add user to group failed", response);
            return {
                success: false,
                error: "failed with code " + response["$metadata"].httpStatusCode
            }
        }
        return { success: true }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
    return false;
}

async function removeUserFromGroup(user, group) {
    try {
        const command = new libCognito.AdminRemoveUserFromGroupCommand({
            GroupName: group,
            Username: user,
            UserPoolId: userPoolId
        });

        const response = await cognitoClient.send(command);
        if(response["$metadata"].httpStatusCode !== 200) {
            console.log("remove user from group failed", response);
            return {success: false, error: "failed with code " + response["$metadata"].httpStatusCode}
        }
        return { success: true }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

async function getGroupMembership(user) {
    try {
        const command = new libCognito.AdminListGroupsForUserCommand({
            Username: user,
            UserPoolId: userPoolId
        });

        const response = await cognitoClient.send(command);
        if(response["$metadata"].httpStatusCode !== 200) {
            console.log("list group membership failed", response);
            return {success: false, error: "failed with code " + response["$metadata"].httpStatusCode}
        }

        return {
            success: true,
            groups: response.Groups.map(ReduceGroupData)
        }
    } catch(err) {
        console.log(err);
        return {
            success: false,
            error: err
        }
    }
}

module.exports = {
    getGroups,
    addUserToGroup,
    removeUserFromGroup,
    getGroupMembership,
}
