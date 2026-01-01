param(
  [string]$Dir = "dist/installers"
)

$ErrorActionPreference = "Stop"

if (-Not (Test-Path $Dir)) {
  Write-Error "Directory '$Dir' not found."
}

Write-Host "Generating SHA256 checksums for $Dir ..."
Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $Dir "SHA256SUMS.txt")

Get-ChildItem -Path $Dir -Include *.exe,*.msi,*.dmg |
  ForEach-Object {
    $filePath = $_.FullName
    $hash = (Get-FileHash -Algorithm SHA256 -Path $filePath).Hash
    "$($filePath)  $hash" | Out-File -FilePath (Join-Path $Dir "SHA256SUMS.txt") -Append -Encoding ascii
  }

Write-Host "SHA256SUMS.txt created."
