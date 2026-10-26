[CmdletBinding()]
param(
  [string]$AwsProfile = "default",
  [string]$Region = "us-east-1",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($AwsProfile)) {
  $AwsProfile = "default"
}
$repoRoot = Split-Path -Parent $PSScriptRoot
$terraformDir = Join-Path $repoRoot "infra/aws"
$remoteLogPath = "/var/lib/bookclub/activity.log"
$timestamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmss")

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

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot "data/activity-$timestamp.log"
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$identity = & aws sts get-caller-identity --profile $AwsProfile --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $identity.Account) {
  throw "AWS profile '$AwsProfile' could not be authenticated."
}

$instanceId = Terraform-Output "instance_id"
$bucket = Terraform-Output "backup_bucket"
$stagingKey = "database/log-exports/activity-$timestamp-$([Guid]::NewGuid().ToString('N')).log"
$stagingUri = "s3://$bucket/$stagingKey"
$commandJsonPath = Join-Path ([System.IO.Path]::GetTempPath()) "bookclub-log-$timestamp.json"
$staged = $false

try {
  $pingStatus = & aws ssm describe-instance-information `
    --profile $AwsProfile `
    --region $Region `
    --filters "Key=InstanceIds,Values=$instanceId" `
    --query "InstanceInformationList[0].PingStatus" `
    --output text
  if ($LASTEXITCODE -ne 0 -or $pingStatus.Trim() -ne "Online") {
    throw "EC2 instance $instanceId is not online in Systems Manager. Start the instance, wait a minute, and try again."
  }

  $commandInput = @{
    DocumentName = "AWS-RunShellScript"
    InstanceIds = @($instanceId)
    Comment = "Export BookClub activity log"
    Parameters = @{
      commands = @(
        "set -euo pipefail",
        "test -f '$remoteLogPath'",
        "aws s3 cp '$remoteLogPath' '$stagingUri' --region '$Region' --only-show-errors"
      )
      executionTimeout = @("120")
    }
  }
  $commandJson = $commandInput | ConvertTo-Json -Depth 6
  [System.IO.File]::WriteAllText(
    $commandJsonPath,
    $commandJson,
    (New-Object System.Text.UTF8Encoding($false))
  )

  $commandId = & aws ssm send-command `
    --profile $AwsProfile `
    --region $Region `
    --cli-input-json "file://$commandJsonPath" `
    --query "Command.CommandId" `
    --output text
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($commandId)) {
    throw "Could not start the activity-log export on $instanceId."
  }

  $terminalStatuses = @("Success", "Cancelled", "TimedOut", "Failed", "Cancelling")
  $status = "Pending"
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 2
    $status = & aws ssm get-command-invocation `
      --profile $AwsProfile `
      --region $Region `
      --command-id $commandId `
      --instance-id $instanceId `
      --query "Status" `
      --output text
    if ($LASTEXITCODE -eq 0 -and $terminalStatuses -contains $status.Trim()) { break }
  }

  if ($status.Trim() -ne "Success") {
    $result = & aws ssm get-command-invocation `
      --profile $AwsProfile `
      --region $Region `
      --command-id $commandId `
      --instance-id $instanceId `
      --output json | ConvertFrom-Json
    $details = if ($result.StandardErrorContent) { $result.StandardErrorContent.Trim() } else { "No remote error was returned." }
    throw "Activity-log export ended with status $($result.Status): $details"
  }
  $staged = $true

  & aws s3 cp $stagingUri $OutputPath `
    --profile $AwsProfile `
    --region $Region `
    --only-show-errors
  if ($LASTEXITCODE -ne 0) {
    throw "Could not download the staged activity log."
  }

  Write-Host "Activity log downloaded to $OutputPath"
}
finally {
  if (Test-Path -LiteralPath $commandJsonPath) {
    Remove-Item -LiteralPath $commandJsonPath -Force
  }
  if ($staged) {
    & aws s3 rm $stagingUri `
      --profile $AwsProfile `
      --region $Region `
      --only-show-errors
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "The log was downloaded, but the temporary S3 object remains at $stagingUri."
    }
  }
}
