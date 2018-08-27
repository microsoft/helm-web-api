const PortsAllocator = require('./ports-allocator');
const Helm = require('./helm');

class IngressManager {
  constructor(helm, portsAllocator) {
    if (typeof helm === 'undefined' || helm === null) {
      this.helmClient = new Helm();
    } else {
      this.helmClient = helm;
    }

    if (typeof portsAllocator === 'undefined' || portsAllocator === null) {
      this.portsAllocatorClient = new PortsAllocator();
    } else {
      this.portsAllocatorClient = portsAllocator;
    }
  }

  async setRule(serviceName, servicePort, port, lb, release) {
    let ipPortRelease;
    // if user requested specific values, allow them
    if (typeof lb !== 'undefined' && lb
    && typeof port !== 'undefined' && port
    && typeof release !== 'undefined' && release) {
      ipPortRelease = { ip: lb, port, release };
    }

    ipPortRelease = await this._getIpPortRelease(
      port, lb, release,
    );

    console.log(`Ingress port response: ${JSON.stringify(ipPortRelease)}`);
    // prepare data to post
    const tcp = `tcp.${ipPortRelease.port}`;
    const optionalValues = {};
    optionalValues[tcp] = `${serviceName}:${servicePort}`;

    // To create a rule we look for the nginx-ingress release and add additional
    // values to that release using the 'reuse' flag
    const upgradeOptions = {
      chartName: 'stable/nginx-ingress',
      reuseValue: true,
      releaseName: ipPortRelease.release,
      values: optionalValues,
    };

    // send the data to the helm service
    console.log(`Ingress Calling helm upgrade. given options: ${JSON.stringify(upgradeOptions)}`);
    const upgradeResponse = await this.helmClient.upgrade(upgradeOptions);
    console.log(`Ingress Helm upgrade repsonse: ${JSON.stringify(upgradeResponse)}`);
    return {
      ip: ipPortRelease.ip,
      port: ipPortRelease.port,
      releaseName: ipPortRelease.release,
    };
  }

  async _getIpPortRelease() {
    // get free port/ip/release
    console.log('Ingress Calling get port');
    const data = await this.portsAllocatorClient.getPort();
    const ip = data.public_ip;
    const { port } = data;
    const { release } = data;

    return { ip, port, release };
  }
}


module.exports = IngressManager;
