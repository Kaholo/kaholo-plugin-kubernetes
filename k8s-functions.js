const yaml = require("js-yaml");
const fs = require("fs");

const {
  applyBySpec,
  extractResponseData,
  parseError,
} = require("./helpers");

async function apply(client, { yamlPath, namespace }) {
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

async function getAllServices(client, { labelsFilter, namespace: userDefinedNamespace }) {
  const filters = labelsFilter.map((filter) => {
    const [key, value] = filter.split("=");
    return { key, value };
  });

  try {
    if (userDefinedNamespace !== "*") {
      const response = await client.listNamespacedService(userDefinedNamespace);

      return extractResponseData(response);
    }

    const namespacesResponse = await client.listNamespace();
    const namespaces = extractResponseData(namespacesResponse);

    const namespacesWithServicesPromises = namespaces.map(
      (namespace) => client.listNamespacedService(namespace.metadata.name),
    );

    const namespacesWithServicesResults = await Promise.all(namespacesWithServicesPromises);
    const namespacesWithServices = namespacesWithServicesResults.map(
      (result) => extractResponseData(result),
    );

    const allFilteredServices = namespacesWithServices.map(
      (namespaceServices) => namespaceServices.filter(
        (service) => filters.every(
          (filter) => service.metadata.labels
            && service.metadata.labels[filter.key]
            && service.metadata.labels[filter.key] === filter.value,
        ),
      ),
    ).flat();

    return allFilteredServices;
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
