$body = @{
    email = "test@example.com"
    password = "testpassword123"
    name = "Test User"
} | ConvertTo-Json

Write-Host "Registering user..." -ForegroundColor Cyan
$registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/register.php" -Method Post -Body $body -ContentType "application/json"
$registerResponse | ConvertTo-Json

Write-Host "`nLogging in..." -ForegroundColor Cyan
$loginBody = @{
    email = "test@example.com"
    password = "testpassword123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login.php" -Method Post -Body $loginBody -ContentType "application/json"
$loginResponse | ConvertTo-Json

Write-Host "`nToken received: $($loginResponse.token)" -ForegroundColor Green
