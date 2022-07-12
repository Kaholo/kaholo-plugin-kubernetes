const { bootstrap } = require("@kaholo/plugin-library");
const { CoreV1Api, KubernetesObjectApi } = require("@kubernetes/client-node");

const k8sLib = require("./k8s-library");
const { runKubectlCommand } = require("./kubectl");

const {
  getConfig, getDeleteFunc, runDeleteFunc, createK8sClient,
} = require("./helpers");

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

async function deleteObject(params) {
  const {
    types,
    names,
    namespace,
  } = params;

  const kc = getConfig(params);

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
  deleteObject,
  getService,
  getAllServices,
  runKubectlCommand,
});
