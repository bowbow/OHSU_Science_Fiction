[CmdletBinding()]
param(
  [string]$AwsProfile = "default",
  [string]$Region = "us-east-1",
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

if ($Utc) {
  Write-Host "Showing $OutputPath in UTC (press Space for the next page or Q to quit)"
  & $more.Source $OutputPath
} else {
  Write-Host "Showing $OutputPath in this computer's local timezone (press Space for the next page or Q to quit)"
  Get-Content -LiteralPath $OutputPath | ForEach-Object { Convert-ActivityLogLineToLocal $_ } | & $more.Source
}
