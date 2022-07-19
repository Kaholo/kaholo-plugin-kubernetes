const {
  applySpec,
  extractResponseData,
  parseError,
} = require("./helpers");

async function apply(client, { spec, namespace }) {
  const adjustedSpec = {
    ...spec,
    metadata: {
      ...spec.metadata,
      annotations: spec.metadata.annotations || {},
    },
  };

  if (namespace && !spec.metadata.namespace && spec.kind !== "Namespace") {
    adjustedSpec.metadata.namespace = namespace;
  }

  adjustedSpec.metadata.annotations["kubectl.kubernetes.io/last-applied-configuration"] = JSON.stringify(adjustedSpec);

  try {
    const response = await applySpec(client, adjustedSpec);
    return response.body;
  } catch (err) {
    return parseError(err);
  }
}

async function deleteObject(client, {
  functionName,
  objectType,
  objectName,
  namespace,
}) {
  const deletionInfo = {
    objectType,
    objectName,
    namespace: namespace || "default",
  };

  try {
    const result = namespace
      ? await client[functionName](objectName, namespace)
      : await client[functionName](objectName);

    deletionInfo.result = JSON.stringify(result.body);
  } catch (error) {
    deletionInfo.error = JSON.stringify(parseError(error));
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
