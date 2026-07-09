#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NexusEksStack } from "../lib/nexus-eks-stack";
import { NexusStagingStack } from "../lib/nexus-staging-stack";

const app = new cdk.App();

new NexusStagingStack(app, "NexusStagingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "NEXSOCIO staging EKS cluster with ECR repositories",
});

new NexusEksStack(app, "NexusEksStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "NEXSOCIO platform EKS cluster with zero-trust baseline",
});