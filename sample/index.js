const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const request = require('request');

const requestPostAsync = util.promisify(request.post);

const autom8sUrl = process.env.SERVICE_URL;
const Paths = {
  HelmInstall: `http://${autom8sUrl}:4000/install`,
  SetIngressRule: `http://${autom8sUrl}:4000/setrule`,
};

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('port', process.env.PORT || 4001);

const server = app.listen(app.get('port'), () => {
  console.log(`Server listening on port ${server.address().port}`);
});

async function InstallChart(chart) {
  try {
    // perform helm install
    let installResponse = await requestPostAsync(
      Paths.HelmInstall, { form: { chartName: chart.name } },
    );

    console.log(`install response: ${installResponse.body}`);
    installResponse = JSON.parse(installResponse.body);

    // create a rule to expose the new service expternally
    console.log(`using serviceName: ${installResponse.serviceName} and servicePort: ${chart.servicePort}`);
    let ingressResponse = await requestPostAsync(
      Paths.SetIngressRule,
      { form: { serviceName: installResponse.serviceName, servicePort: chart.servicePort } },
    );
    ingressResponse = JSON.parse(ingressResponse.body);

    if (ingressResponse.status === 'success') {
      return `Your new service: ${ingressResponse.releaseName}, is publicly accessible on ${ingressResponse.ip}:${ingressResponse.port}`;
    }

    return `failed: ${ingressResponse.reason}`;
  } catch (error) {
    console.log(error);
    return 'failed';
  }
}

app.use('/test',
  async (req, res) => {
    const chart = { name: 'stable/rabbitmq', servicePort: 5672 };
    const installChartResult = await InstallChart(chart);
    res.send(installChartResult);
  });
