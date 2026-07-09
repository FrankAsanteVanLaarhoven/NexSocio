import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";
import { Construct } from "constructs";
import { NexusExternalSecrets } from "./constructs/nexus-external-secrets";
import { NexusKmsSecrets } from "./constructs/nexus-kms-secrets";

export class NexusEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "NexusVpc", {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        { name: "Public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: "Private", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
      ],
    });

    const cluster = new eks.Cluster(this, "NexusCluster", {
      version: eks.KubernetesVersion.V1_31,
      vpc,
      defaultCapacity: 0,
      kubectlLayer: new KubectlV31Layer(this, "KubectlLayer"),
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
      ],
    });

    const nodeGroup = cluster.addNodegroupCapacity("NexusNodes", {
      instanceTypes: [new ec2.InstanceType("m6i.large")],
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    const secrets = new NexusKmsSecrets(this, "Secrets", {
      environment: "production",
    });

    new NexusExternalSecrets(this, "ExternalSecrets", {
      cluster,
      secrets,
    });

    cluster.addHelmChart("AwsLoadBalancerController", {
      chart: "aws-load-balancer-controller",
      repository: "https://aws.github.io/eks-charts",
      namespace: "kube-system",
      values: {
        clusterName: cluster.clusterName,
        serviceAccount: {
          create: true,
          name: "aws-load-balancer-controller",
        },
      },
    });

    new cdk.CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new cdk.CfnOutput(this, "VpcId", { value: vpc.vpcId });
    new cdk.CfnOutput(this, "NodeGroupName", { value: nodeGroup.nodegroupName });
    new cdk.CfnOutput(this, "ProductionDatabaseSecretName", {
      value: secrets.databaseSecret.secretName,
    });
    new cdk.CfnOutput(this, "ProductionJwtSecretName", {
      value: secrets.jwtSecret.secretName,
    });

    cdk.Tags.of(this).add("Project", "NEXSOCIO");
    cdk.Tags.of(this).add("Environment", "production");
    cdk.Tags.of(this).add("ManagedBy", "CDK");
  }
}