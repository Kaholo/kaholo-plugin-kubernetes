const { CoreV1Api } = require('@kubernetes/client-node');
const k8s = require('@kubernetes/client-node');
// Constructors
const { newClusters, newContexts, newUsers } = require('@kubernetes/client-node/dist/config_types');

function getConfig(params, settings){
    const caCert = params.caCert || settings.caCert;
    const endpointUrl = params.endpointUrl || settings.endpointUrl;
    const token = params.token || settings.token;
    const saName = params.saName || settings.saName || "kaholo-sa";
  
    if (!caCert || !endpointUrl || !token){
      throw "not provided one of required fields";
    }
    // define options
    const user = {
      name: saName,
      user: { token: token }
    };
    const cluster = {
      cluster: {
        "certificate-authority-data": caCert,
        server: endpointUrl 
      },
      name: `${saName}-cluster`
    };
    const context = {
      context: {
        cluster: `${saName}-cluster`,
        user: saName
      },
      name: `${saName}-context`
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

function getDeleteFunc(client, resourceType){
    switch(resourceType){
        case "configmaps": case "cm":
            return client.deleteNamespacedConfigMap;
        case "endpoints": case "ep":
            return client.deleteNamespacedEndpoints;
        case "events": case "ev":
            return client.deleteNamespacedEvent;
        case "limitranges": case "limits":
            return client.deleteNamespacedLimitRange;
        case "namespaces": case "namespace": case "ns":
            return client.deleteNamespace;
        case "nodes": case "no":
            return client.deleteNode;
        case "persistentvolumeclaims": case "pvc":
            return client.deleteNamespacedPersistentVolumeClaim;
        case "persistentvolumes": case "pv":
            return client.deleteNamespacedPersistentVolumeClaim;
        case "pods": case "po":
            return client.deleteNamespacedPod;
        case "podtemplates":
            return client.deleteNamespacedPodTemplate;
        case "replicationcontrollers": case "rc":
            return client.deleteNamespacedReplicationController;
        case "resourcequotas": case "quota":
            return client.deleteNamespacedResourceQuota;
        case "secrets":
            return client.deleteNamespacedSecret;
        case "serviceaccounts": case "sa":
            return client.deleteNamespacedServiceAccount;
        case "services": case "svc":
            return client.deleteNamespacedService;
        case "daemonsets": case "ds":
            return client.deleteNamespacedDaemonSet;
        case "deployments": case "deploy":
            return client.deleteNamespacedDeployment;
        case "statefulsets": case "sts":
            return client.deleteNamespacedStatefulSet;
        case "controllerrevisions":
            return client.deleteNamespacedControllerRevision;
        case "replicasets": case "rs":
            return client.deleteNamespacedReplicaSet;
        case "ingresses": case "ing":
            return client.deleteNamespacedIngress;
        case "networkpolicies": case "netpol":
            return client.deleteNamespacedNetworkPolicy;
        case "podsecuritypolicies": case "psp":
            return client.deletePodSecurityPolicy;
        case "clusterrolebindings":
            return client.deleteClusterRoleBinding;
        case "clusterroles":
            return client.deleteClusterRole;
        case "rolebindings":
            return client.deleteClusterRoleBinding;
        case "jobs":
            return client.deleteNamespacedJob;
        case "cronjobs": case "cj":
            return client.deleteNamespacedCronJob;
        case "storageclasses": case "sc":
            return client.deleteStorageClass;
        case "volumeattachments":
            return client.deleteVolumeAttachment;
        default:
            throw "couldn't find resource type";
    }
}

const apiToResourceType = [
    {api: k8s.CoreV1Api, types: ["configmaps", "cm", "endpoints", "ep", "events", "ev", 
        "limitranges", "limits", "namespaces", "ns", "nodes", "no", 
        "persistentvolumeclaims", "pvc", "persistentvolumes", "pv", "pods", "po", "podtemplates", 
        "replicationcontrollers", "rc", "resourcequotas", "rc", "secrets", "serviceaccounts", "sa", 
        "services", "svc"]},
    {api: k8s.AppsV1Api, types: ["daemonsets", "ds", "deployments", "deploy", "replicasets", "rs", 
        "statefulsets", "sts", "controllerrevisions"]},
    {api: k8s.ExtensionsV1beta1Api, types: ["ingresses", "ing", "networkpolicies", "netpol", 
        "podsecuritypolicies", "psp"]},
    {api: k8s.RbacAuthorizationV1Api, types: ["clusterrolebindings", "clusterroles", "rolebindings" ]},
    {api: k8s.BatchV1Api, types: ["jobs"]},
    {api: k8s.BatchV2alpha1Api, types: ["cronjobs", "cj"]},
    {api: k8s.StorageV1Api, types: ["storageclasses", "sc", "volumeattachments"]},
    {api: k8s.KubernetesObjectApi, types: ["spec"]}
]

function getClient(kc, resourceType){
    let api = apiToResourceType.find(mapObj => mapObj.types.includes(resourceType))?.api;
    if (!api) {
        apiToResourceType.forEach(mapObj => [`${resourceType}s`, `${resourceType}es`].forEach(rsrc => {
            if (mapObj.types.includes(rsrc)){
                api = mapObj.api;
                resourceType = rsrc;
            }
        }));
    }
    if (api) {
        return [resourceType, kc.makeApiClient(api)];
    }
    throw `Couldn't find API client for resource type '${resourceType}'`;
}

function parseArr(arr){
    if (Array.isArray(arr)) return arr;
    if (!arr) return [];
    if (typeof(arr) !== "string") throw "Must be of type string or array";

    return arr.split("\n").map(line => line.trim()).filter(line => line);
}

async function runDeleteFunc(deleteFunc, resourceType, name, namespace){
    const deleteObj = {
        "type": resourceType,
        "name": name
    }
    try {
        let res;
        if (namespace){
            deleteObj.namespace = namespace;
            res = await deleteFunc(name, namespace);
        }
        else {
            res = await deleteFunc(name);
        }
        deleteObj.result = res.body.status;
    }
    catch (err) {
        if (err.body?.code === 404){
            return null;
        }
        deleteObj.result = "Failure";
        deleteObj.err = err;
    }
    return deleteObj;
}

module.exports = {
    getConfig,
    getClient,
    parseArr, 
    runDeleteFunc,
    getDeleteFunc
};
