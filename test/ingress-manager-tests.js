var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should(); 
var HelmMock = require('./mocks/helm-mock');
var PortsAllocator = require('../autom8s/ports-allocator');
var IngressManager = require('../autom8s/ingress-manager');

describe('Ctor', function () {
    it('instance is created', function () {
        var im = new IngressManager();
        assert.notEqual(im, null);
    });
});

describe('set rule', function () {
    it('set rule success', async function () {
        
        const helmMock = new HelmMock();
        const portsAllocator = new PortsAllocator(new ClientMock());
        portsAllocator.settings.IngressLabel = "ingress";
        var im = new IngressManager(helmMock, portsAllocator);
        
        //act
        var res = await im.setRule("serviceNameA","123");
        assert.equal(res.ip, '51.140.40.209');
        assert.equal(res.port, '20000');
        assert.equal(res.releaseName, 'open-joey');
    });

    it('get ip port release', async function () {
        
        const helmMock = new HelmMock();
        const portsAllocator = new PortsAllocator(new ClientMock());
        portsAllocator.settings.IngressLabel = "ingress";
        var im = new IngressManager(helmMock, portsAllocator);
        
        //act
        var res = await im._getIpPortRelease();
        assert.equal(res.ip, '51.140.40.209');
        assert.equal(res.port, '20000');
        assert.equal(res.release, 'open-joey');
    });
});

class ClientMock{
    constructor() {
        this.getExistingPorts = { "statusCode": 200, "body": { "kind": "ServiceList", "apiVersion": "v1", "metadata": { "selfLink": "/api/v1/namespaces/default/services", "resourceVersion": "833102" }, "items": [ { "metadata": { "name": "open-joey-nginx-ingress-controller", "namespace": "default", "selfLink": "/api/v1/namespaces/default/services/open-joey-nginx-ingress-controller", "uid": "3b19ef3c-8454-11e8-bf13-0a58ac1f0c0f", "resourceVersion": "716435", "creationTimestamp": "2018-07-10T15:16:33Z", "labels": { "app": "nginx-ingress", "appingress": "ingress", "chart": "nginx-ingress-0.22.1", "component": "controller", "heritage": "Tiller", "release": "open-joey" } }, "spec": { "ports": [ { "name": "20007-tcp", "protocol": "TCP", "port": 20007, "targetPort": "20007-tcp", "nodePort": 30228 } ], "selector": { "app": "nginx-ingress", "component": "controller", "release": "open-joey" }, "clusterIP": "10.0.135.14", "type": "LoadBalancer", "sessionAffinity": "None", "externalTrafficPolicy": "Cluster" }, "status": { "loadBalancer": { "ingress": [ { "ip": "51.140.40.209" } ] } } }, { "metadata": { "name": "open-joey-nginx-ingress-default-backend", "namespace": "default", "selfLink": "/api/v1/namespaces/default/services/open-joey-nginx-ingress-default-backend", "uid": "3b274c47-8454-11e8-bf13-0a58ac1f0c0f", "resourceVersion": "17726", "creationTimestamp": "2018-07-10T15:16:33Z", "labels": { "app": "nginx-ingress", "chart": "nginx-ingress-0.22.1", "component": "default-backend", "heritage": "Tiller", "release": "open-joey" } }, "spec": { "ports": [ { "name": "http", "protocol": "TCP", "port": 80, "targetPort": "http" } ], "selector": { "app": "nginx-ingress", "component": "default-backend", "release": "open-joey" }, "clusterIP": "10.0.113.141", "type": "ClusterIP", "sessionAffinity": "None" }, "status": { "loadBalancer": {} } }, { "metadata": { "name": "kubernetes", "namespace": "default", "selfLink": "/api/v1/namespaces/default/services/kubernetes", "uid": "7c29c3a8-843b-11e8-bf13-0a58ac1f0c0f", "resourceVersion": "30", "creationTimestamp": "2018-07-10T12:19:25Z", "labels": { "component": "apiserver", "provider": "kubernetes" } }, "spec": { "ports": [ { "name": "https", "protocol": "TCP", "port": 443, "targetPort": 443 } ], "clusterIP": "10.0.0.1", "type": "ClusterIP", "sessionAffinity": "ClientIP", "sessionAffinityConfig": { "clientIP": { "timeoutSeconds": 10800 } } }, "status": { "loadBalancer": {} } }, { "metadata": { "name": "web-server", "namespace": "default", "selfLink": "/api/v1/namespaces/default/services/web-server", "uid": "5501b104-843e-11e8-bf13-0a58ac1f0c0f", "resourceVersion": "2765", "creationTimestamp": "2018-07-10T12:39:48Z", "labels": { "app": "web-server" }, "annotations": { "kubectl.kubernetes.io/last-applied-configuration": "{\"apiVersion\":\"v1\",\"kind\":\"Service\",\"metadata\":{\"annotations\":{},\"labels\":{\"app\":\"web-server\"},\"name\":\"web-server\",\"namespace\":\"default\"},\"spec\":{\"ports\":[{\"nodePort\":30101,\"port\":4000,\"protocol\":\"TCP\"}],\"selector\":{\"app\":\"web-server\"},\"type\":\"LoadBalancer\"}}\n" } }, "spec": { "ports": [ { "protocol": "TCP", "port": 4000, "targetPort": 4000, "nodePort": 30101 } ], "selector": { "app": "web-server" }, "clusterIP": "10.0.120.163", "type": "LoadBalancer", "sessionAffinity": "None", "externalTrafficPolicy": "Cluster" }, "status": { "loadBalancer": { "ingress": [ { "ip": "137.117.197.115" } ] } } } ] } }; //'[ { "external_port": 80, "node_port": 30805, "protocol": "TCP", "name": "http", "public_ip": "51.140.40.209", "release": "open-joey" }, { "external_port": 4000, "node_port": 30101, "protocol": "TCP", "public_ip": "137.117.197.115" } ]';
        this.api = {};
        this.api.v1 = {};
        var self = this;
        this.api.v1.namespaces = function(txt){ return { 
            services:{
                get: function(){
                    return new Promise(function(resolve){
                        resolve(self.getExistingPorts);
                    });
                }
            }}};
        
    }
    loadSpec(){
    }
}
