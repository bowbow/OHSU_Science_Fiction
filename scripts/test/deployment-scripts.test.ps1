$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$deploy = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/deploy.ps1") -Raw
$remote = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/remote-deploy.sh") -Raw
$provision = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/provision.ps1") -Raw
$backup = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/backup-database.sh") -Raw
$restore = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/restore-database.sh") -Raw
$terraform = Get-Content -LiteralPath (Join-Path $repoRoot "infra/aws/main.tf") -Raw

function Assert-Contains([string]$Text, [string]$Pattern, [string]$Message) {
  if ($Text -notmatch $Pattern) { throw $Message }
}

Assert-Contains $deploy "--exclude=data" "Deployment package must exclude data/."
Assert-Contains $deploy "--exclude='\*\.sqlite'" "Deployment package must exclude SQLite files."
Assert-Contains $deploy "Get-FileHash.+SHA256" "Deployment must hash the release archive."
Assert-Contains $deploy "AWS-RunShellScript" "Deployment must use Systems Manager Run Command."
Assert-Contains $deploy "get-caller-identity" "Deployment must verify the selected AWS profile."
Assert-Contains $deploy 'Terraform-Output "backup_bucket"' "Deployment must read the backup bucket output."
Assert-Contains $remote "/var/lib/bookclub/bookclub\.sqlite" "Remote deployment must not relocate the persistent database."
Assert-Contains $remote "BOOKCLUB_INITIALIZE_DATABASE=false" "Production startup must not initialize or migrate the database."
Assert-Contains $remote "Release archive contains a forbidden" "Remote deployment must reject unsafe archives."
Assert-Contains $remote "current\.rollback" "Remote deployment must retain rollback behavior."
Assert-Contains $remote "backup-database\.sh.+pre-deploy" "Remote deployment must back up the database before activation."
Assert-Contains $remote "bookclub-backup\.timer" "Remote deployment must install the weekly backup timer."
Assert-Contains $backup "sqlite-backup\.ts" "Backups must use the consistent SQLite backup utility."
Assert-Contains $backup "aws s3 cp" "Backups must upload to S3."
Assert-Contains $restore "sqlite-backup\.ts.+verify" "Restores must verify SQLite integrity before replacement."
Assert-Contains $restore "before-restore" "Restores must retain the database they replace."
Assert-Contains $terraform 'aws_s3_bucket_public_access_block" "backups' "Backup bucket must block public access."
Assert-Contains $terraform 'aws_s3_bucket_server_side_encryption_configuration" "backups' "Backup bucket must enable encryption."
Assert-Contains $terraform 'aws_s3_bucket_versioning" "backups' "Backup bucket must enable versioning."
Assert-Contains $terraform 'aws:SecureTransport' "Backup bucket must require TLS."
Assert-Contains $terraform 'ignore_changes = \[ami\]' "Terraform must not replace the stateful instance when the latest AMI changes."
Assert-Contains $provision '\[switch\]\$PlanOnly' "Provisioning must support review without apply."
Assert-Contains $provision "get-caller-identity" "Provisioning must verify the selected AWS profile."

Write-Host "Deployment script contract tests passed."
