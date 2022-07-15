const util = require("util");
const exec = util.promisify(require("child_process").exec);

const KUBECTL_IMAGE_NAME = "bitnami/kubectl";

async function runCommand(params) {
  //TODO Check if KUBECONFIG is set and reuse it if it is
  const command = "docker run --rm ";

  return exec(command);
}

module.exports = {
  runCommand,
};
