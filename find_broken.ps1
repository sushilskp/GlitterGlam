$lines = Get-Content 'src\App.tsx' -Encoding UTF8
$patterns = @('Ã¢', 'â€', 'Â¦', 'Â§', 'â„', 'âš', 'Â', 'Ã', 'â')
Write-Output "Total lines: $($lines.Count)"
for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  foreach ($p in $patterns) {
    if ($line.Contains($p)) {
      $snippet = $line
      if ($snippet.Length -gt 250) { $snippet = $snippet.Substring(0, 250) + '...' }
      Write-Output ("{0,4}: {1}" -f ($i + 1), $snippet)
      break
    }
  }
}
