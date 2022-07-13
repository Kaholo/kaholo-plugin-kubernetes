const { bootstrap } = require("@kaholo/plugin-library");
const { CoreV1Api, KubernetesObjectApi } = require("@kubernetes/client-node");

const k8sLib = require("./k8s-library");
const { runKubectlCommand } = require("./kubectl");
const { createK8sClient } = require("./helpers");

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

  return k8sLib.deleteObjects(params, {
    objectsTypes: types,
    objectsNames: names,
    namespace,
  });
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
