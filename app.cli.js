const util = require("util");
const exec = util.promisify(require("child_process").exec);
const os = require("os");

function getsudo(settings) {
  return ((os.platform() === "linux") && settings.SUDO) ? "sudo" : "";
}

async function exposeDeployment(action, settings) {
  const { params } = action;
  const type = params.TYPE || "NodePort";
  const execString = `${getsudo(settings)} kubectl expose deployment ${params.DEPLOYMENT} --type=${type} --name=${params.NAME}`;
  return exec(execString);
}

async function getServices(action, settings) {
  const { params } = action;
  const execString = `${getsudo(settings)} kubectl get svc -n ${params.namespace} -o json`;
  const execResult = await exec(execString);
  try {
    return JSON.parse(execResult.stdout);
  } catch (err) {
    throw "Could not parse \"get svc\" output";
  }
}

async function getPods(action, settings) {
  const SUDO = getsudo(settings);
  const execString = ` ${SUDO} kubectl get pod`;
  const res = await exec(execString);
  if (!res.stdout.includes("READY")) {
    return Promise.resolve(res);
  }
  console.log(res.stdout);
  const spaces = /\s\s+/g;
  const resultsArr = res.stdout.split("\n", res.stdout.replace(/[^'\n']/g, "").length);
  const titles = resultsArr[0].split(spaces);
  const newResult = [];
  const newRow = {};
  for (let i = 1; i < resultsArr.length; i += 1) {
    const row = resultsArr[i].split(spaces);
    titles.forEach((title, index) => {
      newRow[title] = row[index];
    });
    newResult.push(newRow);
  }
  newResult.stdout = newResult;
  console.log("Output:");

  return Promise.resolve(newResult);
}

async function apply(action, settings) {
  const SUDO = getsudo(settings);
  const force = action.params.FORCE ? "--force" : "";
  const noOverwrite = action.params.NO_OVERWRITE ? "--overwrite=false" : "";
  const dryRun = action.params.DRY_RUN ? `--dry-run=${action.params.DRY_RUN.trim()}` : "";
  const args = [force, noOverwrite, dryRun].filter((arg) => arg);
  const execString = `${SUDO} kubectl apply -f ${action.params.FILE_PATH} ${args.join(" ")}`;
  return exec(execString);
}

module.exports = {
  cliExposeDeployment: exposeDeployment,
  cliGetPods: getPods,
  cliApply: apply,
  cliGetServices: getServices,
};
