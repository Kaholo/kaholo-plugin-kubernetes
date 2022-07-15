const k8s = require("@kubernetes/client-node");
const {
  newClusters,
  newContexts,
  newUsers,
} = require("@kubernetes/client-node/dist/config_types");

const HTTP_CODE_UNAUTHORIZED = 401;
const UNAUTHORIZED_ERROR_MESSAGE = "Please ensure the Service Account Token is vaulted in the correct format and that your service account has sufficient privileges to perform this operation. Consult the plugin documentation for more details.";

function createK8sClient(api, {
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

async function applyBySpec(client, spec) {
  try {
    await client.read(spec);
  } catch (err) {
    return client.create(spec);
  }
  return client.patch(spec);
}

function parseError(err) {
  if (err?.body?.code === HTTP_CODE_UNAUTHORIZED) {
    return `${UNAUTHORIZED_ERROR_MESSAGE} ${err.body}`;
  }

  return err.body ? err.body : err;
}

function getConfig(params) {
  const {
    kubeCertificate,
    kubeApiServer,
    kubeToken,
  } = params;

  const saName = extractServiceAccountName(kubeToken) || "kaholo-sa";

  // define options
  const user = {
    name: saName,
    user: { token: kubeToken },
  };
  const cluster = {
    cluster: {
      "certificate-authority-data": kubeCertificate,
      server: kubeApiServer,
    },
    name: `${saName}-cluster`,
  };
  const context = {
    context: {
      cluster: `${saName}-cluster`,
      user: saName,
    },
    name: `${saName}-context`,
  };
  // load kubeconfig from options
  const kc = new k8s.KubeConfig();
  kc.loadFromOptions({
    clusters: newClusters([cluster]),
    contexts: newContexts([context]),
    users: newUsers([user]),
    currentContext: context.name,
  });
  return kc;
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

function decodeBase64(content) {
  return Buffer.from(content, "base64").toString("utf-8");
}

module.exports = {
  createK8sClient,
  applyBySpec,
  parseError,
};
