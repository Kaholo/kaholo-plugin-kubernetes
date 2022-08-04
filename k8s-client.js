const k8s = require("@kubernetes/client-node");
const {
  newClusters,
  newContexts,
  newUsers,
} = require("@kubernetes/client-node/dist/config_types");

const { decodeBase64 } = require("./helpers");

function create(api, {
  kubeCertificate,
  kubeApiServer,
  kubeToken,
}) {
  const config = getConfig({
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  });
  const k8sClient = config.makeApiClient(api);

  return k8sClient;
}

function getConfig(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  } = params;

  const serviceAccountName = extractServiceAccountName(kubeToken);

  const cluster = {
    cluster: {
      "certificate-authority-data": kubeCertificate,
      server: kubeApiServer,
    },
    name: `${serviceAccountName}-cluster`,
  };

  const context = {
    context: {
      cluster: `${serviceAccountName}-cluster`,
      user: serviceAccountName,
    },
    name: `${serviceAccountName}-context`,
  };

  const user = {
    name: serviceAccountName,
    user: { token: kubeToken },
  };

  const kubeConfig = new k8s.KubeConfig();
  kubeConfig.loadFromOptions({
    clusters: newClusters([cluster]),
    contexts: newContexts([context]),
    users: newUsers([user]),
    currentContext: context.name,
  });

  return kubeConfig;
}

function extractServiceAccountName(kubeToken) {
  try {
    const decoded = decodeBase64(kubeToken.split(".")[1]);
    const parsed = JSON.parse(decoded);

    const name = parsed["kubernetes.io/serviceaccount/service-account.name"];
    if (!name) {
      throw new Error("\"Service Account Name\" was not found in the Access Token.");
    }

    return name;
  } catch (error) {
    throw new Error(`Error occured while extracting the Service Account name from the Access Token. Make sure you pass the valid Access Token. ${error}`);
  }
}

module.exports = {
  create,
};
