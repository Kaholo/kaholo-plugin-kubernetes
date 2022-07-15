const k8s = require("@kubernetes/client-node");
const {
  newClusters,
  newContexts,
  newUsers,
} = require("@kubernetes/client-node/dist/config_types");

const HTTP_CODE_UNAUTHORIZED = 401;
const UNAUTHORIZED_ERROR_MESSAGE = "Please ensure the Service Account Token is vaulted in the correct format and that your service account has sufficient privileges to perform this operation. Consult the plugin documentation for more details.";

const deleteFunctionNamesToApiMap = new Map([
  ["deleteNamespacedConfigMap", k8s.CoreV1Api],
  ["deleteNamespacedEndpoints", k8s.CoreV1Api],
  ["deleteNamespacedEvent", k8s.CoreV1Api],
  ["deleteNamespacedLimitRange", k8s.CoreV1Api],
  ["deleteNamespace", k8s.CoreV1Api],
  ["deleteNode", k8s.CoreV1Api],
  ["deleteNamespacedPersistentVolumeClaim", k8s.CoreV1Api],
  ["deleteNamespacedPod", k8s.CoreV1Api],
  ["deleteNamespacedPodTemplate", k8s.CoreV1Api],
  ["deleteNamespacedReplicationController", k8s.CoreV1Api],
  ["deleteNamespacedResourceQuota", k8s.CoreV1Api],
  ["deleteNamespacedSecret", k8s.CoreV1Api],
  ["deleteNamespacedServiceAccount", k8s.CoreV1Api],
  ["deleteNamespacedService", k8s.CoreV1Api],
  ["deleteNamespacedDaemonSet", k8s.AppsV1Api],
  ["deleteNamespacedDeployment", k8s.AppsV1Api],
  ["deleteNamespacedReplicaSet", k8s.AppsV1Api],
  ["deleteNamespacedStatefulSet", k8s.AppsV1Api],
  ["deleteNamespacedControllerRevision", k8s.AppsV1Api],
  ["deleteNamespacedIngress", k8s.NetworkingV1Api],
  ["deleteNamespacedNetworkPolicy", k8s.NetworkingV1Api],
  ["deletePodSecurityPolicy", k8s.PolicyV1beta1Api],
  ["deleteClusterRoleBinding", k8s.RbacAuthorizationV1Api],
  ["deleteClusterRole", k8s.RbacAuthorizationV1Api],
  ["deleteClusterRoleBinding", k8s.RbacAuthorizationV1Api],
  ["deleteNamespacedJob", k8s.BatchV1Api],
  ["deleteNamespacedCronJob", k8s.BatchV1Api],
  ["deleteStorageClass", k8s.StorageV1Api],
  ["deleteVolumeAttachment", k8s.StorageV1Api],
]);

function mapResourceTypeToDeleteFunctionName(resourceType) {
  switch (resourceType) {
    case "configmaps": case "configmap": case "cm":
      return "deleteNamespacedConfigMap";
    case "endpoints": case "endpoint": case "ep":
      return "deleteNamespacedEndpoints";
    case "events": case "event": case "ev":
      return "deleteNamespacedEvent";
    case "limitranges": case "limitrange": case "limits":
      return "deleteNamespacedLimitRange";
    case "namespaces": case "namespace": case "ns":
      return "deleteNamespace";
    case "nodes": case "node": case "no":
      return "deleteNode";
    case "persistentvolumeclaims": case "persistentvolumeclaim": case "pvc":
      return "deleteNamespacedPersistentVolumeClaim";
    case "persistentvolumes": case "persistentvolume": case "pv":
      return "deleteNamespacedPersistentVolume";
    case "pods": case "pod": case "po":
      return "deleteNamespacedPod";
    case "podtemplates": case "podtemplate":
      return "deleteNamespacedPodTemplate";
    case "replicationcontrollers": case "replicationcontroller": case "rc":
      return "deleteNamespacedReplicationController";
    case "resourcequotas": case "resourcequota": case "quota":
      return "deleteNamespacedResourceQuota";
    case "secrets": case "secret":
      return "deleteNamespacedSecret";
    case "serviceaccounts": case "serviceaccount": case "sa":
      return "deleteNamespacedServiceAccount";
    case "services": case "service": case "svc":
      return "deleteNamespacedService";
    case "daemonsets": case "daemonset": case "ds":
      return "deleteNamespacedDaemonSet";
    case "deployments": case "deployment": case "deploy":
      return "deleteNamespacedDeployment";
    case "statefulsets": case "statefulset": case "sts":
      return "deleteNamespacedStatefulSet";
    case "controllerrevisions": case "controllerrevision":
      return "deleteNamespacedControllerRevision";
    case "replicasets": case "replicaset": case "rs":
      return "deleteNamespacedReplicaSet";
    case "ingresses": case "ingress": case "ing":
      return "deleteNamespacedIngress";
    case "networkpolicies": case "networkpolicy": case "netpol":
      return "deleteNamespacedNetworkPolicy";
    case "podsecuritypolicies": case "podsecuritypolicy": case "psp":
      return "deletePodSecurityPolicy";
    case "clusterrolebindings": case "clusterrolebinding":
      return "deleteClusterRoleBinding";
    case "clusterroles": case "clusterrole":
      return "deleteClusterRole";
    case "rolebindings": case "rolebinding":
      return "deleteClusterRoleBinding";
    case "jobs": case "job":
      return "deleteNamespacedJob";
    case "cronjobs": case "cronjob": case "cj":
      return "deleteNamespacedCronJob";
    case "storageclasses": case "storageclass": case "sc":
      return "deleteStorageClass";
    case "volumeattachments": case "volumeattachment":
      return "deleteVolumeAttachment";
    default:
      throw new Error("Unrecognized resource type");
  }
}

function getDeleteApi(resourceType, functionName) {
  const api = deleteFunctionNamesToApiMap.get(functionName);

  if (!api) {
    throw new Error(`Couldn't find API client for resource type '${resourceType}'`);
  }

  return api;
}

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
  mapResourceTypeToDeleteFunctionName,
  getDeleteApi,
  createK8sClient,
  applyBySpec,
  parseError,
};
