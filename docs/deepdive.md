# How it works

## Helm as a service

Our approach is to take Helm and run it within the cluster, as a RESTful endpoint. We have created a Node.js server which receives clients commands as json, prepares the relevant Helm command and runs it immediately.
By leveraging Helm and running it as a containerized application within the cluster we were able to automate the process and gain easier control over the cluster with all the features of Helm such as packaging code and versioning of the deployment files.

## Expose as a service

When we publicly expose an app, the final result would be a public IP and Port endpoint.

In order to have multiple apps deployed using a single IP, we initially thought to use [Traefik](https://traefik.io/) as an ingress controller, however, at the time of writing, Traefik supported only HTTP protocol, while IoT devices use a plethora of protocols, such as TCP, UDP, MQTT and more. Enter [Nginx Ingress Controller](https://hub.kubeapps.com/charts/stable/nginx-ingress). nginx allows customizing the protocols, it had an official helm chart, which really made the [setup](https://medium.com/cooking-with-azure/tcp-load-balancing-with-ingress-in-aks-702ac93f2246) and management super easy.

After the app was installed, we had to find a simple way to choose a free external port. It appeared that kubernetes is not provisioning and managing ingress controller ports. Having no other solution, we implemented a simple port-allocator which finds an available port in the ingress controllers.

### How the automation works

It takes 2 steps:

1. Get an available port, using Port-Manager.
2. Configure the ingress controller, using Ingress-Manager.

Ingress rules are configured in the ingress controller. There could be several ingress controllers in the cluster.

The Port-Manager finds a free port on an Ingress Controller. If there are multiple Ingress Controllers, one of the ingress controller is selected by:

1. Specifying a namespace where the ingress controllers were deployed. The namespace is set in an Environment Variable called LoadBalancerNamespace.
2. Adding the appingress label to each ingress controller you would like to use with the Port-Manager, for better granularity. The value of the label is set in an Environment variable called IngressLabel .

Once all the applicable ingress controllers were found, the system will perform one of the followings:

1. Pick a random controller and find a free port.

    -or-

2. Pick the controller specified in the HTTP request by setting the lbip parameter in the query string.

For example: http://<automates-service-url>/getport?lbip=1.2.3.4

Finding a free port follows a simple pattern:

1. Get all currently-in-use ports by making an API call.
2. Iterate the desired port range to find a port not in use.
