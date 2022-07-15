const {
  CoreV1Api,
  AppsV1Api,
  NetworkingV1Api,
  PolicyV1beta1Api,
  RbacAuthorizationV1Api,
  BatchV1Api,
  StorageV1Api,
} = require("@kubernetes/client-node");

const deleteFunctionNamesToApiMap = new Map([
  ["deleteNamespacedConfigMap", CoreV1Api],
  ["deleteNamespacedEndpoints", CoreV1Api],
  ["deleteNamespacedEvent", CoreV1Api],
  ["deleteNamespacedLimitRange", CoreV1Api],
  ["deleteNamespace", CoreV1Api],
  ["deleteNode", CoreV1Api],
  ["deleteNamespacedPersistentVolumeClaim", CoreV1Api],
  ["deleteNamespacedPod", CoreV1Api],
  ["deleteNamespacedPodTemplate", CoreV1Api],
  ["deleteNamespacedReplicationController", CoreV1Api],
  ["deleteNamespacedResourceQuota", CoreV1Api],
  ["deleteNamespacedSecret", CoreV1Api],
  ["deleteNamespacedServiceAccount", CoreV1Api],
  ["deleteNamespacedService", CoreV1Api],
  ["deleteNamespacedDaemonSet", AppsV1Api],
  ["deleteNamespacedDeployment", AppsV1Api],
  ["deleteNamespacedReplicaSet", AppsV1Api],
  ["deleteNamespacedStatefulSet", AppsV1Api],
  ["deleteNamespacedControllerRevision", AppsV1Api],
  ["deleteNamespacedIngress", NetworkingV1Api],
  ["deleteNamespacedNetworkPolicy", NetworkingV1Api],
  ["deletePodSecurityPolicy", PolicyV1beta1Api],
  ["deleteClusterRoleBinding", RbacAuthorizationV1Api],
  ["deleteClusterRole", RbacAuthorizationV1Api],
  ["deleteClusterRoleBinding", RbacAuthorizationV1Api],
  ["deleteNamespacedJob", BatchV1Api],
  ["deleteNamespacedCronJob", BatchV1Api],
  ["deleteStorageClass", StorageV1Api],
  ["deleteVolumeAttachment", StorageV1Api],
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

module.exports = {
  mapResourceTypeToDeleteFunctionName,
  getDeleteApi,
};
