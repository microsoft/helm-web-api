# Sample - Helm Charts automation using http endpoints

## prerequisites
1. Create a Kubernetes cluster
2. Install the Helm automation container. Installation instructions [here](../README.md).
3. Get the automation service external url by running
```bash
kubectl get services
```

## Usage
1. Set needed environment variable:
```bash
export SERVICE_URL=<service_ip>
```
2. Run locally using
```bash
node index.js
```
3. Trigger a GET command to the following url:
localhost:4001/test

A new RabbitMQ container should be installed on the cluster with an exposed port on the already existing ingress controller.