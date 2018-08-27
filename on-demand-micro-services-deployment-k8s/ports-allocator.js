const { Client, config } = require('kubernetes-client');

class PortsAllocator {
  constructor(kubeClient) {
    // setup an API client
    let client = kubeClient;
    if (typeof client === 'undefined' || client === null) {
      try {
        // assuming we are in the pod, try get the credentials from account service
        client = new Client({ config: config.getInCluster() });
      } catch (e) {
        // we must be debugging locally, than pickup credentials from kube config
        client = new Client({ config: config.fromKubeconfig() });
      }
    }
    this.specLoaded = false;
    this.client = client;

    // gather settings to operate
    this.settings = {
      LoadBalancerNamespace: process.env.LOAD_BALANCER_NAMESPACE || 'default',
      IngressLabel: process.env.INGRESS_LABEL || '',
      PortMin: process.env.PORT_MIN || '20000',
      PortMax: process.env.PORT_MAX || '30000',
    };
  }

  async getPort(lbip) {
    if (!this.specLoaded) {
      console.log('Loading spec');
      await this.client.loadSpec();
      this.specLoaded = true;
    }

    // make an API call for all services in the given namespace
    const self = this;
    console.log('Getting port');
    return this.client.api.v1.namespaces(this.settings.LoadBalancerNamespace).services.get()
      .then(function (services) {
        // select only load balancers
        const LoadBalancers = self._getLoadBalancersByLabel(services);
        console.log(`Found ${LoadBalancers.length} Load balancers`);
        if (LoadBalancers.length === 0) {
          // exit with error
          return { error: `Could not find any load balancers in namepspace: ${this.settings.LoadBalancerNamespace}` };
        }

        // prepare the load balancer to work with.
        let service = null;

        // If a specific LoadBlanacer was requested by IP
        if (lbip !== undefined && lbip !== '') {
          service = PortsAllocator._getLoadBalancerByIP(LoadBalancers, lbip);
        } else {
          // Else, In order to allocate a free port evenly from the load balancers,
          // select a random one.
          service = PortsAllocator._getRandomLoadBalancer(LoadBalancers);
        }

        if (service === null) {
          // exit with error
          return { error: 'Could not allocate load balancer' };
        }

        console.log('Attempting to find a free port');
        const freePort = self._getFreePort(service);
        const response = {
          public_ip: service.status.loadBalancer.ingress[0].ip,
          port: freePort,
          release: service.spec.selector.release,
        };
        console.log(JSON.stringify(response));
        return response;
      });
  }

  static _getLoadBalancerByIP(LoadBalancers, IP) {
    return LoadBalancers.filter(lb => lb.status.loadBalancer.ingress[0].ip === IP);
  }

  static _getRandomLoadBalancer(LoadBalancers) {
    const randomServiceIndex = Math.floor((Math.random() * LoadBalancers.length) + 0);
    return LoadBalancers[randomServiceIndex];
  }

  _getFreePort(service) {
    const portsInUse = [];

    service.spec.ports.forEach((portItem) => {
      portsInUse.push(portItem.port);
    });

    // start searching for a free port
    let currentPort = parseInt(this.settings.PortMin, 10);
    const max = parseInt(this.settings.PortMax, 10);

    while (currentPort <= max && portsInUse.includes(currentPort)) {
      // while in ports
      currentPort += 1;
    }
    return currentPort;
  }

  _getLoadBalancersByLabel(services) {
    // select only load balancers
    const LoadBalancers = [];
    services.body.items.forEach((service) => {
      if (service.spec.type === 'LoadBalancer') {
        // match to label if applicable
        if (this.settings.IngressLabel != null && this.settings.IngressLabel !== '') {
          for (const key in service.metadata.labels) {
            // we are looking for a pre-defined label call appingress,
            // having a value setup in env variable
            if (key === 'appingress' && service.metadata.labels[key] === this.settings.IngressLabel) {
              LoadBalancers.push(service);
            }
          }
        } else {
          // if no labels are defined, than take load balancers
          LoadBalancers.push(service);
        }
      }
    });

    return LoadBalancers;
  }

  static _listPorts(LoadBalancers) {
    const list = [];
    LoadBalancers.forEach((service) => {
      service.spec.ports.forEach((portItem) => {
        list.push({
          external_port: portItem.port,
          node_port: portItem.nodePort,
          protocol: portItem.protocol,
          name: portItem.name,
          public_ip: service.status.loadBalancer.ingress[0].ip,
          release: service.spec.selector.release,
        });
      });
    });
    return list;
  }
}

module.exports = PortsAllocator;
