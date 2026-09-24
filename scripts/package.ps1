param()
$ErrorActionPreference='Stop'
$utf8=New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding=$utf8
$OutputEncoding=$utf8
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $root

function Assert-InRoot([string]$Path) {
  $full=[IO.Path]::GetFullPath($Path)
  if (-not $full.StartsWith($root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw "Outside project: $full" }
  $full
}
function Get-RelativePath([string]$Base,[string]$Path) {
  $baseFull=[IO.Path]::GetFullPath($Base).TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
  $pathFull=[IO.Path]::GetFullPath($Path)
  if (-not $pathFull.StartsWith($baseFull,[StringComparison]::OrdinalIgnoreCase)) { throw "Path is outside base directory: $pathFull" }
  $pathFull.Substring($baseFull.Length)
}
function Get-Sha256Stream([IO.Stream]$Stream) {
  $sha=[Security.Cryptography.SHA256]::Create()
  try { [BitConverter]::ToString($sha.ComputeHash($Stream)).Replace('-','') } finally { $sha.Dispose() }
}
function Get-Sha256File([string]$Path) {
  $input=[IO.File]::OpenRead($Path)
  try { Get-Sha256Stream $input } finally { $input.Dispose() }
}

$out=Assert-InRoot (Join-Path $root 'deliverables')
$stage=Assert-InRoot (Join-Path $root ('test-output\package-final-'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmssfff')))
New-Item -ItemType Directory -Path $out,$stage -Force | Out-Null

$packJson=Assert-InRoot (Join-Path $stage 'npm-pack.json')
& node.exe scripts/npm-pack-json.mjs $out $packJson
if ($LASTEXITCODE -ne 0) { throw 'npm pack failed' }
$pack=@((Get-Content -LiteralPath $packJson -Raw -Encoding UTF8 | ConvertFrom-Json))[0]
$tgz=Assert-InRoot (Join-Path $out $pack.filename)

$entries=@($pack.files | ForEach-Object { ('package/'+$_.path).Replace('\','/') } | Sort-Object)
$meta=Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$expected=@('package/package.json')
foreach ($item in $meta.files) {
  $sourceItem=Join-Path $root $item
  if (Test-Path -LiteralPath $sourceItem -PathType Container) {
    $expected+=Get-ChildItem -LiteralPath $sourceItem -Recurse -File | ForEach-Object { 'package/'+(Get-RelativePath $root $_.FullName).Replace('\','/') }
  } else { $expected+='package/'+$item.Replace('\','/') }
}
$expected=@($expected | Sort-Object)
$diff=@(Compare-Object -ReferenceObject $expected -DifferenceObject $entries)
if ($diff.Count) { throw "Unexpected package manifest: $($diff | Out-String)" }
foreach ($entry in $entries) { if ($entry -match '(^|/)\.\.(/|$)|^[A-Za-z]:|\\') { throw "Unsafe package entry: $entry" } }

& tar.exe -xf $tgz -C $stage
if ($LASTEXITCODE -ne 0) { throw 'tar extraction failed' }
$pkgDir=Assert-InRoot (Join-Path $stage 'package')
$files=@(Get-ChildItem -LiteralPath $pkgDir -Recurse -File -Force | Sort-Object FullName)
$verified=@()
foreach ($file in $files) {
  $relative=Get-RelativePath $pkgDir $file.FullName
  $source=Join-Path $root $relative
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Unexpected packed file: $relative" }
  $actual=Get-Sha256File $file.FullName
  $expectedHash=Get-Sha256File $source
  if ($actual -ne $expectedHash) { throw "Package differs: $relative" }
  $verified+=@{path=$relative.Replace('\','/');bytes=$file.Length;sha256=$actual}
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$names=Get-Content -LiteralPath (Join-Path $root 'scripts/package-names.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$zipPath=Assert-InRoot (Join-Path $out $names.zip)
$stream=[IO.File]::Open($zipPath,[IO.FileMode]::Create)
$archive=[IO.Compression.ZipArchive]::new($stream,[IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($file in $files) {
    $relative=(Get-RelativePath $pkgDir $file.FullName).Replace('\','/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$file.FullName,('dsh-echocat-prettier/'+$relative),[IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $archive.Dispose();$stream.Dispose() }

$zip=[IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  if ($zip.Entries.Count -ne $files.Count) { throw 'ZIP count mismatch' }
  foreach ($entry in $zip.Entries) {
    if (-not $entry.FullName.StartsWith('dsh-echocat-prettier/')) { throw "Unsafe ZIP entry: $($entry.FullName)" }
    $relative=$entry.FullName.Substring('dsh-echocat-prettier/'.Length)
    $source=Join-Path $pkgDir $relative
    $input=$entry.Open()
    try { $actual=Get-Sha256Stream $input } finally { $input.Dispose() }
    $expectedHash=Get-Sha256File $source
    if ($actual -ne $expectedHash) { throw "ZIP differs: $relative" }
  }
} finally { $zip.Dispose() }

$manifestPath=Assert-InRoot (Join-Path $out $names.manifest)
$manifest=[ordered]@{
  release='V2.3.4'
  packageVersion=$pack.version
  liveDSHVerified=$false
  fileCount=$files.Count
  artifacts=@(
    @{name=[IO.Path]::GetFileName($zipPath);bytes=(Get-Item -LiteralPath $zipPath).Length;sha256=(Get-Sha256File $zipPath)},
    @{name=[IO.Path]::GetFileName($tgz);bytes=(Get-Item -LiteralPath $tgz).Length;sha256=(Get-Sha256File $tgz)}
  )
  files=$verified
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8
Write-Output ($manifest | ConvertTo-Json -Depth 6)
