import * as cdk from "aws-cdk-lib";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { NexusKmsSecrets } from "./nexus-kms-secrets";

export interface NexusExternalSecretsProps {
  cluster: eks.Cluster;
  secrets: NexusKmsSecrets;
  namespace?: string;
}

/**
 * Installs External Secrets Operator on EKS with IRSA to read KMS-backed
 * Secrets Manager entries and sync them into Kubernetes Secret objects.
 */
export class NexusExternalSecrets extends Construct {
  readonly serviceAccount: eks.ServiceAccount;
  readonly roleArn: string;

  constructor(scope: Construct, id: string, props: NexusExternalSecretsProps) {
    super(scope, id);

    const namespace = props.namespace ?? "external-secrets";

    this.serviceAccount = props.cluster.addServiceAccount("ExternalSecretsSA", {
      name: "external-secrets",
      namespace,
    });

    props.secrets.grantReadTo(this.serviceAccount);

    this.serviceAccount.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:ListSecrets", "secretsmanager:ListSecretVersionIds"],
        resources: ["*"],
      })
    );

    this.roleArn = this.serviceAccount.role.roleArn;

    const esoChart = props.cluster.addHelmChart("ExternalSecrets", {
      chart: "external-secrets",
      repository: "https://charts.external-secrets.io",
      namespace,
      createNamespace: true,
      version: "0.14.2",
      values: {
        installCRDs: true,
        serviceAccount: {
          create: false,
          name: "external-secrets",
        },
        securityContext: {
          fsGroup: 65534,
        },
      },
    });

    esoChart.node.addDependency(this.serviceAccount);

    new cdk.CfnOutput(this, "ExternalSecretsRoleArn", {
      value: this.roleArn,
      description: "IRSA role ARN for External Secrets Operator",
    });
  }
}