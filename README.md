
# Helm Charts installation through http endpoints

## Enabling applications in your Kubernetes cluster to programmatically install helm charts and expose them through a single public facing IP

The solution exposes web endpoint which provides the Helm functionalities of Install, Delete and Upgrade charts, as well as automatically configure the ingress controller to expose them to the internet all within a single public IP.
The solution we propose consists of two parts, both as web servers:

**Helm charts deployer**: let developers install, delete and upgrade helm charts from inside the cluster, using a simple REST API.

**Ingress rule setter**: expose installed helm charts to the internet, via a single IP.

### When to use this solution

* Automating deployments in the cluster.
* Programmatically managing the cluster from the code.

### Requirements

* Kubernetes 1.9+ with RBAC enabled.
* Helm

### Installation

1. Install [Helm](https://github.com/kubernetes/helm) with [RBAC](https://github.com/kubernetes/helm/blob/master/docs/rbac.md#tiller-and-role-based-access-control)

     Make sure to grant tiller sufficient permissions to run helm inside the cluster, and install the Autom8s Chart.
    The example below will configure helm and tiller to work with the chart's default values. Execute the following lines if using the default chart values:
    ```bash
    kubectl apply -f https://raw.githubusercontent.com/Microsoft/Automation-for-K8S/master/rbac-example/tiller.yaml

    helm init --service-account tiller
    ```
2. Clone the repository
    * [Build and push](https://docs.docker.com/docker-cloud/builds/push-images/) the image into a docker repository

    ```bash
    docker build -t registryname/autom8s .
    docker push registryname/autom8s
    ```

    * Edit the [values.yaml](./chart/autom8s/values.yaml) file to point to the newly published image and registry

3. Install the Autom8s chart

    ```bash
    helm install chart/autom8s --name autom8s --set rbac.create=true
    ```

4. Call autom8s and install `nginx-ingress-controller`, to expose other helm charts via a single public IP:

    ```bash
    curl -d '{"chartName":"stable/nginx-ingress", "releaseName":"myingress"}' -H "Content-Type: application/json" -X POST http://<autom8s-ip>:4000/install
    ```

5. Label each ingress controller. This is required, since this is our way of telling the system, which IPs to use:

    ```bash
    kubectl label service myingress-nginx-ingress-controller appingress=ingress
    ```

Now you have a working Autom8s API awaiting HTTP requests.

## Using the API

If you used the default settings, the API will be accessible internally at: `http://autom8s.default.svc.cluster.local:4000`

Here is a quick node.js snippet that makes use of the API to install RabbitMQ with default settings.

Note: any chart will be suitable, RabbitMQ is just a specific example:

```js
let chart = { name: "stable/rabbitmq", servicePort: 5672 };

// perform helm install
var installResponse = await requestPostAsync(Paths.HelmInstall, { form: { chartName: "" } });

// create a rule to expose the new service expternally
var ingressResponse = await requestGetAsync(Paths.SetIngressRule, { serviceName: installResponse.serviceName, servicePort: chart.servicePort });

return `Your new service: ${ingressResponse.releaseName}, is publicly accessible on ${ingressResponse.ip}:${ingressResponse.port}`;
```

For example, installig a chart from a private repository is done by sending the following json to the exposed endpoint:

```json
{
  "chartName":"sampleApp",
  "releaseName":"sampleApp1",
  "privateChartsRepo": "https://raw.githubusercontent.com/username/helm_repo/master/index.yaml"
}
```

In most cases the deployed chart will be a private one, which makes sense to be deployed on demand, for example a service which adds support for a new format of requests. However, public charts are fully supported (remove the 'privateChartsRepo' key-value).

## API Documentation

Check out the API documentation [here](./docs/api.md)

## How it works

Feel free to read the extended summary [here](./docs/deepdive.md)

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.