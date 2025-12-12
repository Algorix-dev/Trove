$outFile = "feature_components_code.txt"
$root = Get-Location

$files = @(
    "components/features/library/library-content.tsx",
    "components/features/bookmarks/bookmarks-list.tsx",
    "components/features/quotes/quotes-list.tsx",
    "components/features/notes/notes-list.tsx",
    "components/features/analytics/analytics-charts.tsx",
    "components/features/community/community-list.tsx",
    "components/features/settings/settings-form.tsx"
)

Set-Content -Path $outFile -Value "TROVE - FEATURE COMPONENTS CODE DUMP"
Add-Content -Path $outFile -Value "Generated: $(Get-Date)"
Add-Content -Path $outFile -Value "================================================================`n"

foreach ($filePath in $files) {
    if (Test-Path $filePath) {
        Write-Host "Exporting: $filePath"
        Add-Content -Path $outFile -Value "`n================================================================"
        Add-Content -Path $outFile -Value "FILE: $filePath"
        Add-Content -Path $outFile -Value "================================================================`n"
        Get-Content -Path $filePath | Add-Content -Path $outFile
    }
    else {
        Write-Host "NOT FOUND: $filePath" -ForegroundColor Yellow
        Add-Content -Path $outFile -Value "`n================================================================"
        Add-Content -Path $outFile -Value "FILE: $filePath"
        Add-Content -Path $outFile -Value "================================================================"
        Add-Content -Path $outFile -Value "FILE NOT FOUND`n"
    }
}

Write-Host "`nDone! Saved to $outFile"
Write-Host "Total size: $((Get-Item $outFile).Length / 1KB) KB"
