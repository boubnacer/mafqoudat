# Check what changed in client/vercel.json 4 hours ago

Write-Host "`n=== Checking client/vercel.json history ===" -ForegroundColor Cyan
Write-Host ""

# Get the commit that changed it 4 hours ago
$commit = "d3566f9"

Write-Host "Commit that changed client/vercel.json 4 hours ago: $commit" -ForegroundColor Yellow
Write-Host "Message: Fix 405 error: Add Vercel rewrites to proxy API requests to Railway backend"
Write-Host ""

# Show the diff
Write-Host "=== Changes made to client/vercel.json ===" -ForegroundColor Cyan
git diff "$commit~1" "$commit" -- client/vercel.json | Out-String -Width 200

Write-Host "`n=== Checking if this broke Vercel deployment ===" -ForegroundColor Cyan

# Check if there are syntax errors
Write-Host "`nValidating JSON syntax..."
try {
    $json = Get-Content "client\vercel.json" -Raw | ConvertFrom-Json
    Write-Host "✅ JSON is valid" -ForegroundColor Green
    
    # Check for problematic configurations
    if ($json.version) {
        Write-Host "  version: $($json.version)"
    }
    if ($json.builds) {
        Write-Host "  builds: $($json.builds.Length) build configurations"
    }
    if ($json.rewrites) {
        Write-Host "  rewrites: $($json.rewrites.Length) rewrite rules"
    }
} catch {
    Write-Host "❌ JSON is invalid: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan

