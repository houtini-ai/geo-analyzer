@echo off
cd /d C:\MCP\geo-analyzer
git add -A
git commit -m "Fix heading detection: Preserve HTML structure for accurate analysis"
git push
