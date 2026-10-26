[CmdletBinding()]
param(
  [string]$AwsProfile = "default",
  [string]$Region = "us-east-1",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$downloadScript = Join-Path $PSScriptRoot "download-activity-log.ps1"

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $timestamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmss")
  $OutputPath = Join-Path $repoRoot "data/activity-$timestamp.log"
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)

$more = Get-Command "more.com" -ErrorAction SilentlyContinue
if (-not $more) {
  throw "Required command 'more.com' was not found on PATH."
}

& $downloadScript `
  -AwsProfile $AwsProfile `
  -Region $Region `
  -OutputPath $OutputPath

Write-Host "Showing $OutputPath (press Space for the next page or Q to quit)"
& $more.Source $OutputPath
