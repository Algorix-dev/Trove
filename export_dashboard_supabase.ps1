$outFile = "dashboard_supabase_code.txt"
$root = Get-Location

Set-Content -Path $outFile -Value "TROVE - DASHBOARD & SUPABASE CODE DUMP"
Add-Content -Path $outFile -Value "Generated: $(Get-Date)"
Add-Content -Path $outFile -Value "================================================================`n"

# Process lib/supabase directory
if (Test-Path "lib/supabase") {
    Add-Content -Path $outFile -Value "`n`n================================================================"
    Add-Content -Path $outFile -Value "DIRECTORY: lib/supabase"
    Add-Content -Path $outFile -Value "================================================================`n"
    
    $files = Get-ChildItem -Path "lib/supabase" -Recurse -Include *.ts, *.tsx, *.js
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($root.Path.Length + 1)
        Write-Host "Exporting: $relPath"
        Add-Content -Path $outFile -Value "`n----------------------------------------------------------------"
        Add-Content -Path $outFile -Value "FILE: $relPath"
        Add-Content -Path $outFile -Value "----------------------------------------------------------------`n"
        Get-Content -Path $file.FullName | Add-Content -Path $outFile
    }
}

# Process app/dashboard directory
if (Test-Path "app/dashboard") {
    Add-Content -Path $outFile -Value "`n`n================================================================"
    Add-Content -Path $outFile -Value "DIRECTORY: app/dashboard"
    Add-Content -Path $outFile -Value "================================================================`n"
    
    $files = Get-ChildItem -Path "app/dashboard" -Recurse -Include *.ts, *.tsx, *.js
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($root.Path.Length + 1)
        Write-Host "Exporting: $relPath"
        Add-Content -Path $outFile -Value "`n----------------------------------------------------------------"
        Add-Content -Path $outFile -Value "FILE: $relPath"
        Add-Content -Path $outFile -Value "----------------------------------------------------------------`n"
        Get-Content -Path $file.FullName | Add-Content -Path $outFile
    }
}

Write-Host "`nDone! Saved to $outFile"
Write-Host "Total size: $((Get-Item $outFile).Length / 1KB) KB"
