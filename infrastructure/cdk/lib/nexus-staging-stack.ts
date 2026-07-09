import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as eks from "aws-cdk-lib/aws-eks";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";
import { Construct } from "constructs";

export class NexusStagingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "NexusStagingVpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new eks.Cluster(this, "NexusStagingCluster", {
      version: eks.KubernetesVersion.V1_31,
      vpc,
      defaultCapacity: 0,
      kubectlLayer: new KubectlV31Layer(this, "KubectlLayer"),
      clusterName: "nexus-staging",
    });

    cluster.addNodegroupCapacity("StagingNodes", {
      instanceTypes: [new ec2.InstanceType("m6i.large")],
      minSize: 1,
      maxSize: 5,
      desiredSize: 2,
    });

    const repos = ["nexus-identity", "nexus-content", "nexus-social-graph", "nexus-professional"];
    for (const name of repos) {
      new ecr.Repository(this, `${name}Repo`, {
        repositoryName: name,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        lifecycleRules: [{ maxImageCount: 20 }],
      });
    }

    new cdk.CfnOutput(this, "StagingClusterName", { value: cluster.clusterName });
    new cdk.CfnOutput(this, "StagingVpcId", { value: vpc.vpcId });

    cdk.Tags.of(this).add("Project", "NEXSOCIO");
    cdk.Tags.of(this).add("Environment", "staging");
  }
}