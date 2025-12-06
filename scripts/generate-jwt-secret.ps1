# Skapa en säker JWT-nyckel
# Kör detta i PowerShell för att generera en slumpmässig JWT_SECRET

$bytes = New-Object Byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

Write-Host "Din JWT_SECRET:"
Write-Host $secret
Write-Host ""
Write-Host "Kopiera denna och lägg in i api/.env filen"
