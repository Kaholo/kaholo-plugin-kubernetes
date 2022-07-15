const yaml = require("js-yaml");
const fs = require("fs");

const {
  parseError,
  applyBySpec,
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
      created.push(parseError(err));
      throw created;
    }
  }
  return created;
}

async function deleteObject(client, {
  functionName,
  objectType,
  objectName,
  namespace,
}) {
  let result;
  try {
    result = namespace
      ? await client[functionName](objectName, namespace)
      : await client[functionName](objectName);
  } catch (error) {
    const deletionInfo = {
      objectType,
      objectName,
      err: JSON.stringify(parseError(error)),
    };

    if (namespace) {
      deletionInfo.namespace = namespace;
    }

    return deletionInfo;
  }

  const deletionInfo = {
    objectType,
    objectName,
    result: JSON.stringify(result.body),
  };

  if (namespace) {
    deletionInfo.namespace = namespace;
  }

  return deletionInfo;
}

async function getService(client, { name, namespace }) {
  try {
    const res = await client.readNamespacedService(name, namespace);

    return res.body;
  } catch (err) {
    throw parseError(err);
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
    throw parseError(err);
  }
}

module.exports = {
  apply,
  getService,
  getAllServices,
  deleteObject,
};
