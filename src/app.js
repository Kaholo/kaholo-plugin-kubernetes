const k8s = require('@kubernetes/client-node');
const yaml = require('js-yaml');
const fs = require('fs');
// Constructors
const { newClusters, newContexts, newUsers } = require('@kubernetes/client-node/dist/config_types');

function getClient(params, settings, objectApi){
  const caCert = params.caCert || settings.caCert;
  const endpointUrl = params.endpointUrl || settings.endpointUrl;
  const token = params.token || settings.token;
  const saName = params.saName || settings.saName || "kaholo-sa";

  if (!caCert || !endpointUrl || !token){
    throw "not provided one of required fields";
  }
  // define options
  const user = {
    name: saName,
    user: { token: token }
  };
  const cluster = {
    cluster: {
      "certificate-authority-data": caCert,
      server: endpointUrl 
    },
    name: `${saName}-cluster`
  };
  const context = {
    context: {
      cluster: `${saName}-cluster`,
      user: saName
    },
    name: `${saName}-context`
  }; 
  // load kubeconfig from options
  const kc = new k8s.KubeConfig();
  kc.loadFromOptions({
    clusters: newClusters([cluster]),
    contexts: newContexts([context]),
    users: newUsers([user]),
    currentContext: context.name,
  });
  // return object api or core api client
  if (objectApi){
    return k8s.KubernetesObjectApi.makeApiClient(kc);
  }
  return kc.makeApiClient(k8s.CoreV1Api);
}

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
  const client = getClient(action.params, settings, true);
  const created = [];
  for (const spec of specs){
    spec.metadata.annotations = spec.metadata.annotations || {};
    delete spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
    spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(spec);
    try {
      // try to get the resource, if it does not exist an error will be thrown and we will end up in the catch
      // block.
      await client.read(spec);
      // we got the resource, so it exists, so patch it
      const response = await client.patch(spec);
      created.push(response.body);
    } 
    catch (err) {
      // we did not get the resource, so it does not exist, so create it
      const response = await client.create(spec);
      created.push(response.body);
    }
  }
  return created;
}

async function deleteNamespace(action, settings){  
  const namespaceStr = (action.params.namespace || "").trim();
  if (!namespaceStr){
    throw "namespace was not provided";
  }

  const client = getClient(action.params, settings, false);
  try {
    return (await client.deleteNamespace(namespaceStr, {})).body;
  }
  catch (err){
    throw "can't delete namespace";
  } 
}

module.exports = {
  apply,
  deleteNamespace
};

