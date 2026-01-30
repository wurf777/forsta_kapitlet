$body = @{
    title = "Docker Test Bok"
    author = "Test Författare"
    synopsis = "En testbok för Docker"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/books/create.php" -Method Post -Body $body -ContentType "application/json"
