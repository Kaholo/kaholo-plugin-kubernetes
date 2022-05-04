# kaholo-plugin-kubernetes
Kubernetes API plugin for Kaholo. This plugin provides two types of method to interact with Kubernetes.

The API methods work directly with Kubernetes using web services and includes the versatile "Apply" method, which like "kubectl apply" will apply a declarative YAML file, which can be used to accomplish nearly anything in Kubernetes. To use these, you need valid credentials in the form of kubernetes auth-provider access-token.

The CLI methods work by running kubectl directly on the Kaholo agent. This is useful if it is desireable to leave cluster credentials management to those administering the Kaholo agents. It aleviates the need for end users to deal with security-sensitive details at the cost of a little extra up-front work configuing kubectl on the agent(s).

## How To USE CLI methods
To use the CLI methods, you must first install kubectl on your agent and configure it correctly to connect to the desired kubernetes cluster. A simple test of this is to use the [command line plugin](https://github.com/Kaholo/kaholo-plugin-cmd) to run "kubectl config view". If kubectl is NOT installed, the error may be something like "/bin/sh: 1: kubectl: not found".

Instructions to download and install kubectl can be found in the [Kubernetes documentation website](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).

## How To Use API methods
To connect to your Kubernetes cluster using the API methods you need to create a Kubernetes service account with sufficent permmisions in your cluster. Then gather the following details:
* the cluster's endpoint URL (server), for example `https://35.247.173.104`
* the cluster's CA certificate (certificate-authority-data), base64 encoded into a single string
* a Kubernetes service account token (access-token) for a service account in the cluster, also encoded into a string.
* the name of your namespace(s), if not using the default one, which is named "default".

These are typically provided by your cluster administrator, available through various means from your cloud provider, by running `kubectl config view --raw` on an approriately configure client, or if you've created your own service account then by using `kubectl describe sa <account-name>` followed by `kubectl describe secret <token-name>`. If you do create your own service account do not forget to use `kubectl create clusterrolebinding` to grant it sufficient priviledges. Role `cluster-admin` provides complete access to the cluster.

You can find more information on creating service accounts [here](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/).

### Kaholo Vault Items ###
Both the CA certficate and the service account token come encoded as a string. Put them in the Kaholo vault in encoded form. They will not work if decoded. If you have been given a certificate that begins with "-----BEGIN CERTIFICATE-----", then used Linux command base64 to encode it back into a string.

##  Settings
1. Default Endpoint URL **Required for API methods** - The endpoint URL of the cluster, e.g. `https://35.247.173.104:443`
[Learn More](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
2. Default Certificate Authority (Vaulted) **Required for API methods** - The CA cert to use for TLS connect to the cluster, base64 encoded, e.g. `LS0tLS1CRUdJTiBD...` a very long string.
[Learn More](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
3. Default Service Account Token (Vaulted) **Required for API methods** - The service account token to use for authentication with the cluster, encoded, e.g. `ya29.c.b0AXv...` or `eyJhbGci...` also a very long string.
[Learn More](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
4. Default Service Account Name **Required for API methods** - The name of the kubernetes service account, e.g. `clusteruser1`
[Learn More](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
5. Sudo CLI commands **Optional for CLI methods** - If selected, run all CLI commands with the sudo command. Use this only if not using it fails.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: Apply
Creates or updates resources in Kubernetes using a declarative YAML file. Update means that if resources with the same name as the ones specified already exist, they will be deleted and re-created with the settings described in the YML File. Mimics the `kubectl apply` method.

### Service Account Permmisions
The types of resources you can create or update with this method will depend on the level of access granted to your service account. Compose your declarative YAML appropriately.

### Parameters
1. Endpoint URL **Required** - The endpoint URL of the cluster, e.g. `https://35.247.173.104:443`
[Learn More](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
2. Certificate Authority (Vault) **Required** - The CA cert to use for TLS connect to the cluster, base64 encoded, e.g. `LS0tLS1CRUdJTiBD...` a very long string.
[Learn More](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
3. Service Account Token (Vault) **Required** - The service account token to use for authentication with the cluster, encoded, e.g. `ya29.c.b0AXv...` or `eyJhbGci...` also a very long string.
[Learn More](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
4. Service Account Name **Required** - The name of the kubernetes service account, e.g. `clusteruser1`
[Learn More](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
5. Yaml File Path **Required** - Path to the YAML file to apply **on the agent**. For example `agentrepo/kubernetes/yaml/redis-service.yaml`. Files are typically put on the agent using the git plugin method `clone repo`. It is advisable to use the full path from root if known.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)
6. Namespace **Optional** - The default namespace is named 'default'. If additional namespaces are created they provide a logical division of the cluster into virtual realms where only users and resources in the common namespace interact with each other and all other objects are effectively invisible. While this is useful for large clusters, individuals and small teams typically just run everything in the default namespace. To list all namespaces run `kubectl get namespaces`.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

## Method: CLI - Apply
Create or update resources in Kubernetes, using the kubectl method Apply.

### Parameters
1. File Path **Required** - The path to the yml file to apply.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
2. Force **Optional** - If true, immediately remove resources from API and bypass graceful deletion. Default value is false.
[Learn More](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/)
3. Don't Overwrite **Optional** - Do not automatically resolve conflicts between the modified and live configuration by using values from the modified configuration.
[Learn More](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. Dry-run (Options) **Optional** - Dry run is not a concept exclusive to Kubernetes. It's an expression used to indicate a rehearsal of a performance or procedure before the real one. Dry run mode gives you the possibility of issuing a command without side effects for testing an actual command that you intend to run. Possible values: **none | server | client**
[Learn More](https://kubernetes.io/blog/2019/01/14/apiserver-dry-run-and-kubectl-diff/)
5. Sudo **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: Delete Object
Delete any kubernetes object by it's name, type and namespace.

### Service Account Permmisions
For this method to work the service account needs permmisions to delete the resource in the system.

### Parameters
1. Endpoint URL **Required** - The endpoint URL of the cluster, e.g. `https://35.247.173.104:443`
[Learn More](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
2. Certificate Authority (Vault) **Required** - The CA cert to use for TLS connect to the cluster, base64 encoded, e.g. `LS0tLS1CRUdJTiBD...` a very long string.
[Learn More](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
3. Service Account Token (Vault) **Required** - The service account token to use for authentication with the cluster, encoded, e.g. `ya29.c.b0AXv...` or `eyJhbGci...` also a very long string.
[Learn More](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
4. Service Account Name **Required** - The name of the kubernetes service account, e.g. `clusteruser1`
[Learn More](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
5. Types **Required** - The type(s) of object(s) you wish to delete, e.g. `pods`
[Learn More](https://kubernetes.io/docs/concepts/services-networking/service/)
6. Names **Required** - The name(s) of the resource(s) you wish to delete, e.g. `redis-6749d7bd65-5484q`
[Learn More](https://kubernetes.io/docs/concepts/services-networking/service/)
7. Namespace **Optional** - Specify the namespace name. Default namespace is 'default'.
[Learn More](https://kubernetes.io/docs/concepts/services-networking/service/)

## Method: CLI - Get Services
Get informattion on all services whuch match the specified criteria, using kubectl.

### Parameters
1. Sudo **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
2. Namespace **Optional** - If true only return services from the specified namespace.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

## Method: CLI - Expose Deployment
Createas a service object that exposes the specified deployment, using the kubectl ["kubectl expose"](https://jamesdefabia.github.io/docs/user-guide/kubectl/kubectl_expose/) method. 

### Parameters
1. Deployment **Required** - A Deployment runs multiple replicas of your application and automatically replaces any instances that fail or become unresponsive. In this way, Deployments help ensure that one or more instances of your application are available to serve user requests. Deployments are managed by the Kubernetes Deployment controller.
[Learn More](https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/)
2. Type **Required** - Kubernetes objects are entities that are used to represent the state of the cluster. An object is a “record of intent” – once created, the cluster does its best to ensure it exists as defined. This is known as the cluster's “desired state.”.
[Learn More](https://kubernetes.io/docs/concepts/overview/working-with-objects/)
3. Name **Required** - A Kubernetes service is a logical abstraction for a deployed group of pods in a cluster (which all perform the same function). Since pods are ephemeral, a service enables a group of pods, which provide specific functions (web services, image processing, etc.) to be assigned a name and unique IP address (clusterIP).
[Learn More](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. Sudo **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: CLI - Get Pods
Return information on all pods in the kubernetes cluster, using kubectl.

### Parameters

1. Sudo **Optional** - The sudo command allows you to run programs with the security privileges of another user (by default, as the superuser). It prompts you for your personal password and confirms your request to execute a command by checking a file, called sudoers , which the system administrator configures.
[Learn More](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## Method: Get Service
Returns an array of services

### Service Account Permmisions
For this method to work the service account needs permmisions to read services.

### Parameters
1. Endpoint URL **Optional** - The endpoint URL of the cluster, e.g. `https://35.247.173.104:443`
2. Certificate Authority (Vault) **Optional** - The CA cert to use for TLS connect to the cluster, base64 encoded, e.g. `LS0tLS1CRUdJTiBD...` a very long string.
3. Service Account Token (Vault) **Optional** - The service account token to use for authentication with the cluster, encoded, e.g. `ya29.c.b0AXv...` or `eyJhbGci...` also a very long string.
4. Service Account Name **Optional** - The name of the kubernetes service account, e.g. `clusteruser1` 
5. Name **Required** - The name of the service you want to get info about.
6. Namespace **Optional** - The namespace of the object(s) to delete. Default vaule is "default".

## Method: Get All Services
Returns an array of services

### Service Account Permmisions
For this method to work the service account needs permmisions to read services.

### Parameters
1. Endpoint URL **Optional** - The endpoint URL of the cluster, e.g. `https://35.247.173.104:443`
2. Certificate Authority (Vault) **Optional** - The CA cert to use for TLS connect to the cluster, base64 encoded, e.g. `LS0tLS1CRUdJTiBD...` a very long string.
3. Service Account Token (Vault) **Optional** - The service account token to use for authentication with the cluster, encoded, e.g. `ya29.c.b0AXv...` or `eyJhbGci...` also a very long string.
4. Service Account Name **Optional** - The name of the kubernetes service account, e.g. `clusteruser1` 
5. Namespace **Optional** - The namespace of the object(s) to delete. Default vaule is "default". Use "*" for all namespaces.
