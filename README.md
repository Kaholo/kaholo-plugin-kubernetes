# kaholo-plugin-kubernetes
Kubernetes API plugin for Kaholo.

## How To Use
To connect to your Kubernetes cluster from this plugin you need to create a service account with sufficent permmisions to Kaholo. You need to do the following steps in order to make this plugin work:
1. Create a new service account for kaholo on your cluster. You can see more information on creating service accounts [here](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/).
    To do so with kubectl you can write the following command:
    ```sh
    kubectl create serviceaccount kaholo-sa
    ```
2. Bind roles with sufficent permmision for the methods you want to use in the plugin.
    Each method in the plugin specifies what permmisions it needs.
3. Get you service account authentication token. In order to so with kubectl you can enter the following commands:
    ```sh
    # this will print the service account details. Save token name for later(kaholo-sa-token-XXXXX for example)
    kubectl describe sa kaholo-sa
    # This will print your token secret in base64 encoding
    kubectl describe secret kaholo-sa-token-XXXXX
    ```
    * Decode token secret with base64 decoder. You can do so [here](https://www.base64decode.org/).
4. Save decoded secret in the kaholo vault.
5. Define the token setting in the plugin as the decoded secret from the vault.

## Settings
1. Endpoint URL (String) **Optional** - The URL of the default cluster to connect to.
2. Certificate Authority (Vault) **Optional** - The CA certification of the default cluster.
3. Service Account Token (Vault) **Optional** - The token of the default kaholo service account configured on the default cluster.
4. Service Account Name (String) **Optional** - The name of the default kaholo service account. 

## Method Apply
Create or update resources in Kubernetes. Update means that if resources with the same name as the ones specified, exist, they will be deleted, and re-created with the settings described in the YML File. Mimics the kubectl apply method.

### Service Account Permmisions
This method might need different permmisions for different apply actions, based on what resources it tries to apply, and in what namespace.
You can bind the role `cluster-admin` in the namespace you are working to give the service account full access to this namespace.

### Parameters
1. Endpoint URL (String) **Optional** - The URL the cluster to connect to. If not provided will use endpoint URL from settings.
2. Certificate Authority (Vault) **Optional** - The CA certification of the cluster.
3. Service Account Token (Vault) **Optional** - The token of the service account that's configured on the required cluster.
4. Service Account Name (String) **Optional** - The name of the kaholo service account. 
5. Yaml File Path (String) **Required** - Path to a YML file with info on the Kubernetes resources you want to create or update.

## Method Delete Object
Delete any kubernetes object by it's name, type and namespace.

### Service Account Permmisions
For this method to work the service account needs permmisions to delete the resource in the system.

### Parameters
1. Endpoint URL (String) **Optional** - The URL the cluster to connect to. If not provided will use endpoint URL from settings.
2. Certificate Authority (Vault) **Optional** - The CA certification of the cluster.
3. Service Account Token (Vault) **Optional** - The token of the service account that's configured on the required cluster.
4. Service Account Name (String) **Optional** - The name of the kaholo service account. 
5. Types (Text/Array) **Required** - The type(s) of object(s) you want to delete. You can enter multiple values by seperating each with a new line.
6. Names (Text/Array) **Required** - The name(s) of the object(s) you want to delete. You can enter multiple values by seperating each with a new line.
7. Namespace (String) **Optional** - The namespace of the object(s) to delete. Not required if the resource is not inside a namespace, like when deleting the namespace itself or deleting a Node for example. **Required for 'namespaced' resources.**
