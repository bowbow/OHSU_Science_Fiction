[CmdletBinding()]
param(
  [string]$AwsProfile = "default",
  [string]$Region = "us-east-1",
  [string]$InputPath = "",
  [string]$OutputPath = "",
  [switch]$Utc
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($AwsProfile)) {
  $AwsProfile = "default"
}
$repoRoot = Split-Path -Parent $PSScriptRoot
$downloadScript = Join-Path $PSScriptRoot "download-activity-log.ps1"

function Convert-ActivityLogLineToLocal([string]$Line) {
  if ($Line -notmatch '^(?<stamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) UTC(?<message>\s{2}.*)$') {
    return $Line
  }
  $styles = [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal
  $at = [DateTime]::ParseExact(
    $Matches.stamp,
    "yyyy-MM-dd HH:mm:ss",
    [Globalization.CultureInfo]::InvariantCulture,
    $styles
  )
  return "$($at.ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss zzz'))$($Matches.message)"
}

if (-not [string]::IsNullOrWhiteSpace($InputPath)) {
  if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
    throw "Use either -InputPath for an existing log or -OutputPath for a new download, not both."
  }
  $logPath = [System.IO.Path]::GetFullPath($InputPath)
  if (-not (Test-Path -LiteralPath $logPath -PathType Leaf)) {
    throw "Downloaded activity log was not found: $logPath"
  }
} else {
  if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $timestamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmss")
    $OutputPath = Join-Path $repoRoot "data/activity-$timestamp.log"
  }
  $logPath = [System.IO.Path]::GetFullPath($OutputPath)

  & $downloadScript `
    -AwsProfile $AwsProfile `
    -Region $Region `
    -OutputPath $logPath
}

$more = Get-Command "more.com" -ErrorAction SilentlyContinue
if (-not $more) {
  throw "Required command 'more.com' was not found on PATH."
}

if ($Utc) {
  Write-Host "Showing $logPath in UTC (press Space for the next page or Q to quit)"
  & $more.Source $logPath
} else {
  Write-Host "Showing $logPath in this computer's local timezone (press Space for the next page or Q to quit)"
  Get-Content -LiteralPath $logPath | ForEach-Object { Convert-ActivityLogLineToLocal $_ } | & $more.Source
}
