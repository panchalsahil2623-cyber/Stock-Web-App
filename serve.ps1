$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8081)
$listener.Start()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [string]$Status,
    [string]$ContentType,
    [byte[]]$Body
  )

  $headerText = @(
    "HTTP/1.1 $Status"
    "Content-Type: $ContentType"
    "Content-Length: $($Body.Length)"
    "Connection: close"
    ""
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

while ($true) {
  $client = $listener.AcceptTcpClient()

  try {
    $stream = $client.GetStream()
    $buffer = New-Object byte[] 8192
    $bytesRead = $stream.Read($buffer, 0, $buffer.Length)

    if ($bytesRead -le 0) {
      $client.Close()
      continue
    }

    $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
    $requestLine = ($requestText -split "`r?`n")[0]
    $parts = $requestLine -split " "
    $requestPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }

    if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq "/") {
      $requestPath = "/index.html"
    }

    $relativePath = $requestPath.TrimStart("/") -replace "/", "\"
    $candidatePath = Join-Path $root $relativePath
    $resolvedRoot = [System.IO.Path]::GetFullPath($root)
    $resolvedPath = [System.IO.Path]::GetFullPath($candidatePath)

    if (-not $resolvedPath.StartsWith($resolvedRoot) -or -not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
      Send-Response -Stream $stream -Status "404 Not Found" -ContentType "text/plain; charset=utf-8" -Body $body
      $client.Close()
      continue
    }

    $extension = [System.IO.Path]::GetExtension($resolvedPath).ToLowerInvariant()
    $contentType = $contentTypes[$extension]
    if (-not $contentType) {
      $contentType = "application/octet-stream"
    }

    $body = [System.IO.File]::ReadAllBytes($resolvedPath)
    Send-Response -Stream $stream -Status "200 OK" -ContentType $contentType -Body $body
    $client.Close()
  } catch {
    $client.Close()
  }
}
