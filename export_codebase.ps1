$outFile = "full_codebase_dump.txt"
$root = Get-Location
$dirs = @("app", "components", "lib", "hooks", "types", "public")
$specificFiles = @("middleware.ts", "tailwind.config.ts", "components.json", "next.config.mjs", "package.json", "tsconfig.json")

Set-Content -Path $outFile -Value "TROVE PROJECT CODEBASE DUMP"
Add-Content -Path $outFile -Value "Generated: $(Get-Date)"
Add-Content -Path $outFile -Value "----------------------------------------------------------------`n"

# Process Directories
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir -Recurse -Include *.ts,*.tsx,*.css,*.js,*.json
        foreach ($file in $files) {
            $relPath = $file.FullName.Substring($root.Path.Length + 1)
            Write-Host "Exporting: $relPath"
            Add-Content -Path $outFile -Value "`n================================================================"
            Add-Content -Path $outFile -Value "FILE: $relPath"
            Add-Content -Path $outFile -Value "================================================================`n"
            Get-Content -Path $file.FullName | Add-Content -Path $outFile
        }
    }
}

# Process Specific Files
foreach ($fileName in $specificFiles) {
    if (Test-Path $fileName) {
        Write-Host "Exporting: $fileName"
        Add-Content -Path $outFile -Value "`n================================================================"
        Add-Content -Path $outFile -Value "FILE: $fileName"
        Add-Content -Path $outFile -Value "================================================================`n"
        Get-Content -Path $fileName | Add-Content -Path $outFile
    }
}

Write-Host "Done! Saved to $outFile"
