const { bootstrap } = require("@kaholo/plugin-library");
const { CoreV1Api, KubernetesObjectApi } = require("@kubernetes/client-node");

const k8sLib = require("./k8s-library");
const { runKubectlCommand } = require("./kubectl");
const { createK8sClient } = require("./helpers");
const { mapResourceTypeToDeleteFunctionName, getDeleteApi } = require("./k8s-delete-utils");

async function apply(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    yamlPath,
    namespace,
  } = params;

  const k8sClient = createK8sClient(KubernetesObjectApi, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  return k8sLib.apply(k8sClient, { yamlPath, namespace });
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
    const k8sClient = createK8sClient(api, {
      kubeCertificate,
      kubeApiServer,
      kubeToken,
    });

    return k8sLib.deleteObject(k8sClient, {
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

async function getAllServices(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    labelsFilter,
    namespace,
  } = params;

  const k8sClient = createK8sClient(CoreV1Api, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  return k8sLib.getAllServices(k8sClient, { labelsFilter, namespace });
}

async function getService(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
    name,
    namespace,
  } = params;

  const k8sClient = createK8sClient(CoreV1Api, {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });

  return k8sLib.getService(k8sClient, { name, namespace });
}

module.exports = bootstrap({
  apply,
  deleteObjects,
  getService,
  getAllServices,
  runKubectlCommand,
});
