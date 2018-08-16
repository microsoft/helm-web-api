const util = require('util');
const exec = util.promisify(require('child_process').exec);

const helmBinaryLocation = process.env.HELM_BINARY;
/** Since autom8s is installed via a Chart, init was already been called, no need to init again.
 * We are leaving this as a comment, in case someone will need to execute it when autom8s is
 * installed via yaml files
 */
// console.log('Initializing tiller with service account: ' + process.env.TILLER_SERVICE_ACCOUNT);
// exec(helmBinaryLocation + ' init --service-account ' + process.env.TILLER_SERVICE_ACCOUNT);

// Run once init client only (because tiller is already installed, see above)
console.log(`Initializing helm client. helm binary: ${helmBinaryLocation}`);
exec(`${helmBinaryLocation} init --client-only`);

class Helm {
  async install(deployOptions) {
    console.log(`Installing new chart. deployOptions: ${JSON.stringify(deployOptions)}`);
    const chartName = deployOptions.chartName.toLowerCase();
    const { releaseName } = deployOptions;
    let installCommand = `json install ${chartName}`;

    // sanity
    Helm._validateNotEmpty(chartName, 'chartName');

    if (releaseName !== undefined && releaseName != null && releaseName !== '') {
      console.log(`Installing specified release name: ${releaseName}`);
      installCommand = `${installCommand} --name ${releaseName.toLowerCase()}`;
    }

    console.log(`Install command: ${installCommand}`);
    return this._installOrUpgradeChart(installCommand, deployOptions)
      .then((responseData) => {
        if (responseData && responseData.error) {
          const errLog = `Install command failed: ${responseData.error}`;
          console.error(errLog);
          throw new Error(errLog);
        } else if (!responseData) {
          const errLog = 'Install command failed: empty response';
          console.error(errLog);
          throw new Error(errLog);
        } else {
          console.log('succesfully finished helm command');
          const json = JSON.parse(responseData.json);
          const svc = Helm._findFirstService(json);
          if (svc) {
            return {
              serviceName: svc,
              releaseName: json.releaseName,
            };
          }

          const errLog = `Install command returned unknown response: ${responseData.json}`;
          console.error(errLog);
          throw new Error(errLog);
        }
      });
  }

  async delete(delOptions) {
    const { releaseName } = delOptions;
    Helm._validateNotEmpty(releaseName, 'releaseName');

    console.log(`deleting release: ${releaseName}`);
    return this._executeHelm(`delete ${releaseName}`);
  }

  async upgrade(deployOptions) {
    const chartName = deployOptions.chartName.toLowerCase();
    const releaseName = deployOptions.releaseName.toLowerCase();

    Helm._validateNotEmpty(chartName, 'chartName');
    Helm._validateNotEmpty(releaseName, 'releaseName');

    const upgradeCommand = `upgrade ${releaseName} ${chartName}`;
    console.log(`upgrade command: ${upgradeCommand}`);
    return this._installOrUpgradeChart(upgradeCommand, deployOptions);
  }

  static _validateNotEmpty(arg, argName) {
    if (typeof arg === 'undefined' || arg === null || arg === '') {
      const errorMsg = `${argName} is required`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  static _findFirstService(json) {
    const service = json.resources.find(el => el.name.toLowerCase().includes('/service'));
    return (service && service.resources[0]) || null;
  }

  static _convertToBool(obj) {
    if (obj == null) {
      return false;
    }

    // will match one and only one of the string 'true','1', or 'on' regardless
    // of capitalization and regardless of surrounding white-space.
    //
    const regex = /^\s*(true|1|on)\s*$/i;

    return regex.test(obj.toString());
  }

  async _executeHelm(command, values = '') {
    console.log(`command: ${command}`);
    console.log(`values: ${values}`);
    const { stdout, stderr } = await exec(`${helmBinaryLocation} ${command}${values}`);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
    return { error: stderr, json: stdout };
  }

  static _getConfigValues(deployObject) {
    if (this.deployObject) {
      return '';
    }

    let configStr = '';
    for (const attribute in deployObject) {
      if (deployObject.hasOwnProperty(attribute)) {
        configStr += ` --set ${attribute}=${deployObject[attribute]}`;
      }
    }
    return configStr;
  }

  async _installOrUpgradeChart(command, deployOptions) {
    let updatedCmd = command;
    const chartName = deployOptions.chartName.toLowerCase();

    // when requesting install from a private repository,
    // helm repositories list must be updated first
    if (deployOptions.privateChartsRepo) {
      const tokens = chartName.split('/');
      // adds the private repo to helm known repos
      await this._executeHelm(`repo add ${tokens[0]} ${deployOptions.privateChartsRepo}`);
      // fetch the data from all known repos
      await this._executeHelm('repo update');
    }

    if (deployOptions.reuseValue !== undefined
      && Helm._convertToBool(deployOptions.reuseValue)) {
      updatedCmd += ' --reuse-values ';
    }

    // install the chart from one of the known repos
    return this._executeHelm(updatedCmd, Helm._getConfigValues(deployOptions.values));
  }
}

module.exports = Helm;
