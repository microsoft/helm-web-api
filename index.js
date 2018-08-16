const express = require('express');
const bodyParser = require('body-parser');
const Helm = require('./autom8s/helm');
const PortsAllocator = require('./autom8s/ports-allocator');
const IngressManager = require('./autom8s/ingress-manager');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Helm functionallity

/**
 * Installs the requested chart into the Kubernetes cluster
 */
app.post('/install',
  async (req, res) => {
    const deployOptions = req.body;

    const helm = new Helm();
    await helm.install(deployOptions)
      .then((installResponse) => {
        res.send({
          status: 'success',
          serviceName: installResponse.serviceName,
          releaseName: installResponse.releaseName,
        });
      }).catch((err) => {
        console.error(`Chart installation failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: 'Installation failed.',
        });
      });
  });

/**
 * Deletes an already installed chart, identified by its release name
 */
app.post('/delete',
  async (req, res) => {
    const delOptions = req.body;
    const helm = new Helm();
    await helm.delete(delOptions)
      .then(() => {
        res.send({
          status: 'success',
        });
      }).catch((err) => {
        console.error(`Chart deletion failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: 'Installation failed.',
        });
      });
  });

/**
 * Upgrades an already installed chart, identified by its release name
 */
app.post('/upgrade',
  async (req, res) => {
    const deployOptions = req.body;
    const helm = new Helm();
    await helm.upgrade(deployOptions)
      .then(() => {
        res.send({
          status: 'success',
        });
      }).catch((err) => {
        console.error(`Chart upgrade failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: 'Installation failed.',
        });
      });
  });

// Ports allocator functionallity

/**
 * Get a single unused port in the ingress controller
 */
app.get('/getPort',
  async (req, res, next) => {
    const portService = new PortsAllocator();
    const { lbip } = req.body;

    await portService.getPort(lbip)
      .then((data) => {
        res.send(data);
      })
      .catch(next);
  });

// Ingress controller functionallity

/**
 * Sets an inbound rule in the ingress controller, to expose a service endpoint
 */
app.post('/setrule',
  async (req, res) => {
    // init params
    const {
      serviceName,
      servicePort,
      loadBalancerIp,
      loadBalancerPort,
      release,
    } = req.body;

    const ingressManager = new IngressManager();
    await ingressManager.setRule(
      serviceName, servicePort, loadBalancerPort, loadBalancerIp, release,
    )
      .then((response) => {
        res.send({
          status: 'success',
          ip: response.ip,
          port: response.port,
          releaseName: response.releaseName,
        });
      })
      .catch((err) => {
        console.error(`Setting rule failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: 'Failed setting rule',
        });
      });
  });

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.set('port', process.env.PORT || 4000);

const server = app.listen(app.get('port'), () => {
  console.log(`Server listening on port ${server.address().port}`);
});
