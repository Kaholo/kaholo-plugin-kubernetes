# kaholo-plugin-kubernetes
Kubernetes API plugin for Kaholo.

## How To USE CLI methods
To be able to use the kubernetes CLI methods, you need to make sure you have kubectl installed on your agent, and configured correctly to connect to the wanted kubernetes cluster.
You can see more on downloading and configuring kubectl [here](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).
* Please make sure kubectl is in your copputer's path and that it is reachable from CMD/Bash.

## How To Use API methods
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

##  Settings
1. Endpoint URL (String) **Required for api methods if not in action** - The default kubernetes endpoint URL to connect to.
[Learn More](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
2. Certificate Authority (Vault) **Required for api methods if not in action** - The default Certificate Authority to use for authentication.
[Learn More](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
3. Service Account Token (Vault) **Required for api methods if not in action** - The token to use for authentication to the service account on default.
[Learn More](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
4. Service Account Name (String) **Required for api methods if not in action** - The name of the default service account to use for authentication.
[Learn More](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
5. Sudo CLI commands (Boolean) **Optional** - If true, run all CLI commands with the Sudo command. The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: Apply
Create or update resources in Kubernetes. Update means that if resources with the same name as the ones specified, exist, they will be deleted, and re-created with the settings described in the YML File. Mimics the kubectl apply method.

### Service Account Permmisions
This method might need different permmisions for different apply actions, based on what resources it tries to apply, and in what namespace.
You can bind the role `cluster-admin` in the namespace you are working to give the service account full access to this namespace.

### Parameters
1. Endpoint URL (String) **Required if not in settings** - An endpoint is a resource that gets IP addresses of one or more pods dynamically assigned to it, along with a port. An endpoint can be viewed using kubectl get endpoints.
[Learn More](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
2. Certificate Authority (Vault) **Required if not in settings** - Kubernetes provides a certificates.k8s.io API, which lets you provision TLS certificates signed by a Certificate Authority (CA) that you control. These CA and certificates can be used by your workloads to establish trust. certificates.k8s.io API uses a protocol that is similar to the ACME draft.
[Learn More](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
3. Service Account Token (Vault) **Required if not in settings** - A service account has an associated service account authentication token, which is stored as a Kubernetes secret.
[Learn More](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
4. Service Account Name (String) **Required if not in settings** - Kubernetes service accounts are Kubernetes resources, created and managed using the Kubernetes API, meant to be used by in-cluster Kubernetes-created entities, such as Pods, to authenticate to the Kubernetes API server or external services.
[Learn More](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
5. Yaml File Path (String) **Required** - Yaml File full Path to create the update.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)
6. Namespace (String) **Optional** - Namespaces are a way to organize clusters into virtual sub-clusters — they can be helpful when different teams or projects share a Kubernetes cluster. Any number of namespaces are supported within a cluster, each logically separated from others but with the ability to communicate with each other. Default namespace to deploy into is 'default'.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

## Method: CLI - Apply
Create or update resources in Kubernetes, using the kubectl method Apply.

### Parameters
1. File Path (String) **Required** - The path to the yml file to apply.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
2. Force (Boolean) **Optional** - If true, immediately remove resources from API and bypass graceful deletion. Default value is false.
[Learn More](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/)
3. Don't Overwrite (Boolean) **Optional** - Do not automatically resolve conflicts between the modified and live configuration by using values from the modified configuration.
[Learn More](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. Dry-run (Options) **Optional** - Dry run is not a concept exclusive to Kubernetes. It's an expression used to indicate a rehearsal of a performance or procedure before the real one. Dry run mode gives you the possibility of issuing a command without side effects for testing an actual command that you intend to run. Possible values: **none | server | client**
[Learn More](https://kubernetes.io/blog/2019/01/14/apiserver-dry-run-and-kubectl-diff/)
5. Sudo (Boolean) **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: Delete Object
Delete any kubernetes object by it's name, type and namespace.

### Service Account Permmisions
For this method to work the service account needs permmisions to delete the resource in the system.

### Parameters
1. Endpoint URL (String) **Required if not in settings** - An endpoint is a resource that gets IP addresses of one or more pods dynamically assigned to it, along with a port. An endpoint can be viewed using kubectl get endpoints.
[Learn More](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
2. Certificate Authority (Vault) **Required if not in settings** - Kubernetes provides a certificates.k8s.io API, which lets you provision TLS certificates signed by a Certificate Authority (CA) that you control. These CA and certificates can be used by your workloads to establish trust. certificates.k8s.io API uses a protocol that is similar to the ACME draft.
[Learn More](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
3. Service Account Token (Vault) **Required if not in settings** - A service account has an associated service account authentication token, which is stored as a Kubernetes secret.
[Learn More](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
4. Service Account Name (String) **Required if not in settings** - Kubernetes service accounts are Kubernetes resources, created and managed using the Kubernetes API, meant to be used by in-cluster Kubernetes-created entities, such as Pods, to authenticate to the Kubernetes API server or external services.
[Learn More](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
5. Name (String) **Required** - A Kubernetes service is a logical abstraction for a deployed group of pods in a cluster (which all perform the same function). Since pods are ephemeral, a service enables a group of pods, which provide specific functions (web services, image processing, etc.) to be assigned a name and unique IP address (clusterIP).
[Learn More](https://kubernetes.io/docs/concepts/services-networking/service/)
6. Namespace (String) **Optional** - Specify the namespace name. Default namespace is 'default'.
[Learn More](https://kubernetes.io/docs/concepts/services-networking/service/)

## Method: CLI - Get Services
Get informattion on all services whuch match the specified criteria, using kubectl.

### Parameters
1. Sudo (Boolean) **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
2. Namespace (String) **Optional** - If true only return services from the specified namespace.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

## Method: CLI - Expose Deployment
Createas a service object that exposes the specified deployment, using the kubectl ["kubectl expose"](https://jamesdefabia.github.io/docs/user-guide/kubectl/kubectl_expose/) method. 

### Parameters
1. Deployment (String) **Required** - A Deployment runs multiple replicas of your application and automatically replaces any instances that fail or become unresponsive. In this way, Deployments help ensure that one or more instances of your application are available to serve user requests. Deployments are managed by the Kubernetes Deployment controller.
[Learn More](https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/)
2. Type (String) **Required** - Kubernetes objects are entities that are used to represent the state of the cluster. An object is a “record of intent” – once created, the cluster does its best to ensure it exists as defined. This is known as the cluster's “desired state.”.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/)
3. Name (String) **Required** - A Kubernetes service is a logical abstraction for a deployed group of pods in a cluster (which all perform the same function). Since pods are ephemeral, a service enables a group of pods, which provide specific functions (web services, image processing, etc.) to be assigned a name and unique IP address (clusterIP).
[Learn More](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. Sudo (Boolean) **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: CLI - Get Pods
Return information on all pods in the kubernetes cluster, using kubectl.

### Parameters

1. Sudo (Boolean) **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: Get Service
Returns an array of services

### Service Account Permmisions
For this method to work the service account needs permmisions to read services.

### Parameters
1. Endpoint URL (String) **Optional** - The URL the cluster to connect to. If not provided will use endpoint URL from settings.
2. Certificate Authority (Vault) **Optional** - The CA certification of the cluster.
3. Service Account Token (Vault) **Optional** - The token of the service account that's configured on the required cluster.
4. Service Account Name (String) **Optional** - The name of the kaholo service account. 
5. Name (String) **Required** - The name of the service you want to get info about.
6. Namespace (String) **Optional** - The namespace of the object(s) to delete. Default vaule is "default".

## Method: Get All Services
Returns an array of services

### Service Account Permmisions
For this method to work the service account needs permmisions to read services.

### Parameters
1. Endpoint URL (String) **Optional** - The URL the cluster to connect to. If not provided will use endpoint URL from settings.
2. Certificate Authority (Vault) **Optional** - The CA certification of the cluster.
3. Service Account Token (Vault) **Optional** - The token of the service account that's configured on the required cluster.
4. Service Account Name (String) **Optional** - The name of the kaholo service account. 
5. Namespace (String) **Optional** - The namespace of the object(s) to delete. Default vaule is "default". Use "*" for all namespaces.
