# API documentation

Here are the available endpoints of the API:

## /install

| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| install | POST | install a helm chart | json |

### Paramaters

| Name | Description | Optional|
| ---  | ----         | ----        |
| chartName | name of the chart | required |
| releaseName | set the release name. If not present, helm will generate one for you. | optional |
| privateChartsRepo | a URL to your own custom repo. Credentials may be incorporated in the URL in the form of: `https://user:token@domain/git/repo/path` | optional |
| values | a key-value object of values to set | optional |
---

## /upgrade

| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| upgrade | POST | upgrade a helm release | json |

### Paramaters

| Name | Description | Optional|
| ---  | ----         | ----        |
| chartName | name of the chart | required |
| releaseName | the release name to upgrade | required |
| reuseValue | should the upgrade override values or append | optional |

---

## /delete

| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| upgrade | POST | delete a helm release | json |

### Paramaters

| Name | Description | Optional|
| ---  | ----         | ----        |
| releaseName | the release name to delete | required |

---

## /setrule

| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| setrule | POST | create an ingress rule | json |

### Paramaters

| Name | Description | Optional|
| ---  | ----         | ----        |
| serviceName | the name of the installed service to expose | required |
| servicePort | the internal port of the installed service to expose | required |
| loadBalancerIp | a specific IP to use. If not specified, a random load balancer IP will be selected | optional |
| loadBalancerPort | a specific port to use. If not specified, a random port will be selected | optional |
| release | a specific load balancer release to use. If not specified, a random load balancer will be selected | optional |
