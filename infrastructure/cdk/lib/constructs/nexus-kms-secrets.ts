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
  readonly turnSecret: secretsmanager.Secret;
  readonly vapidSecret: secretsmanager.Secret;

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

    this.turnSecret = new secretsmanager.Secret(this, "TurnSecret", {
      secretName: `nexus/${environment}/turn`,
      encryptionKey: this.key,
      description: `WebRTC TURN credentials (${environment})`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          urls: "turn:turn.nexsocio.app:3478?transport=udp,turn:turn.nexsocio.app:3478?transport=tcp",
          username: "nexus",
        }),
        generateStringKey: "password",
        passwordLength: 32,
        excludeCharacters: '"@/\\\'',
      },
    });

    this.vapidSecret = new secretsmanager.Secret(this, "VapidSecret", {
      secretName: `nexus/${environment}/vapid`,
      encryptionKey: this.key,
      description: `Web Push VAPID keys (${environment})`,
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({
          public_key: "REPLACE_WITH_VAPID_PUBLIC_KEY",
          private_key: "REPLACE_WITH_VAPID_PRIVATE_KEY",
          email: "mailto:admin@nexsocio.app",
        })
      ),
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
    this.turnSecret.grantRead(grantee);
    this.vapidSecret.grantRead(grantee);
  }
}