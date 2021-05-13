
const yaml = require('js-yaml');
const fs = require('fs');
const {getConfig, parseArr, getDeleteFunc, runDeleteFunc, parseErr} = require("./helpers");
const {KubernetesObjectApi, CoreV1Api} = require('@kubernetes/client-node');

async function apply(action, settings){
  const yamlPath = (action.params.yamlPath || "").trim();
  if (!yamlPath){
    throw "Not given yaml file path";
  }
  /**
  * @type {k8s.KubernetesObject[]}
  * Get all deployments/specs from yaml file and filter the valid ones
  */
  const specs = yaml.loadAll(fs.readFileSync(yamlPath)).filter((s) => s && s.kind && s.metadata);
  const kc = getConfig(action.params, settings);
  const client = kc.makeApiClient(KubernetesObjectApi);
  const created = [];
  for (const spec of specs){
    spec.metadata.annotations = spec.metadata.annotations || {};
    delete spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
    spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(spec);
    try {
      // try to get the resource, if it does not exist an error will be thrown and we will end up in the catch
      // block.
      await client.read(spec);
    } 
    catch (err) {
      // we did not get the resource, so it does not exist, so create it
      try {
        const response = await client.create(spec);
        created.push(response.body);
      }
      catch (err2) {
        created.push(err2);
        throw created;
      }
    }
    // we got the resource, so it exists, so patch it
    try {
      const response = await client.patch(spec);
      created.push(response.body);
    }
    catch (err){
      created.push(err);
      throw created;
    }
  }
  return created;
}

async function deleteObject(action, settings){  
  const types = parseArr(action.params.types);
  const names = parseArr(action.params.names);
  const namespace = (action.params.namespace || "").trim();
  if (types.length < 1 || names.length < 1){
    throw "One of the required parameters was not passed!";
  }
  const kc = getConfig(action.params, settings);

  const [promises, deleted, failed]  = [[],[],[]]; // initiate with empty lists
  const deleteFuncs = types.map(resourceType => {
    const deleteFunc = getDeleteFunc(kc, resourceType);
    const namespaced = deleteFunc.name.includes("Namespaced")
    if (namespaced && !namespace){
      throw `Must specify namespace to delete object of type '${resourceType}`;
    }
    return {deleteFunc, resourceType, namespaced};
  });
  deleteFuncs.forEach(({deleteFunc, resourceType, namespaced}) => {
    names.forEach(name => {
      // to run all deletes at once
      promises.push(runDeleteFunc(deleteFunc, resourceType, name, namespaced ? namespace : null));
    });
  });
  const results = (await Promise.all(promises)); // remove all empty results
  results.forEach(deleteObj => {
    if (deleteObj.err){
      failed.push(deleteObj);
    }
    else {
      deleted.push(deleteObj);
    }
  });
  const returnVal = {deleted, failed};
  if (failed.length > 0 || deleted.length === 0){
    throw returnVal;
  }
  return returnVal;
}

async function getService(action, settings){
  const {name, namespace} = action.params;
  if (!name){
    throw "Didn't provide service name";
  }
  const kc = getConfig(action.params, settings);
  const client = kc.makeApiClient(CoreV1Api);
  try {
    const res = await client.readNamespacedService(name, namespace || "default");
    return res.body;
  }
  catch (err){
    throw parseErr(err);
  }
}

module.exports = {
  apply,
  deleteObject,
  getService
};

