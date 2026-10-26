$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$deploy = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/deploy.ps1") -Raw
$remote = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/remote-deploy.sh") -Raw
$provision = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/provision.ps1") -Raw
$downloadLog = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/download-activity-log.ps1") -Raw
$viewLog = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/view-server-log.ps1") -Raw
$backup = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/backup-database.sh") -Raw
$restore = Get-Content -LiteralPath (Join-Path $repoRoot "scripts/restore-database.sh") -Raw
$terraform = Get-Content -LiteralPath (Join-Path $repoRoot "infra/aws/main.tf") -Raw
$userData = Get-Content -LiteralPath (Join-Path $repoRoot "infra/aws/user-data.sh") -Raw
$package = Get-Content -LiteralPath (Join-Path $repoRoot "package.json") -Raw

function Assert-Contains([string]$Text, [string]$Pattern, [string]$Message) {
  if ($Text -notmatch $Pattern) { throw $Message }
}

Assert-Contains $deploy "--exclude=data" "Deployment package must exclude data/."
Assert-Contains $deploy "--exclude='\*\.sqlite'" "Deployment package must exclude SQLite files."
Assert-Contains $deploy "Get-FileHash.+SHA256" "Deployment must hash the release archive."
Assert-Contains $deploy "AWS-RunShellScript" "Deployment must use Systems Manager Run Command."
Assert-Contains $deploy "get-caller-identity" "Deployment must verify the selected AWS profile."
Assert-Contains $deploy 'Terraform-Output "backup_bucket"' "Deployment must read the backup bucket output."
Assert-Contains $deploy 'Terraform-Output "google_books_api_key_parameter_name"' "Deployment must read the secret parameter name from Terraform."
Assert-Contains $remote "/var/lib/bookclub/bookclub\.sqlite" "Remote deployment must not relocate the persistent database."
Assert-Contains $remote "BOOKCLUB_INITIALIZE_DATABASE=false" "Production startup must not initialize or migrate the database."
Assert-Contains $remote "Release archive contains a forbidden" "Remote deployment must reject unsafe archives."
Assert-Contains $remote "current\.rollback" "Remote deployment must retain rollback behavior."
Assert-Contains $remote "backup-database\.sh.+pre-deploy" "Remote deployment must back up the database before activation."
Assert-Contains $remote "migrate-feedback\.ts" "Remote deployment must run the explicit feedback migration."
Assert-Contains $remote "migrate-book-details\.ts" "Remote deployment must run the additive book-details migration."
Assert-Contains $remote "bookclub-backup\.timer" "Remote deployment must install the weekly backup timer."
Assert-Contains $remote "aws ssm get-parameter" "Remote deployment must retrieve the Google Books key from Parameter Store."
Assert-Contains $remote "--with-decryption" "Remote deployment must decrypt the SecureString only on the instance."
Assert-Contains $remote "bookclub-secrets\.env" "Remote deployment must keep secrets in a separate environment file."
Assert-Contains $remote "chmod 0640 /etc/bookclub-secrets\.env\.new" "The production secret file must not be world-readable."
Assert-Contains $backup "sqlite-backup\.ts" "Backups must use the consistent SQLite backup utility."
Assert-Contains $backup "aws s3 cp" "Backups must upload to S3."
Assert-Contains $restore "sqlite-backup\.ts.+verify" "Restores must verify SQLite integrity before replacement."
Assert-Contains $restore "before-restore" "Restores must retain the database they replace."
Assert-Contains $terraform 'aws_s3_bucket_public_access_block" "backups' "Backup bucket must block public access."
Assert-Contains $terraform 'aws_s3_bucket_server_side_encryption_configuration" "backups' "Backup bucket must enable encryption."
Assert-Contains $terraform 'aws_s3_bucket_versioning" "backups' "Backup bucket must enable versioning."
Assert-Contains $terraform 'aws:SecureTransport' "Backup bucket must require TLS."
Assert-Contains $terraform 'google_books_api_key_read' "Terraform must grant the instance narrowly scoped access to the API key."
Assert-Contains $terraform 'Action\s+= \["ssm:GetParameter"\]' "The instance must receive only single-parameter read access."
Assert-Contains $terraform 'ignore_changes = \[ami, user_data\]' "Terraform must not replace the stateful instance when the latest AMI or bootstrap changes."
Assert-Contains $userData 'EnvironmentFile=-/etc/bookclub-secrets\.env' "New instances must load the optional secret environment file."
Assert-Contains $package '--env-file-if-exists=\.env\.local' "Local start commands must load the ignored development environment file."
Assert-Contains $provision '\[switch\]\$PlanOnly' "Provisioning must support review without apply."
Assert-Contains $provision "get-caller-identity" "Provisioning must verify the selected AWS profile."
Assert-Contains $viewLog "download-activity-log\.ps1" "The log viewer must use the established AWS download script."
Assert-Contains $viewLog 'Get-Command "more\.com"' "The log viewer must require the Windows pager."
Assert-Contains $viewLog '& \$more\.Source \$OutputPath' "The log viewer must page through the downloaded file."
Assert-Contains $viewLog "Convert-ActivityLogLineToLocal" "The log viewer must convert UTC lines for local display."
Assert-Contains $viewLog "ToLocalTime" "The log viewer must use the viewing computer's local timezone."
foreach ($awsScript in @($deploy, $provision, $downloadLog, $viewLog)) {
  Assert-Contains $awsScript '\[string\]\$AwsProfile = "default"' "Every PowerShell AWS helper must default to the default profile."
  Assert-Contains $awsScript 'IsNullOrWhiteSpace\(\$AwsProfile\)' "Every PowerShell AWS helper must treat a blank profile as default."
}

$tokens = $null
$parseErrors = $null
$viewLogAst = [System.Management.Automation.Language.Parser]::ParseInput($viewLog, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) { throw "The log viewer must contain valid PowerShell." }
$converter = $viewLogAst.Find({
  param($node)
  $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq "Convert-ActivityLogLineToLocal"
}, $true)
if (-not $converter) { throw "The local-time conversion function is missing." }
Invoke-Expression $converter.Extent.Text
$utc = [DateTime]::SpecifyKind([DateTime]::ParseExact(
  "2026-10-07 17:25:03",
  "yyyy-MM-dd HH:mm:ss",
  [Globalization.CultureInfo]::InvariantCulture
), [DateTimeKind]::Utc)
$expectedLocalLine = "$($utc.ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss zzz'))  ada registered"
if ((Convert-ActivityLogLineToLocal "2026-10-07 17:25:03 UTC  ada registered") -ne $expectedLocalLine) {
  throw "The log viewer did not convert a UTC activity line to local time."
}
if ((Convert-ActivityLogLineToLocal "unrecognized line") -ne "unrecognized line") {
  throw "The log viewer must preserve lines without a recognized UTC timestamp."
}

$backupPosition = $remote.IndexOf('backup-database.sh" pre-deploy')
$migrationPosition = $remote.IndexOf('migrate-feedback.ts')
$activationPosition = $remote.IndexOf('systemctl restart bookclub')
if ($backupPosition -lt 0 -or $migrationPosition -le $backupPosition -or $activationPosition -le $migrationPosition) {
  throw "Remote deployment must back up first, migrate second, and activate last."
}

Write-Host "Deployment script contract tests passed."
