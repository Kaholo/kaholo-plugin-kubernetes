const { bootstrap } = require("@kaholo/plugin-library");
const { CoreV1Api, KubernetesObjectApi } = require("@kubernetes/client-node");

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

  const client = k8sClient.create(KubernetesObjectApi, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  return k8sFunctions.apply(client, { yamlPath, namespace });
}

async function deleteObjects(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    objectsMap,
    namespace,
  } = params;

  const deletionPromises = objectsMap.map((mapping) => {
    const [type, name] = mapping.split(" ");

    const functionName = mapResourceTypeToDeleteFunctionName(type);

    const api = getDeleteApi(type, name);
    const client = k8sClient.create(api, {
      kubeCertificate,
      kubeApiServer,
      kubeToken,
    });

    validateNamespace(namespace, client[functionName], type);

    return k8sFunctions.deleteObject(client, {
      functionName,
      namespace,
    });
  });

  const [deleted, failed] = [[], []];
  const results = await Promise.all(deletionPromises);
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
    labelsFilter,
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
