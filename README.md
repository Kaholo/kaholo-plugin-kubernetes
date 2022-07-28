# Kaholo Kubernetes Plugin
[Kubernetes](https://kubernetes.io/), also known as K8s, is an open-source system for automating deployment, scaling, and management of containerized applications. Many implementation of Kubernetes are widely available, including Minikube and MicroK8s, which run even on notebook computers, and cloud platform implementation such as Amazon Elastic Kubernetes Service (EKS), Google Kubernetes Engine (GKE), and Azure Kubernetes Service (AKS).

Kaholo provides separate plugins for the creation of Kubernetes clusters in the cloud.
* [Kaholo GKE Plugin](https://github.com/Kaholo/kaholo-plugin-google-cloud-kubernetes-engine) - specifically for creating GKE Kubernetes clusters
* [AWS EKS Plugin](https://github.com/Kaholo/kaholo-plugin-aws-eks) - specifically for creating EKS Kuberenetes clusters
* [Azure CLI Plugin](https://github.com/Kaholo/kaholo-plugin-azure-cli), [AWS CLI Plugin](https://github.com/Kaholo/kaholo-plugin-aws-cli), and [GCP CLI Plugin](https://github.com/Kaholo/kaholo-plugin-gcp-cli) - general tools that could also be used to create Kubernetes clusters

Once a cluster has been created in any of these platforms, this Kubernetes plugin can then be used to manage Kubernetes applications on those clusters. There are two types of method in the plugin. Most make use of npm package [@kubernetes/client-node](), and method "Run Kubectl Command" makes use of docker image [bitnami/kubectl](https://hub.docker.com/r/bitnami/kubectl) to run `kubectl` commands.

## Use of Docker
Method "Run Kubectl Command" makes use of docker image [bitnami/kubectl](https://hub.docker.com/r/bitnami/kubectl) to run `kubectl` commands. This has many advantages but a few caveats as well of which the user should be aware.

If running your own Kaholo agents in a custom environment, you will have to ensure docker is installed and running on the agent and has sufficient privilege to retrieve the image and start a container. If the agent is already running in a container (kubernetes or docker) then this means a docker container running within another container.

The first time the plugin is used on each agent, docker may spend a minute or two downloading the image. After that the delay of starting up another docker image each time is quite small, only a second or two.

Next, because the `kubectl` command is running inside a docker container, it will not have access to the complete filesystem on the agent. This can impact certain commands such as `kubectl apply -f configuration.yaml` - because configuration.yaml is a file on the disk of the Kaholo Agent, not inside the docker image running the command. However it DOES mount a volume for the Kaholo Agent's working directory, which is /usr/src/app/workspace. If your files are inside this directory they can be accessed by the `kubectl` command.

For example, using the Kaholo Git plugin, you have cloned a repository named kubeconfigs such that the application configuration is in file `/usr/src/app/workspace/kubeconfigs/myapp/myapp-kube.yaml`. If you then use method "Run Kubectl Command" and provide command `kubectl apply -f kubeconfigs/myapp/myapp-kube.yaml`, then the command will execute properly.

## Access and Authentication
Kubernetes relies on three parameters for Access and Authentication. These are stored in a Kaholo Account, which can then be easily reused for any Kuberenetes plugin Action or related ones such as Helm.

The Kaholo Account contains these parameters:
* Cluster CA Certificate: `LS0tLS1CRUd...very long string...FLS0tLS0K`
* API Server Endpoint: `https://34.116.131.193`
* Service Account Token: `eyJhbGciOiJ...very long string...JK3RGEpfDA`

Note: Some implementations of Kubernetes will provide the CA certificate in standard multiline PEM format that starts with `-----BEGIN CERTIFICATE-----`. The Kubernetes plugin can make use of either this or the Base64 format normally seen in kubectl output. (`kubectl config view --raw`)

>Careful!
>
>When copying very long Base64 strings, a common problem is for word-wrap features to result in newline characters inserted into the copy. When pasted in this condition authentication will fail. To avoid this, turn word-wrap off before copying or otherwise ensure you have copied a single one-line string. When you then paste into the Kaholo Account or Kaholo Vault it will get word-wrapped again, but this is normal and harmless.

## Namespaces
Kubernetes makes use of namespaces to provide a secure multi-tenant functionality in which accounts can be restricted to work within specific namespaces and have no visibility or access to others. This also provides a convenient way to organize pods in groups, e.g. by product group or organization or to separate test environments from each other.

Some kubernetes objects exist only at cluster level, i.e. they have no namespace - for example namespaces themselves. In this case, you may specify a namespace anyway or leave the parameter empty and it has no effect on the outcome.

It is possible to specify namespace in as many as three different and even conflicting ways. This generally produces no error, however ultimately only one namespace will be used. If no namespace is specified at all, kubernetes uses the "default" namespace, i.e. a namespace named `default`.

## Method Apply
This method applies a kubernetes configuration in the form of a YAML document. This is the equivalent to command `kubectl apply -f filename.yaml`.

Here's an example YAML configuration file that specifies a redis pod named redis-server:

    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: redis-server
    labels:
        app: redis-server
    spec:
    selector:
        matchLabels:
        app: redis-server
    replicas: 1
    template:
        metadata:
        labels:
            app: redis-server
        spec:
        containers:
            - name: redis-server
            image: redis
            imagePullPolicy: IfNotPresent
            ports:
            - containerPort: 6379

Note that his example contains no specification of namespace.

### Parameter: YAML File Path
This is the path to the YAML file (on the Kaholo Agent) that contains the kubernetes configuration you wish to apply.

### Parameter: Namespace
This is the namespace in which to apply the YAML. If the YAML already contains namespace you may leave the parameter empty. If the parameter has a conflicting namespace, the one specified in the YAML takes precedence. If neither the parameter nor the YAML specify namespace, the `default` namespace will be used.

## Method: Delete Objects
This method deletes any of several classes of kubernetes objects.
### Parameter: Objects Map
This parameter is for `<object_type> <object_name>` space-separated pairs. For example to delete a pod named redis and a service named redis-server, the parameter should contain:

    pod redis
    service redis-server

### Parameter: Namespace
This is the namespace of the objects you wish to delete, if they are objects within a namespace other than `default`. For objects at cluster level, this parameter has no effect.

## Method: Get Service
This method retrieves the details of any one service.

### Parameter: Service
This is the name of the service for which to get the details.

### Parameter: Namespace
This is the namespace in which the service exists. If left empty the `default` namespace is assumed.

## Method: Get All Services
This method retrieves a list of all services, with an optional filter.

### Parameter: Labels Filter
This is for optional key=value pairs. Only services with labels matching the filter will be retrieved. For example if your service is labeled like so:

            "labels": {
                "app": "redis-server"
            },

Then to select this service use Labels Filter `app=redis-server`.

### Parameter: Namespace
This is the namespace in which to list services. If left empty the `default` namespace is assumed.

## Method: Run Kubectl Command
This method runs any `kubectl` command.

### Parameter: Command
The command you wish to run. Only kubectl may be run with this method. To run other types of command, use the Command Line Plugin instead. A few example commands:

    kubectl get namespaces
    kubectl get pods --all-namespaces
    kubectl delete -f filename.yaml
    kubectl config view
    kubectl version

### Parameter: Namespace
The namespace given here is put in the kubectl configuration so that the command doesn't require the `--namespace` option, as a convenience. If the command contains `--namespace` anyway, the namespace specified in the command overrides the namespace in the parameter.

If no namespace is given in the command or the parameter, the `default` namespace will be assumed.

If using `kubectl apply -f` with a YAML file, the namespace in the YAML overrides both `--namespace` in the command or any namespace specified in this parameter.