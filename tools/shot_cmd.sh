#!/usr/bin/env bash
# Chup anh terminal THAT (xterm) cho mot lenh chay o thu muc bat ky -> ANDD/report_latex/figures
# Usage: shot_cmd.sh <id> <workdir> <prompt_path> <command> <wait> [cols] [rows] [fontsize]
ROOT="/home/son/KTANM_final_report/ANDD"
ID="$1"; WORKDIR="$2"; PPATH="$3"; CMD="$4"; WAIT="${5:-5}"; COLS="${6:-100}"; ROWS="${7:-30}"; FS="${8:-13}"
LOG="/tmp/andd_${ID}.log"
PNG="$ROOT/report_latex/figures/${ID}.png"
mkdir -p "$ROOT/report_latex/figures"
export DISPLAY=:0
export XAUTHORITY=$(ls -t /run/user/1000/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus

HOLD=$((WAIT + 25))
PROMPT="\033[1;32mson@Fremontz\033[0m:\033[1;34m${PPATH}\033[0m$ "
INNER="cd '$WORKDIR'; printf '${PROMPT}'; printf '%s\n' \"$CMD\"; { $CMD ; } 2>&1 | tee '$LOG'; printf '\n${PROMPT}'; sleep $HOLD"

xterm -geometry "${COLS}x${ROWS}" -fa 'DejaVu Sans Mono' -fs "$FS" \
  -bg '#11141b' -fg '#cdd3de' -title "Terminal" \
  -e bash -c "$INNER" &
XPID=$!
sleep "$WAIT"
WID=$(xdotool search --class XTerm 2>/dev/null | tail -1)
if [ -n "$WID" ]; then
  import -window "$WID" "$PNG" 2>/dev/null && echo "[shot_cmd] $PNG (wid=$WID)" || echo "[shot_cmd][FAIL capture] $ID"
else
  echo "[shot_cmd][FAIL no-window] $ID"
fi
kill "$XPID" 2>/dev/null
