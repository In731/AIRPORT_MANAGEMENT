$url = "https://download.oracle.com/otn_software/nt/instantclient/1922000/instantclient-basiclite-windows.x64-19.22.0.0.0dbru.zip"
$zipPath = "C:\Users\Kaushik\Documents\Airport_Management\instantclient.zip"
$extractPath = "C:\Users\Kaushik\Documents\Airport_Management\oracle_client"

Write-Host "Downloading Oracle Instant Client..."
Invoke-WebRequest -Uri $url -OutFile $zipPath
Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
Write-Host "Done."
