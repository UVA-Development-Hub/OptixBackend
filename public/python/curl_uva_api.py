#!/usr/bin/env python

import argparse, logging, requests, json

def curl_token(client, token_settings):
  # id and secret in AWS Cognito
  # client = (id, secret)
  nadimonly = ("12gc9sc7vp028anu8v7ja8ivrl", "14fcqh98b7bhirmehh15n638iobjll8odhpq79b5onkb905qodp3")
  linklab = ("rnc8grbjra23fs2resd04si3d", "1ssa5dkoc367brekngt1rn3obhfa11hask3sc8r7j3locio17il9")
  linklab_admin = ("6mmnsh2nh8n7tqar73j62r2rce", "1hspod2bhi5an0huq5fhjfv20155kgoo1p80vf46eg8iocgqhq7a")
  devhub = ("22aapvdkvmbtckq13loo39fevn", "12qj89frsc7a7tjk2a5ftqrap8iga75h88j0btrrbhhpt83560tl")
  devhub_admin = ("5vk1hjpdumudippb5icg0bs7qf", "1dm96ie5ti9kfuatf464v32pbslc9oilg0581g9rapipi0ehdfqh")

  r = {}
  if client == "nadimonly":
    r = requests.post(token_settings["url"], \
                      params=token_settings["params"], \
                      headers=token_settings["headers"], \
                      auth=nadimonly)
  if client == "linklab":
    r = requests.post(token_settings["url"], \
                      params=token_settings["params"], \
                      headers=token_settings["headers"], \
                      auth=linklab)
  if client == "linklab_admin":
    r = requests.post(token_settings["url"], \
                      params=token_settings["params"], \
                      headers=token_settings["headers"], \
                      auth=linklab_admin)
  if client == "devhub":
    r = requests.post(token_settings["url"], \
                      params=token_settings["params"], \
                      headers=token_settings["headers"], \
                      auth=devhub)
  if client == "devhub_admin":
    r = requests.post(token_settings["url"], \
                      params=token_settings["params"], \
                      headers=token_settings["headers"], \
                      auth=devhub_admin)
  return r.json()["access_token"]

def query(invoke_settings):
  r = requests.post(invoke_settings["url"],
                    headers=invoke_settings["headers"],
                    data=json.dumps(invoke_settings["data"]))
  return r.text

def main(args, loglevel):
  logging.basicConfig(format="%(levelname)s: %(message)s", level=loglevel)

  logging.debug(args)

  data = {
    "params": {
      "method": "GET"
    }
  }
  identity = None
  for item in vars(args):
    if item == "action":
      data[item] = getattr(args, item)
    elif item == "client":
      identity = getattr(args, item)
    else:
      if getattr(args, item):
        data["params"][item] = getattr(args, item)
  token_settings = {
    "url": "https://uva-api.auth.us-east-1.amazoncognito.com/oauth2/token",
    "params": {
      "grant_type": "client_credentials",
      "scope": "uva-api/" + identity,
    },
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded",
    }
  }
  access_token = curl_token(identity, token_settings)

  if "_" in identity:
    identity = identity.replace('_', '/')
  invoke_settings = {
    "url": "https://leflanhxg2.execute-api.us-east-1.amazonaws.com/dev/" + identity,
    "headers": {
      "Content-Type": "application/json",
      "uva-auth": access_token
    },
    "data": data
  }
  logging.debug(invoke_settings)
  response = query(invoke_settings)
  logging.info(response)

if __name__ == '__main__':
  parser = argparse.ArgumentParser(prog = "curl_uva_api.py",
                                   usage="%(prog)s -c CLIENT -s SCOPE -a ACTION -p Project",
                                   description = "curl the api on the AWS.")
  parser.add_argument("-c", "--client", type=str,
                      help = "AWS Cognito Clients: nadimonly, devhub, devhub_admin, linklab, linklab_admin",
                      metavar = "ARG")
  # parser.add_argument("-s", "--scope", type=str,
  #                     help = "AWS Cognito Scope: uva-api/nadimonly, uva-api/devhub, uva-api/devhub_admin, uva-api/linklab, uva-api/linklab_admin",
  #                     metavar = "ARG")
  # parser.add_argument("-i", "--identity", type=str,
  #                     help = "API Gateway Identity: nadimonly, devhub, devhub/admin, linklab, linklab/admin",
  #                     metavar = "ARG")

  #
  # api action
  #
  parser.add_argument("-a", "--action", type=str,
                      help = "API action: search, last, timeseries, tags, associate-tags, " +
                             "entity-types, entity, meta-control, metadata",
                      metavar = "ARG")
  #
  # search
  #
  parser.add_argument("-t", "--t", type=str,
                      help = "Query targets: metrics, tagk, tagv",
                      metavar = "ARG")
  parser.add_argument("-q", "--q", type=str,
                      help = "Prefix",
                      metavar = "ARG")
  parser.add_argument("-m", "--max", type=str,
                      help = "maximum number of values",
                      metavar = "ARG")
  #
  # timeseries
  #
  parser.add_argument("-p", "--project", type=str,
                      help = "Project name",
                      metavar = "ARG")
  parser.add_argument("-s", "--sensor_type", type=str,
                      help = "The sensor type",
                      metavar = "ARG")
  parser.add_argument("-st", "--start_time", type=str,
                      help = "Time Series Start Time: eg. 2018/01/01",
                      metavar = "ARG")
  parser.add_argument("-et", "--end_time", type=str,
                      help = "Time Series End Time: eg. 2018/01/01",
                      metavar = "ARG")
  parser.add_argument("--method", type=str,
                      help = "http method",
                      metavar = "ARG")
  #
  # tags
  #
  parser.add_argument("--metric", type=str,
                      help = "target metric",
                      metavar = "ARG")
  parser.add_argument("--tag", type=str,
                      help = "tag",
                      metavar = "ARG")
  #
  # entity-types
  #
  # PUT
  parser.add_argument("--type", type=str,
                      help = "The name of the entity type (required argument) [GET, PUT]",
                      metavar = "ARG")
  parser.add_argument("--meta_control", type=str,
                      help = "json of the meta control fields associated with this entity type (optional argument) [PUT]",
                      metavar = "ARG")
  parser.add_argument("--time_series_control", type=str,
                      help = "list of the time-series link keys (in json format) allowed on this entity type (optional argument) [PUT]",
                      metavar = "ARG")
  #
  # entity
  #
  # GET
  parser.add_argument("--entity_id", type=str,
                      help = "UUID of the entity [GET]",
                      metavar = "ARG")
  parser.add_argument("--entity_type_id", type=str,
                      help = "UUID of the entity type  [GET]",
                      metavar = "ARG")
  parser.add_argument("--include_metadata", action='store_true', default=False,
                      help = "true if you want to incluede all metadata for the entity [GET]")
  parser.add_argument("--include_time_series", action='store_true', default=False,
                      help = "true if you want to include timeseries data [GET]")
  # PUT
  parser.add_argument("--type_id", type=str,
                      help = "UUID of the type (required argument) [PUT]",
                      metavar = "ARG")
  parser.add_argument("--parent_id", type=str,
                      help = "UUID of the parent class (optional argument) [PUT]",
                      metavar = "ARG")
  parser.add_argument("--class", action='store_true', default=False,
                      help = "boolean of whether the entity is a class of entities or an object (optional argument) [PUT]")
  parser.add_argument("--metadata", type=dict,
                      help = "json of the meta control fields associated with this entity type (optional argument) [PUT]",
                      metavar = "ARG")
  parser.add_argument("--time_series_link", type=dict,
                      help = "json-formatted list of the time-series link key, value pairs associated with this entity (optional argument) [PUT]",
                      metavar = "ARG")

  #
  # metadata
  #
  # PUT
  parser.add_argument("--name", type=str,
                      help = "key in the key:value pair, must match allowed name for this entity type (required argument) [PUT]",
                      metavar = "ARG")
  parser.add_argument("--value", type=str,
                      help = "value in the key:value pair (required argument) [PUT]",
                      metavar = "ARG")

  parser.add_argument("-v", "--verbose",
                      help="increase output verbosity",
                      action="store_true")
  args = parser.parse_args()

  # Setup logging
  if args.verbose:
    loglevel = logging.DEBUG
  else:
    loglevel = logging.INFO

  main(args, loglevel)