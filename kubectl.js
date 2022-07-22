const util = require("util");
const exec = util.promisify(require("child_process").exec);
const {
  docker,
} = require("@kaholo/plugin-library");

const {
  generateRandomString,
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

  const shellEnvironmentalVariables = {};
  shellEnvironmentalVariables[environmentalVariablesNames.kubeCertificate] = kubeCertificate;
  shellEnvironmentalVariables[environmentalVariablesNames.kubeToken] = kubeToken;
  shellEnvironmentalVariables[environmentalVariablesNames.kubeApiServer] = kubeApiServer;
  shellEnvironmentalVariables[environmentalVariablesNames.namespace] = namespace;

  const clusterName = `cluster_${generateRandomString()}`;
  const userName = `user_${generateRandomString()}`;
  const contextName = `context_${generateRandomString()}`;

  // TODO Check if KUBECONFIG is set and reuse it if it is
  // First command doesn't need kubectl prefix
  const aggregatedCommand = `\
sh -c "\
kubectl config set-cluster ${clusterName} --server=$${environmentalVariablesNames.kubeApiServer} && \
kubectl config set clusters.${clusterName}.certificate-authority-data $${environmentalVariablesNames.kubeCertificate} && \
kubectl config set-context ${contextName} --cluster=${clusterName} --user=${userName} --namespace=$${environmentalVariablesNames.namespace} && \
kubectl config set current-context ${contextName} && \
kubectl config set-credentials ${userName} --token=$${environmentalVariablesNames.kubeToken} && \
${sanitizeCommand(usersCommand)}\
"`;

  const dockerCommand = docker.buildDockerCommand({
    command: aggregatedCommand,
    image: KUBECTL_IMAGE_NAME,
    additionalArguments: ["--entrypoint", "\"\""], // ignores default entrypoint and allows to call any command
  });

  //console.log("EXECUTING", dockerCommand, JSON.stringify(shellEnvironmentalVariables));

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
