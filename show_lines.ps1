$content = Get-Content 'src\App.tsx' -Encoding UTF8
for ($n = 794; $n -lt 833; $n++) {
  Write-Output ("{0,4}|{1}" -f $n, $content[$n])
}
