# kaholo-plugin-kubernetes
Kubernetes API plugin for Kaholo.

## How To Use
To connect to your Kubernetes cluster from this plugin you need to create a service account with sufficent permmisions to Kaholo. You need to do the following steps in order to make this plugin work:
1. Create a new service account for kaholo on your cluster. You can see more information on creating service accounts [here](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/).
    To do so with kubectl you can write the following command:
    * kubectl create serviceaccount kaholo-sa
2. Bind roles with sufficent permmision for the methods you want to use in the plugin.
    Each method in the plugin specifies what permmisions it needs.
3. Get you service account authentication token. In order to so with kubectl you can enter the following commands:
    * kubectl describe sa kaholo-sa -> this will print the service account details. Save token name for later(kaholo-sa-token-abcde for example)
    * kubectl describe secret {token-name}(kaholo-sa-token-abcde) -> This will print your token secret in base64 encoding
    * Decode token secret with base64 decoder. You can do so [here](https://www.base64decode.org/).
4. Save decoded secret in the kaholo vault.
5. Define the token setting in the plugin as the decoded secret from the vault.

## Settings
1. Endpoint URL - The URL of the default cluster to connect to.
2. Certificate Authority - The CA certification of the default cluster.
3. Service Account Token - The token of the default kaholo service account configured on the default cluster.
4. Service Account Name - The name of the default kaholo service account. 

## Method Apply
Create or update resources in Kubernetes. Update means that if resources with the same name as the ones specified, exist, they will be deleted, and re-created with the settings described in the YML File. Mimics the kubectl apply method.

### Service Account Permmisions
This method might need different permmisions for different apply actions, based on what resources it tries to apply, and in what namespace.
You can bind the role cluster-admin in the namespace you are working to give the service account full access to this namespace.

### Parameters
1. Endpoint URL - The URL the cluster to connect to. If not provided will use endpoint URL from settings.
2. Certificate Authority - The CA certification of the cluster.
3. Service Account Token - The token of the service account that's configured on the required cluster.
4. Service Account Name - The name of the kaholo service account. 
5. Yaml File Path(required) - Path to a YML file with info on the Kubernetes resources you want to create or update.

## Method Delete Namespace
Deletes the namespace specified entirely, including all the resources inside.

### Service Account Permmisions
For this method to work the service account needs permmisions to delete namespaces resources in the kube-system namespace.
A role you can bind to make this work is cluster-admin in the kube-system namespace.

### Parameters
1. Endpoint URL - The URL the cluster to connect to. If not provided will use endpoint URL from settings.
2. Certificate Authority - The CA certification of the cluster.
3. Service Account Token - The token of the service account that's configured on the required cluster.
4. Service Account Name - The name of the kaholo service account. 
5. Namespace(required) - The namespace to delete.
