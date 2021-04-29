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

function runDelete(client, resourceType, name, namespace){
    switch(resourceType){
        case "configmaps": case "cm":
            return client.deleteNamespacedConfigMap(name, namespace);
        case "endpoints": case "ep":
            return client.deleteNamespacedEndpoints(name, namespace);
        case "events": case "ev":
            return client.deleteNamespacedEvent(name, namespace);
        case "limitranges": case "limits":
            return client.deleteNamespacedLimitRange(name, namespace);
        case "namespaces": case "namespace": case "ns":
            return client.deleteNamespace(name);
        case "nodes": case "no":
            return client.deleteNode(name);
        case "persistentvolumeclaims": case "pvc":
            return client.deleteNamespacedPersistentVolumeClaim(name, namespace);
        case "persistentvolumes": case "pv":
            return client.deleteNamespacedPersistentVolumeClaim(name, namespace);
        case "pods": case "po":
            return client.deleteNamespacedPod(name, namespace);
        case "podtemplates":
            return client.deleteNamespacedPodTemplate(name, namespace);
        case "replicationcontrollers": case "rc":
            return client.deleteNamespacedReplicationController(name, namespace);
        case "resourcequotas": case "quota":
            return client.deleteNamespacedResourceQuota(name, namespace);
        case "secrets":
            return client.deleteNamespacedSecret(name, namespace);
        case "serviceaccounts": case "sa":
            return client.deleteNamespacedServiceAccount(name, namespace);
        case "services": case "svc":
            return client.deleteNamespacedService(name, namespace);
        case "daemonsets": case "ds":
            return client.deleteNamespacedDaemonSet(name, namespace);
        case "deployments": case "deploy":
            return client.deleteNamespacedDeployment(name, namespace);
        case "statefulsets": case "sts":
            return client.deleteNamespacedStatefulSet(name, namespace);
        case "controllerrevisions":
            return client.deleteNamespacedControllerRevision(name, namespace);
        case "replicasets": case "rs":
            return client.deleteNamespacedReplicaSet(name, namespace);
        case "ingresses": case "ing":
            return client.deleteNamespacedIngress(name, namespace);
        case "networkpolicies": case "netpol":
            return client.deleteNamespacedNetworkPolicy(name, namespace);
        case "podsecuritypolicies": case "psp":
            return client.deletePodSecurityPolicy(name);
        case "clusterrolebindings":
            return client.deleteClusterRoleBinding(name);
        case "clusterroles":
            return client.deleteClusterRole(name);
        case "rolebindings":
            return client.deleteClusterRoleBinding(name);
        case "jobs":
            return client.deleteNamespacedJob(name, namespace);
        case "cronjobs": case "cj":
            return client.deleteNamespacedCronJob(name, namespace);
        case "storageclasses": case "sc":
            return client.deleteStorageClass(name);
        case "volumeattachments":
            return client.deleteVolumeAttachment(name);
        default:
            throw "couldn't find resource type";
    }
}

const apiToResourceType = [
    {api: k8s.CoreV1Api, types: ["configmaps", "cm", "endpoints", "ep", "events", "ev", 
        "limitranges", "limits", "namespaces", "namespace", "ns", "nodes", "no", 
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
    const api = apiToResourceType.find(obj => obj.types.includes(resourceType)).api;
    if (!api){
        throw `couldn't find API Client for resource type '${resourceType}'.`
    }
    return kc.makeApiClient(api);
}

function parseArr(arr){
    if (Array.isArray(arr)) return arr;
    if (!arr) return [];
    if (typeof(arr) !== "string") throw "Must be of type string or array";

    return arr.split("\n").map(line => line.trim()).filter(line => line);
}

async function runDeleteFunc(client, resourceType, name, namespace){
    const deleteObj = {
        "type": resourceType,
        "name": name
    }
    if (namespace){
        deleteObj.namespace = namespace;
    }
    try {
        const res = await runDelete(client, resourceType, name, namespace);
        deleteObj.result = res.body.status;
    }
    catch (err) {
        if (err.body.code === 404){
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
    runDeleteFunc
};
