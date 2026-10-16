$ErrorActionPreference = "Stop"
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$repoRoot = Split-Path -Parent $PSScriptRoot
$resRoot = Join-Path $repoRoot "artifacts/mockup-sandbox/android/app/src/main/res"
$logoPath = Join-Path $repoRoot "assets/tricycle-conduct-logo.png"
$brandBlue = [System.Windows.Media.ColorConverter]::ConvertFromString("#0C5BCE")
$white = [System.Windows.Media.Colors]::White

$bitmap = [System.Windows.Media.Imaging.BitmapImage]::new()
$bitmap.BeginInit()
$bitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
$bitmap.UriSource = [System.Uri]::new($logoPath)
$bitmap.EndInit()
$bitmap.Freeze()

# The supplied artwork has a slim white canvas around the blue app badge.
# Crop that canvas so Android masks the badge cleanly in square and round launchers.
$marginX = [int][Math]::Round($bitmap.PixelWidth * 0.048)
$marginY = [int][Math]::Round($bitmap.PixelHeight * 0.048)
$side = [Math]::Min($bitmap.PixelWidth - 2 * $marginX, $bitmap.PixelHeight - 2 * $marginY)
$logo = [System.Windows.Media.Imaging.CroppedBitmap]::new(
    $bitmap,
    [System.Windows.Int32Rect]::new($marginX, $marginY, $side, $side)
)
$logo.Freeze()

function Save-VisualPng($visual, [string]$path, [int]$width, [int]$height) {
    $rendered = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
        $width, $height, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32
    )
    $rendered.Render($visual)
    $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rendered))
    $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    try { $encoder.Save($stream) } finally { $stream.Dispose() }
}

function New-LogoVisual([int]$canvasSize, [string]$kind, [double]$logoScale = 1.0) {
    $visual = [System.Windows.Media.DrawingVisual]::new()
    $context = $visual.RenderOpen()
    if ($kind -eq "square") {
        $context.DrawImage($logo, [System.Windows.Rect]::new(0, 0, $canvasSize, $canvasSize))
    } elseif ($kind -eq "round") {
        $context.PushClip([System.Windows.Media.EllipseGeometry]::new(
            [System.Windows.Rect]::new(0, 0, $canvasSize, $canvasSize)
        ))
        $context.DrawImage($logo, [System.Windows.Rect]::new(0, 0, $canvasSize, $canvasSize))
        $context.Pop()
    } else {
        $size = $canvasSize * $logoScale
        $offset = ($canvasSize - $size) / 2
        $context.DrawImage($logo, [System.Windows.Rect]::new($offset, $offset, $size, $size))
    }
    $context.Close()
    return $visual
}

$densitySizes = @{
    "mdpi" = @{ icon = 48; foreground = 108 }
    "hdpi" = @{ icon = 72; foreground = 162 }
    "xhdpi" = @{ icon = 96; foreground = 216 }
    "xxhdpi" = @{ icon = 144; foreground = 324 }
    "xxxhdpi" = @{ icon = 192; foreground = 432 }
}

foreach ($density in $densitySizes.Keys) {
    $sizes = $densitySizes[$density]
    $directory = Join-Path $resRoot "mipmap-$density"
    Save-VisualPng (New-LogoVisual $sizes.icon "square") (Join-Path $directory "ic_launcher.png") $sizes.icon $sizes.icon
    Save-VisualPng (New-LogoVisual $sizes.icon "round") (Join-Path $directory "ic_launcher_round.png") $sizes.icon $sizes.icon
    # Leave room for Android's adaptive-icon mask while showing the complete badge.
    Save-VisualPng (New-LogoVisual $sizes.foreground "adaptive" 0.86) (Join-Path $directory "ic_launcher_foreground.png") $sizes.foreground $sizes.foreground
}

# Show the complete supplied logo on each Android splash aspect ratio.
$splashFiles = Get-ChildItem $resRoot -Recurse -Filter "splash.png"
foreach ($file in $splashFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $width = ([long]$bytes[16] -shl 24) -bor ([long]$bytes[17] -shl 16) -bor ([long]$bytes[18] -shl 8) -bor [long]$bytes[19]
    $height = ([long]$bytes[20] -shl 24) -bor ([long]$bytes[21] -shl 16) -bor ([long]$bytes[22] -shl 8) -bor [long]$bytes[23]
    $visual = [System.Windows.Media.DrawingVisual]::new()
    $context = $visual.RenderOpen()
    $context.DrawRectangle([System.Windows.Media.SolidColorBrush]::new($white), $null, [System.Windows.Rect]::new(0, 0, $width, $height))
    $size = [Math]::Min($width, $height) * 0.68
    $context.DrawImage($logo, [System.Windows.Rect]::new(($width - $size) / 2, ($height - $size) / 2, $size, $size))
    $context.Close()
    Save-VisualPng $visual $file.FullName $width $height
}

$backgroundXml = @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0C5BCE</color>
</resources>
'@
Set-Content -Path (Join-Path $resRoot "values/ic_launcher_background.xml") -Value $backgroundXml -Encoding utf8

Write-Output "Generated Android launcher and splash assets from $logoPath"
