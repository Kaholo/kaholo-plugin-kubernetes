const { bootstrap } = require("@kaholo/plugin-library");
const { CoreV1Api, KubernetesObjectApi } = require("@kubernetes/client-node");
const yaml = require("js-yaml");
const fs = require("fs");

const k8sFunctions = require("./k8s-functions");
const k8sClient = require("./k8s-client");
const kubectl = require("./kubectl");
const { mapResourceTypeToDeleteFunctionName, getDeleteApi } = require("./k8s-delete-utils");
const { validateNamespace } = require("./helpers");

async function apply(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    yamlPath,
    namespace,
  } = params;

  const specs = yaml.loadAll(
    fs.readFileSync(yamlPath),
  ).filter(
    (s) => s && s.kind && s.metadata,
  );

  const client = k8sClient.create(KubernetesObjectApi, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  const specProcessingPromises = specs
    .map((spec) => k8sFunctions.apply(client, {
      spec,
      namespace,
    }));
  const creationResults = await Promise.allSettled(specProcessingPromises);

  if (creationResults.some((result) => result.status === "rejected")) {
    // eslint-disable-next-line no-throw-literal
    throw {
      successes: creationResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value),
      failures: creationResults
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason),
    };
  }

  return creationResults.map((result) => result.value);
}

async function deleteObjects(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    objectsMap,
    namespace,
  } = params;

  const objectsMapDeletionPromises = objectsMap.map((mapping) => {
    const [type, name] = mapping.split(" ");

    const functionName = mapResourceTypeToDeleteFunctionName(type);

    const api = getDeleteApi(type, functionName);
    const client = k8sClient.create(api, {
      kubeCertificate,
      kubeApiServer,
      kubeToken,
    });

    validateNamespace(namespace, client[functionName], type);

    return {
      type,
      name,
      promise: k8sFunctions.deleteObject(client, {
        functionName,
        objectType: type,
        objectName: name,
        namespace,
      }),
    };
  });

  const results = await Promise.allSettled(objectsMapDeletionPromises.map((map) => map.promise));

  if (results.some((result) => result.status === "rejected")) {
    const successes = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    // eslint-disable-next-line no-throw-literal
    throw {
      successes,
      failures,
    };
  }

  return results.map((result) => result.value);
}

async function getService(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    name,
    namespace,
  } = params;

  const client = k8sClient.create(CoreV1Api, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  return k8sFunctions.getService(client, { name, namespace });
}

async function getAllServices(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    labelsFilter = [], // TODO remove when library starts to parse empty text into empty arrays
    namespace,
  } = params;

  const client = k8sClient.create(CoreV1Api, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  return k8sFunctions.getAllServices(client, { labelsFilter, namespace });
}

module.exports = bootstrap({
  apply,
  deleteObjects,
  getService,
  getAllServices,
  runKubectlCommand: kubectl.runCommand,
});
