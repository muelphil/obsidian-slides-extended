/$ErrorActionPreference = "Stop"

$root = "C:\Users\PHMU3\IdeaProjects\obsidian-slides-extended"
$target = "C:\Users\PHMU3\Google Drive Dev\Obsidian Vaults\Work\.obsidian\plugins\slides-extended"

# 1. Build plugin (main.js, styles.css)
Write-Host "==> Building plugin (esbuild)..." -ForegroundColor Cyan
Push-Location $root
node esbuild.config.mjs production
Pop-Location

# 2. Build reveal.js distribution (template, plugin scripts, css, dist)
Write-Host "==> Building reveal-dist (esbuild)..." -ForegroundColor Cyan
Push-Location "$root\reveal-dist"
node esbuild.config.mjs production
Pop-Location

# 3. Copy plugin build into the vault plugin folder
Write-Host "==> Copying build/ -> plugin folder..." -ForegroundColor Cyan
Copy-Item -Path "$root\build\*" -Destination $target -Recurse -Force

# 4. Copy reveal-dist build into the vault plugin folder
#    (template/, plugin/, css/, dist/ - where the renderer serves from)
Write-Host "==> Copying reveal-dist/build/ -> plugin folder..." -ForegroundColor Cyan
Copy-Item -Path "$root\reveal-dist\build\*" -Destination $target -Recurse -Force

Write-Host "Done. Reload Obsidian (or disable/enable the plugin) to pick up changes." -ForegroundColor Green
