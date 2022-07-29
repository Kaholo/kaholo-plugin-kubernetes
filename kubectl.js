const util = require("util");
const exec = util.promisify(require("child_process").exec);
const path = require("path");
const {
  docker,
} = require("@kaholo/plugin-library");

const {
  generateRandomString,
  convertCertificateToBase64,
} = require("./helpers");

const KUBECTL_IMAGE_NAME = "bitnami/kubectl";

const environmentalVariablesNames = {
  kubeCertificate: "KUBE_CERT",
  kubeToken: "KUBE_TOKEN",
  kubeApiServer: "KUBE_API_SERVER",
  namespace: "KUBE_NAMESPACE",
};

async function runCommand(params) {
  const {
    kubeCertificate,
    kubeToken,
    kubeApiServer,
    command: usersCommand,
    namespace,
  } = params;

  const validatedCertificate = convertCertificateToBase64(kubeCertificate);

  const shellEnvironmentalVariables = {};
  shellEnvironmentalVariables[environmentalVariablesNames.kubeCertificate] = validatedCertificate;
  shellEnvironmentalVariables[environmentalVariablesNames.kubeToken] = kubeToken;
  shellEnvironmentalVariables[environmentalVariablesNames.kubeApiServer] = kubeApiServer;
  if (namespace) {
    shellEnvironmentalVariables[environmentalVariablesNames.namespace] = namespace;
  }

  const clusterName = `cluster_${generateRandomString()}`;
  const userName = `user_${generateRandomString()}`;
  const contextName = `context_${generateRandomString()}`;

  const workingDirectoryVolumeDefinition = docker.createVolumeDefinition(path.resolve("./"));
  // eslint-disable-next-line max-len
  shellEnvironmentalVariables[workingDirectoryVolumeDefinition.path.name] = workingDirectoryVolumeDefinition.path.value;
  // eslint-disable-next-line max-len
  shellEnvironmentalVariables[workingDirectoryVolumeDefinition.mountPoint.name] = workingDirectoryVolumeDefinition.mountPoint.value;

  // TODO Check if KUBECONFIG is set and reuse it if it is
  const namespaceParam = namespace ? `--namespace=$${environmentalVariablesNames.namespace}` : "";
  // First command doesn't need kubectl prefix
  const aggregatedCommand = `\
sh -c "\
kubectl config set-cluster ${clusterName} --server=$${environmentalVariablesNames.kubeApiServer} >/dev/null && \
kubectl config set clusters.${clusterName}.certificate-authority-data $${environmentalVariablesNames.kubeCertificate} >/dev/null  && \
kubectl config set-context ${contextName} --cluster=${clusterName} --user=${userName} ${namespaceParam} >/dev/null && \
kubectl config set current-context ${contextName} >/dev/null && \
kubectl config set-credentials ${userName} --token=$${environmentalVariablesNames.kubeToken} >/dev/null && \
${sanitizeCommand(usersCommand)}\
"`;

  const dockerCommand = docker.buildDockerCommand({
    command: aggregatedCommand,
    image: KUBECTL_IMAGE_NAME,
    additionalArguments: ["--entrypoint", "\"\""], // ignores default entrypoint and allows to call any command
    volumeDefinitionsArray: [workingDirectoryVolumeDefinition],
    workingDirectory: `$${workingDirectoryVolumeDefinition.mountPoint.name}`,
  });

  const {
    stdout,
    stderr,
  } = await exec(dockerCommand, {
    env: shellEnvironmentalVariables,
  });

  if (stderr && !stdout) {
    throw stderr;
  }

  return stdout;
}

function sanitizeCommand(command) {
  return command.startsWith("kubectl") ? command : `kubectl ${command}`;
}

module.exports = {
  runCommand,
};
