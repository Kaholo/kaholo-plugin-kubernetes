const yaml = require("js-yaml");
const fs = require("fs");

const {
  parseErr,
  applyBySpec,
  getConfig,
  getDeleteFunc,
  runDeleteFunc,
} = require("./helpers");

async function apply(client, { yamlPath, namespace }) {
  /**
   * @type {k8s-library.js.KubernetesObject[]}
   * Get all deployments/specs from yaml file and filter the valid ones
   */
  const specs = yaml.loadAll(fs.readFileSync(yamlPath)).filter((s) => s && s.kind && s.metadata);

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

async function getService(client, { name, namespace }) {
  try {
    const res = await client.readNamespacedService(name, namespace);

    return res.body;
  } catch (err) {
    throw parseErr(err);
  }
}

async function getAllServices(client, { labelsFilter, namespace }) {
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

async function deleteObjects(configParams, {
  objectsTypes,
  objectsNames,
  namespace,
}) {
  const kubeConfig = getConfig(configParams);

  const deleteFuncs = objectsTypes.map((resourceType) => {
    const deleteFunc = getDeleteFunc(kubeConfig, resourceType);

    const namespaced = deleteFunc.name.includes("Namespaced");
    if (namespaced && !namespace) {
      throw `Must specify namespace to delete object of type '${resourceType}`;
    }

    return { deleteFunc, resourceType, namespaced };
  });

  const [promises, deleted, failed] = [[], [], []]; // initiate with empty lists

  deleteFuncs.forEach(({ deleteFunc, resourceType, namespaced }) => {
    objectsNames.forEach((name) => {
      // to run all deletes at once
      promises.push(runDeleteFunc(deleteFunc, resourceType, name, namespaced ? namespace : null));
    });
  });

  const results = await Promise.all(promises); // remove all empty results
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

module.exports = {
  apply,
  getService,
  getAllServices,
  deleteObjects,
};
