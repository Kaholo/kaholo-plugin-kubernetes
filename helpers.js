const k8s = require("@kubernetes/client-node");
// Constructors
const { newClusters, newContexts, newUsers } = require("@kubernetes/client-node/dist/config_types");

const UNAUTHORIZED_ERROR_MESSAGE = "Please ensure the Service Account Token is vaulted in the correct format and that your service account has sufficient privileges to perform this operation. Consult the plugin documentation for more details.";
const EXTRACTION_FAILED = "Error occured while extracting the Service Account name from the Access Token. Make sure you pass the valid Access Token.";

function decodeBase64(content) {
  return Buffer.from(content, "base64").toString("utf-8");
}

function parseErr(err) {
  if (err.body) {
    if (err.body.code === 401) {
      return {
        message: UNAUTHORIZED_ERROR_MESSAGE,
        originalError: err.body,
      };
    }
    return err.body;
  }
  return err;
}

/**
 * Extracts the service account name from the access token
 * @param {string} token
 * @returns {string}
 */
function extractServiceAccountName(token) {
  try {
    const decoded = decodeBase64(token.split(".")[1]);
    const parsed = JSON.parse(decoded);
    const name = parsed["kubernetes.io/serviceaccount/service-account.name"];
    if (!name) {
      throw new Error("\"Service Account Name\" was not found in the Access Token.");
    }
    return name;
  } catch (error) {
    throw {
      message: EXTRACTION_FAILED,
      originalError: error,
    };
  }
}
/**
 *
 * @param {*} params
 * @param {*} settings
 * @returns {k8s.KubeConfig}
 */
function getConfig(params, settings) {
  const caCert = params.caCert || settings.caCert;
  const endpointUrl = params.endpointUrl || settings.endpointUrl;
  const token = params.token || settings.token;
  const saName = extractServiceAccountName(token) || "kaholo-sa";

  if (!caCert || !endpointUrl || !token) {
    throw "not provided one of required fields";
  }
  // define options
  const user = {
    name: saName,
    user: { token },
  };
  const cluster = {
    cluster: {
      "certificate-authority-data": caCert,
      server: endpointUrl,
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

function getDeleteFuncName(resourceType) {
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
      throw "couldn't find resource type";
  }
}

const apiToFuncs = [
  {
    api: k8s.CoreV1Api,
    funcs: ["deleteNamespacedConfigMap", "deleteNamespacedEndpoints", "deleteNamespacedEvent",
      "deleteNamespacedLimitRange", "deleteNamespace", "deleteNode", "deleteNamespacedPersistentVolumeClaim",
      "deleteNamespacedPersistentVolume", "deleteNamespacedPod", "deleteNamespacedPodTemplate",
      "deleteNamespacedReplicationController", "deleteNamespacedResourceQuota", "deleteNamespacedSecret",
      "deleteNamespacedServiceAccount", "deleteNamespacedService"],
  },
  {
    api: k8s.AppsV1Api,
    funcs: ["deleteNamespacedDaemonSet", "deleteNamespacedDeployment", "deleteNamespacedReplicaSet",
      "deleteNamespacedStatefulSet", "deleteNamespacedControllerRevision"],
  },
  { api: k8s.ExtensionsV1beta1Api, funcs: ["deleteNamespacedIngress", "deleteNamespacedNetworkPolicy", "deletePodSecurityPolicy"] },
  { api: k8s.RbacAuthorizationV1Api, funcs: ["deleteClusterRoleBinding", "deleteClusterRole", "deleteClusterRoleBinding"] },
  { api: k8s.BatchV1Api, funcs: ["deleteNamespacedJob"] },
  { api: k8s.BatchV2alpha1Api, funcs: ["deleteNamespacedCronJob"] },
  { api: k8s.StorageV1Api, funcs: ["deleteStorageClass", "deleteVolumeAttachment"] },
];

function getDeleteFunc(kc, resourceType) {
  const funcName = getDeleteFuncName(resourceType);
  const apiFunc = apiToFuncs.find((mapObj) => mapObj.funcs.includes(funcName));

  const api = apiFunc ? apiFunc.api : undefined;

  if (!api) { throw `Couldn't find API client for resource type '${resourceType}'`; }

  const client = kc.makeApiClient(api);
  const delFunc = client[funcName].bind(client); // bind delete function to it's client
  return delFunc;
}

function parseArr(arr) {
  if (Array.isArray(arr)) { return arr; }
  if (!arr) { return []; }
  if (typeof (arr) !== "string") { throw "Must be of type string or array"; }

  return arr.split("\n").map((line) => line.trim()).filter((line) => line);
}

async function runDeleteFunc(deleteFunc, resourceType, name, namespace) {
  const deleteObj = {
    type: resourceType,
    name,
  };
  try {
    let res;
    if (namespace) {
      deleteObj.namespace = namespace;
      res = await deleteFunc(name, namespace);
    } else {
      res = await deleteFunc(name);
    }
    deleteObj.result = JSON.stringify(res.body);
  } catch (err) {
    deleteObj.err = JSON.stringify(parseErr(err));
  }
  return deleteObj;
}

module.exports = {
  getConfig,
  parseArr,
  runDeleteFunc,
  getDeleteFunc,
  parseErr,
};
