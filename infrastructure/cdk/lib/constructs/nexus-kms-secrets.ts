import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export type NexusEnvironment = "staging" | "production";

export interface NexusKmsSecretsProps {
  environment: NexusEnvironment;
}

/**
 * KMS-backed Secrets Manager entries for NEXSOCIO platform credentials.
 * K8s workloads consume these via External Secrets Operator (IRSA).
 */
export class NexusKmsSecrets extends Construct {
  readonly key: kms.Key;
  readonly databaseSecret: secretsmanager.Secret;
  readonly jwtSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: NexusKmsSecretsProps) {
    super(scope, id);

    const { environment } = props;

    this.key = new kms.Key(this, "SecretsKey", {
      enableKeyRotation: true,
      alias: `alias/nexus-${environment}-secrets`,
      description: `NEXSOCIO ${environment} secrets encryption key`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.databaseSecret = new secretsmanager.Secret(this, "DatabaseSecret", {
      secretName: `nexus/${environment}/database`,
      encryptionKey: this.key,
      description: `PostgreSQL connection string (${environment})`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          url: "postgresql+asyncpg://nexus:CHANGE_ME@postgres:5432/nexus",
        }),
        generateStringKey: "password",
        excludeCharacters: '"@/\\\'',
      },
    });

    this.jwtSecret = new secretsmanager.Secret(this, "JwtSecret", {
      secretName: `nexus/${environment}/jwt`,
      encryptionKey: this.key,
      description: `JWT signing secret (${environment})`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "secret",
        passwordLength: 64,
        excludeCharacters: '"@/\\\'',
      },
    });

    new cdk.CfnOutput(this, "KmsKeyArn", {
      value: this.key.keyArn,
      description: `${environment} KMS key for secrets`,
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: this.databaseSecret.secretArn,
      description: `${environment} database secret ARN`,
    });

    new cdk.CfnOutput(this, "JwtSecretArn", {
      value: this.jwtSecret.secretArn,
      description: `${environment} JWT secret ARN`,
    });
  }

  grantReadTo(grantee: iam.IGrantable): void {
    this.key.grantDecrypt(grantee);
    this.databaseSecret.grantRead(grantee);
    this.jwtSecret.grantRead(grantee);
  }
}