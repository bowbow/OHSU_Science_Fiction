# Contract: Terraform Inputs and Outputs

## Inputs

| Name | Type | Default | Constraint |
|---|---|---|---|
| `aws_region` | string | `us-east-1` | This feature supports `us-east-1` |
| `environment_name` | string | `bookclub-production` | Stable lowercase identifier |
| `instance_type` | string | `t3.micro` | Owner may override before first apply |
| `allowed_http_cidrs` | list(string) | `["0.0.0.0/0"]` | Public site in initial release |
| `release_retention_days` | number | `14` | Positive whole number |

## Outputs

| Name | Sensitive | Meaning |
|---|---|---|
| `instance_id` | no | EC2 target for Systems Manager |
| `elastic_ip` | no | Stable public IPv4 address |
| `site_url` | no | Initial `http://<elastic_ip>` URL |
| `release_bucket` | no | Private S3 bucket name used by deployment |
| `aws_region` | no | Effective AWS region |

## Reconciliation Contract

- A no-change second `terraform plan` MUST report no resource additions.
- Resources use stable Terraform addresses and environment tags.
- Changing deployable application code does not change infrastructure.
- Terraform destroy is the only supported automated action that removes the environment; deployment scripts never destroy resources.
- The production SQLite file is not represented as a replaceable Terraform resource.
