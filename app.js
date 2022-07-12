/* eslint-disable no-await-in-loop */
const yaml = require("js-yaml");
const fs = require("fs");
const { KubernetesObjectApi, CoreV1Api, KubeConfig } = require("@kubernetes/client-node");
const { newClusters, newContexts, newUsers } = require("@kubernetes/client-node/dist/config_types");
const {
  getConfig, parseArr, getDeleteFunc, runDeleteFunc, parseErr,
} = require("./helpers");
const cliApp = require("./app.cli");

async function applyBySpec(client, spec) {
  try {
    await client.read(spec);
  } catch (err) {
    return client.create(spec);
  }
  return client.patch(spec);
}

async function apply(action, settings) {
  const yamlPath = (action.params.yamlPath || "").trim();
  const namespace = (action.params.namespace || "").trim();
  if (!yamlPath) {
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
  for (const spec of specs) {
    if (namespace && !spec.metadata.namespace && spec.kind !== "Namespace") {
      spec.metadata.namespace = namespace;
    }
    spec.metadata.annotations = spec.metadata.annotations || {};
    delete spec.metadata.annotations["kubectl.kubernetes.io/last-applied-configuration"];
    spec.metadata.annotations["kubectl.kubernetes.io/last-applied-configuration"] = JSON.stringify(spec);
    try {
      const response = await applyBySpec(client, spec);
      created.push(response.body);
    } catch (err) {
      created.push(parseErr(err));
      throw created;
    }
  }
  return created;
}

async function deleteObject(action, settings) {
  const types = parseArr(action.params.types);
  const names = parseArr(action.params.names);
  const namespace = (action.params.namespace || "").trim();
  if (types.length < 1 || names.length < 1) {
    throw "One of the required parameters was not passed!";
  }
  const kc = getConfig(action.params, settings);

  const [promises, deleted, failed] = [[], [], []]; // initiate with empty lists
  const deleteFuncs = types.map((resourceType) => {
    const deleteFunc = getDeleteFunc(kc, resourceType);
    const namespaced = deleteFunc.name.includes("Namespaced");
    if (namespaced && !namespace) {
      throw `Must specify namespace to delete object of type '${resourceType}`;
    }
    return { deleteFunc, resourceType, namespaced };
  });
  deleteFuncs.forEach(({ deleteFunc, resourceType, namespaced }) => {
    names.forEach((name) => {
      // to run all deletes at once
      promises.push(runDeleteFunc(deleteFunc, resourceType, name, namespaced ? namespace : null));
    });
  });
  const results = (await Promise.all(promises)); // remove all empty results
  results.forEach((deleteObj) => {
    if (deleteObj.err) {
      failed.push(deleteObj);
    } else {
      deleted.push(deleteObj);
    }
  });
  const returnVal = { deleted, failed };
  if (failed.length > 0 || deleted.length === 0) {
    throw returnVal;
  }
  return returnVal;
}

async function getAllServices(action, settings) {
  const { namespace, labelsFilter } = action.params;
  const kc = getConfig(action.params, settings);
  const client = kc.makeApiClient(CoreV1Api);
  let filtersArray = [];
  if (labelsFilter) {
    filtersArray = Array.isArray(labelsFilter) ? labelsFilter : labelsFilter.split("\n");
  }

  const filters = filtersArray.map((f) => {
    const [key, value] = f.split("=");
    return { key, value };
  });
  try {
    if (namespace === "*") {
      const namespaces = await client.listNamespace();
      const listServicesPromises = namespaces.body.items.map(
        (namespaceObj) => client.listNamespacedService(namespaceObj.metadata.name),
      );
      const [...serviceResults] = await Promise.all(listServicesPromises);
      const allServices = [];
      serviceResults.forEach((serviceResult) => {
        const filteredServices = serviceResult.body.items.filter((service) => {
          for (let i = 0, length = filters.length; i < length; i += 1) {
            const isFilterValid = service.metadata.labels && service.metadata.labels[filters[i].key]
              && service.metadata.labels[filters[i].key] === filters[i].value;

            if (!isFilterValid) {
              return false;
            }
          }
          return true;
        });

        allServices.push(...filteredServices);
      });
      return allServices;
    }
    const res = await client.listNamespacedService(namespace || "default");
    return res.body.items;
  } catch (err) {
    throw parseErr(err);
  }
}

async function getService(action, settings) {
  const { name, namespace } = action.params;
  if (!name) {
    throw "Didn't provide service name";
  }
  const kc = getConfig(action.params, settings);
  const client = kc.makeApiClient(CoreV1Api);
  try {
    const res = await client.readNamespacedService(name, namespace || "default");
    return res.body;
  } catch (err) {
    throw parseErr(err);
  }
}

async function test(action, settings) {
  const {
    kubeApiServer,
    kubeToken,
    kubeCertificate,
    namespace
  } = action.params;

  const cluster = {
    cluster: {
      "certificate-authority-data": kubeCertificate,
      skipTLSVerify: false,
      server: kubeApiServer,
    },
    name: "hasherman-cluster",
  };

  const user = {
    name: "hasherman",
    user: {
      token: kubeToken,
    },
  };

  const context = {
    context: {
      cluster: cluster.name,
      user: user.name,
    },
    name: "hasherman-context",
  };

  const kc = new KubeConfig();

  kc.loadFromOptions({
    clusters: newClusters([cluster]),
    users: newUsers([user]),
    contexts: newContexts([context]),
    currentContext: context.name,
  });

  const k8sApi = kc.makeApiClient(CoreV1Api);

  const res = await k8sApi.listNamespacedConfigMap(namespace || "hashstrings");

  return res.body;
}

module.exports = {
  apply,
  deleteObject,
  getService,
  getAllServices,
  test,
  // CLI methods
  ...cliApp,
};
