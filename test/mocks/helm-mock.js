const Helm = require('../../autom8s/helm');

class HelmMock extends Helm {
  async _executeHelm(command, values = '') {
    return { error: '', json: '{ data:1 }' };
  }
}

module.exports = HelmMock;
