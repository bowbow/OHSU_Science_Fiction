[CmdletBinding()]
param(
  [string]$AwsProfile = "default",
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($AwsProfile)) {
  $AwsProfile = "default"
}
$repoRoot = Split-Path -Parent $PSScriptRoot
$terraformDir = Join-Path $repoRoot "infra/aws"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found on PATH."
  }
}

function Terraform-Output([string]$Name) {
  if (Get-Command terraform -ErrorAction SilentlyContinue) {
    $value = & terraform "-chdir=$terraformDir" output -raw $Name
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }
  }

  $statePath = Join-Path $terraformDir "terraform.tfstate"
  if (Test-Path -LiteralPath $statePath) {
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $stateValue = $state.outputs.$Name.value
    if (-not [string]::IsNullOrWhiteSpace([string]$stateValue)) {
      return ([string]$stateValue).Trim()
    }
  }

  throw "Terraform output '$Name' is unavailable. Provision infrastructure first."
}

Require-Command "aws"
Require-Command "node"
Require-Command "tar.exe"

$identity = aws sts get-caller-identity --profile $AwsProfile --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $identity.Account) {
  throw "AWS profile '$AwsProfile' could not be authenticated."
}
Write-Host "Authenticated to AWS account $($identity.Account) as $($identity.Arn)."

$previousProfile = $env:AWS_PROFILE
$previousRegion = $env:AWS_REGION
$archivePath = $null
$commandJsonPath = $null
try {
  $env:AWS_PROFILE = $AwsProfile
  $env:AWS_REGION = $Region

  Write-Host "Running BookClub tests..."
  node --experimental-strip-types --test `
    packages/core/test/register-password.test.ts `
    packages/core/test/sign-in-password.test.ts `
    packages/core/test/admins.test.ts `
    packages/core/test/book-club.test.ts `
    packages/core/test/feedback.test.ts `
    packages/core/test/boundary.test.ts `
    apps/web/test/register-page.test.ts `
    apps/web/test/session-cookie.test.ts `
    apps/web/test/admin-role.test.ts `
    apps/web/test/book-club-page.test.ts `
    apps/web/test/feedback-page.test.ts `
    apps/web/test/health.test.ts `
    apps/web/test/responsive-layout.test.ts `
    apps/web/test/google-books.test.ts `
    scripts/test/sqlite-backup.test.ts `
    scripts/test/feedback-migration.test.ts `
    scripts/test/book-details-migration.test.ts
  if ($LASTEXITCODE -ne 0) { throw "Tests failed; deployment stopped." }

  $instanceId = Terraform-Output "instance_id"
  $bucket = Terraform-Output "release_bucket"
  $backupBucket = Terraform-Output "backup_bucket"
  $siteUrl = Terraform-Output "site_url"
  $googleBooksParameter = Terraform-Output "google_books_api_key_parameter_name"

  $savedErrorPreference = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $revision = (& git -C $repoRoot rev-parse --short HEAD 2>$null)
  $gitExitCode = $LASTEXITCODE
  $ErrorActionPreference = $savedErrorPreference
  if ($gitExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($revision)) { $revision = "workspace" }
  $releaseId = "$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))-$revision"
  $archivePath = Join-Path ([System.IO.Path]::GetTempPath()) "bookclub-$releaseId.tar.gz"

  Write-Host "Packaging release $releaseId..."
  & tar.exe -czf $archivePath `
    --exclude=.git `
    --exclude=.terraform `
    --exclude=node_modules `
    --exclude=data `
    --exclude=coverage `
    --exclude='*.sqlite' `
    --exclude='*.sqlite3' `
    --exclude='*.tfstate' `
    --exclude='*.tfstate.*' `
    --exclude='*.tfplan' `
    --exclude='*.tfvars' `
    --exclude='.env' `
    --exclude='.env.*' `
    -C $repoRoot .
  if ($LASTEXITCODE -ne 0) { throw "Release packaging failed." }

  $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $key = "releases/$releaseId.tar.gz"
  aws s3 cp $archivePath "s3://$bucket/$key" --profile $AwsProfile --region $Region --only-show-errors
  if ($LASTEXITCODE -ne 0) { throw "Uploading the release archive failed." }

  Write-Host "Waiting for the instance to become a Systems Manager managed node..."
  $managed = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    $ping = aws ssm describe-instance-information --profile $AwsProfile --region $Region `
      --filters "Key=InstanceIds,Values=$instanceId" --query 'InstanceInformationList[0].PingStatus' --output text
    if ($LASTEXITCODE -eq 0 -and $ping.Trim() -eq "Online") { $managed = $true; break }
    Start-Sleep -Seconds 5
  }
  if (-not $managed) { throw "Instance $instanceId did not become available in Systems Manager." }

  $remoteWork = "/tmp/bookclub-$releaseId"
  $commands = @(
    "set -euo pipefail",
    "rm -rf '$remoteWork' && mkdir -p '$remoteWork'",
    "aws s3 cp 's3://$bucket/$key' '$remoteWork/release.tar.gz' --region '$Region' --only-show-errors",
    "tar -xOf '$remoteWork/release.tar.gz' './scripts/remote-deploy.sh' > '$remoteWork/remote-deploy.sh'",
    "chmod 0700 '$remoteWork/remote-deploy.sh'",
    "bash -n '$remoteWork/remote-deploy.sh'",
    "bash '$remoteWork/remote-deploy.sh' '$remoteWork/release.tar.gz' '$releaseId' '$hash' '$siteUrl' '$backupBucket' '$googleBooksParameter'"
  )
  $commandInput = @{
    DocumentName = "AWS-RunShellScript"
    InstanceIds = @($instanceId)
    Comment = "Deploy BookClub $releaseId"
    Parameters = @{ commands = $commands; executionTimeout = @("900") }
  }
  $commandJsonPath = Join-Path ([System.IO.Path]::GetTempPath()) "bookclub-command-$releaseId.json"
  $commandJson = $commandInput | ConvertTo-Json -Depth 6
  [System.IO.File]::WriteAllText($commandJsonPath, $commandJson, (New-Object System.Text.UTF8Encoding($false)))

  $commandId = aws ssm send-command --profile $AwsProfile --region $Region `
    --cli-input-json "file://$commandJsonPath" --query 'Command.CommandId' --output text
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($commandId)) { throw "Could not start the remote deployment command." }
  Write-Host "Systems Manager command: $commandId"

  $terminal = @("Success", "Cancelled", "TimedOut", "Failed", "Cancelling")
  do {
    Start-Sleep -Seconds 5
    $status = aws ssm get-command-invocation --profile $AwsProfile --region $Region `
      --command-id $commandId --instance-id $instanceId --query Status --output text
  } while ($LASTEXITCODE -eq 0 -and $terminal -notcontains $status.Trim())

  $result = aws ssm get-command-invocation --profile $AwsProfile --region $Region `
    --command-id $commandId --instance-id $instanceId --output json | ConvertFrom-Json
  if ($result.StandardOutputContent) { Write-Host $result.StandardOutputContent }
  if ($result.StandardErrorContent) { Write-Warning $result.StandardErrorContent }
  if ($result.Status -ne "Success") { throw "Remote deployment ended with status $($result.Status)." }

  Write-Host "Checking public health at $siteUrl/health..."
  $healthy = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri "$siteUrl/health" -TimeoutSec 5
      if ($health.status -eq "ok") { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 2 }
  }
  if (-not $healthy) { throw "Public health check failed after deployment." }
  Write-Host "Deployment succeeded: $siteUrl"
}
finally {
  if ($archivePath -and (Test-Path -LiteralPath $archivePath)) { Remove-Item -LiteralPath $archivePath -Force }
  if ($commandJsonPath -and (Test-Path -LiteralPath $commandJsonPath)) { Remove-Item -LiteralPath $commandJsonPath -Force }
  $env:AWS_PROFILE = $previousProfile
  $env:AWS_REGION = $previousRegion
}
