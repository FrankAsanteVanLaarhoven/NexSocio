# shellcheck shell=bash
# Resolve ngrok binary — prefer Homebrew 3.20+ over stale /usr/local/bin
resolve_ngrok_bin() {
  NGROK_BIN=""
  for candidate in /opt/homebrew/bin/ngrok /usr/local/bin/ngrok "$(command -v ngrok 2>/dev/null)"; do
    [[ -z "${candidate}" || ! -x "${candidate}" ]] && continue
    ver=$("${candidate}" version 2>/dev/null | awk '{print $3}' | tr -d 'v' || true)
    [[ -z "${ver}" ]] && continue
    major=$(echo "${ver}" | cut -d. -f1)
    minor=$(echo "${ver}" | cut -d. -f2)
    if [[ "${major}" -gt 3 ]] || [[ "${major}" -eq 3 && "${minor}" -ge 20 ]]; then
      NGROK_BIN="${candidate}"
      return 0
    fi
  done
  return 1
}