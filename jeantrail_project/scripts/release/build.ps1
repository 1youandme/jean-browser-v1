param(
  [string]$OutDir = "dist/installers"
)

$ErrorActionPreference = "Stop"

Write-Host "== JeanTrail Release Build =="

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Step 1: Building web assets..."
cmd /c "set NODE_ENV=production && npm run build"

Write-Host "Step 2: Building Tauri installers..."
cmd /c "set NODE_ENV=production && npm run tauri:build"

# Copy artifacts from Tauri bundle to /dist/installers
$bundleRoot = "src-tauri/target/release/bundle"
Get-ChildItem -Recurse -Path $bundleRoot -Include *.exe,*.msi,*.dmg |
  ForEach-Object {
    Copy-Item $_.FullName -Destination $OutDir -Force
  }

Write-Host "Step 3: Generating SHA256 checksums..."
Get-ChildItem -Path $OutDir -Include *.exe,*.msi,*.dmg |
  ForEach-Object {
    $filePath = $_.FullName
    $hash = (Get-FileHash -Algorithm SHA256 -Path $filePath).Hash
    "$($filePath)  $hash" | Out-File -FilePath (Join-Path $OutDir "SHA256SUMS.txt") -Append -Encoding ascii
  }

Write-Host "Release build complete."
