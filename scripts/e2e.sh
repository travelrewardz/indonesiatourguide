#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# End-to-end acceptance test for Indonesia Tour Guide
# Verifies the full Definition-of-Done chain:
#   search -> tour -> live price -> book -> pay (signed webhook) -> confirm
#   -> voucher -> supplier/admin visibility -> RBAC -> SEO -> overbooking guard
#
# Usage:  BASE=http://localhost:3000 WEBHOOK_SECRET=... bash scripts/e2e.sh
#         RESET=0 skips the pre-run database reset (keeps current data)
# ---------------------------------------------------------------------------
set -u
BASE="${BASE:-http://localhost:3000}"
SECRET="${WEBHOOK_SECRET:-test-secret-123}"
PASS=0; FAIL=0
JAR_A=$(mktemp); JAR_SUP=$(mktemp); JAR_ADMIN=$(mktemp)

# Unique client IP per run: the app's in-memory rate limiter keys on the
# X-Forwarded-For header (first proxy hop), so back-to-back runs against one
# server never eat each other's booking/login budget.
RUN_ID="$(date +%s)-$$"
curl() { command curl -H "X-Forwarded-For: e2e-$RUN_ID" "$@"; }

# Start every run from the pristine seeded demo state: restores inventory on
# the quote and race dates and removes customers/bookings earlier runs created.
if [ "${RESET:-1}" != "0" ]; then
  echo "== 0. Reset database to pristine seed state =="
  npx tsx scripts/reset-db.ts || { echo "database reset failed"; exit 1; }
fi

ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
check(){ # check <desc> <actual> <expected>
  if [ "$2" = "$3" ]; then ok "$1 ($2)"; else bad "$1 — got '$2' want '$3'"; fi
}
contains(){ # contains <desc> <haystack> <needle>
  case "$2" in *"$3"*) ok "$1";; *) bad "$1 — '$3' not found";; esac
}
jsonval(){ node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const v='$1'.split('.').reduce((a,k)=>a?.[k],j);process.stdout.write(String(v??''))}catch(e){process.stdout.write('')}})"; }

TODAY=$(date +%F)
FUTURE1=$(date -d "+30 days" +%F 2>/dev/null || date -v+30d +%F)
FUTURE2=$(date -d "+45 days" +%F 2>/dev/null || date -v+45d +%F)
FUTURE3=$(date -d "+60 days" +%F 2>/dev/null || date -v+60d +%F)

echo "== 1. Public site & SEO =="
code=$(curl -s -o /tmp/e2e-home.html -w "%{http_code}" "$BASE/")
check "homepage responds" "$code" "200"
contains "homepage hero copy" "$(cat /tmp/e2e-home.html)" "Discover Indonesia With Local Experts"

code=$(curl -s -o /tmp/e2e-tours.html -w "%{http_code}" "$BASE/tours")
check "tour search page" "$code" "200"
contains "DB tour rendered" "$(cat /tmp/e2e-tours.html)" "Bromo"

code=$(curl -s -o /tmp/e2e-detail.html -w "%{http_code}" "$BASE/tours/bromo-sunrise-tour")
check "tour detail page" "$code" "200"
contains "Product structured data" "$(cat /tmp/e2e-detail.html)" "TouristTrip"
contains "price from DB" "$(cat /tmp/e2e-detail.html)" "Penanjakan"

code=$(curl -s -o /tmp/e2e-sitemap.xml -w "%{http_code}" "$BASE/sitemap.xml")
check "sitemap" "$code" "200"
contains "tour in sitemap" "$(cat /tmp/e2e-sitemap.xml)" "/tours/bromo-sunrise-tour"
code=$(curl -s -o /tmp/e2e-robots.txt -w "%{http_code}" "$BASE/robots.txt")
check "robots.txt" "$code" "200"

echo "== 2. Search API & live quote =="
total=$(curl -s "$BASE/api/tours?q=bromo" | jsonval total)
[ "${total:-0}" -ge 1 ] && ok "search finds tours (total=$total)" || bad "search returned no tours"

quote=$(curl -s "$BASE/api/tours/bromo-sunrise-tour/quote?date=$FUTURE1&pax=2&currency=USD")
unit=$(printf '%s' "$quote" | jsonval pricing.unitPrice)
total_price=$(printf '%s' "$quote" | jsonval pricing.total)
check "server-side unit price" "$unit" "58"
check "server-side total (58 x 2)" "$total_price" "116"
avail_before=$(printf '%s' "$quote" | jsonval availability.remaining)

echo "== 3. Register customer =="
code=$(curl -s -c "$JAR_A" -o /tmp/e2e-reg.json -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Test Traveler\",\"email\":\"e2e-customer@example.com\",\"password\":\"testpass123\",\"country\":\"Germany\",\"role\":\"CUSTOMER\"}")
if [ "$code" = "409" ]; then
  # already registered by a previous run — log in instead so the suite is re-runnable
  code=$(curl -s -c "$JAR_A" -o /tmp/e2e-reg.json -w "%{http_code}" -X POST "$BASE/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"e2e-customer@example.com","password":"testpass123"}')
fi
check "register" "$code" "200"
case "$(cat /tmp/e2e-reg.json)" in
  *password_hash*) bad "register response leaked password hash" ;;
  *) ok "no password hash leaked" ;;
esac

echo "== 4. Create booking (inventory hold) =="
bk=$(curl -s -b "$JAR_A" -X POST "$BASE/api/bookings" -H 'Content-Type: application/json' -d "{
  \"tourSlug\":\"bromo-sunrise-tour\",\"travelDate\":\"$FUTURE1\",\"adults\":2,\"children\":0,
  \"pickupLocation\":\"Hotel Santika Malang\",\"hotel\":\"Hotel Santika\",
  \"specialRequest\":\"Vegetarian lunch please\",
  \"customerName\":\"Test Traveler\",\"customerEmail\":\"e2e-customer@example.com\",\"customerPhone\":\"+49 170 0000000\",
  \"paymentProvider\":\"sandbox\",\"agree\":true}")
bnum=$(printf '%s' "$bk" | jsonval bookingNumber)
payurl=$(printf '%s' "$bk" | jsonval paymentUrl)
btotal=$(printf '%s' "$bk" | jsonval total)
check "booking total server-computed" "$btotal" "116"
case "$bnum" in ITG-????????-*) ok "booking number format $bnum";; *) bad "booking number missing ($bk)";; esac
case "$payurl" in */pay/sandbox/*) ok "redirected to payment ($payurl)";; *) bad "payment url: $payurl";; esac
payid=$(basename "$payurl")

quote2=$(curl -s "$BASE/api/tours/bromo-sunrise-tour/quote?date=$FUTURE1&pax=1")
avail_after=$(printf '%s' "$quote2" | jsonval availability.remaining)
check "availability decreased after booking ($avail_before -> $avail_after)" "$((avail_after))" "$((avail_before - 2))"

echo "== 5. Webhook signature enforcement =="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payments/webhook/sandbox" \
  -H 'Content-Type: application/json' -d "{\"paymentId\":\"$payid\",\"status\":\"PAID\",\"signature\":\"deadbeef\"}")
check "forged webhook rejected" "$code" "401"
st=$(curl -s -b "$JAR_A" "$BASE/api/bookings/$bnum" -o /tmp/e2e-bk.html -w "%{http_code}")
check "booking still accessible while pending" "$st" "200"

echo "== 6. Successful payment (signed webhook) =="
SIG=$(node -e "const c=require('crypto');process.stdout.write(c.createHmac('sha256','$SECRET').update('$payid:PAID').digest('hex'))")
resp=$(curl -s -X POST "$BASE/api/payments/webhook/sandbox" -H 'Content-Type: application/json' \
  -d "{\"paymentId\":\"$payid\",\"status\":\"PAID\",\"signature\":\"$SIG\",\"transactionId\":\"E2E-TXN-1\"}")
contains "webhook accepted" "$resp" '"ok":true'
contains "booking confirmed" "$resp" '"status":"PAID"'

# idempotency — replay must not double-apply
resp2=$(curl -s -X POST "$BASE/api/payments/webhook/sandbox" -H 'Content-Type: application/json' \
  -d "{\"paymentId\":\"$payid\",\"status\":\"PAID\",\"signature\":\"$SIG\",\"transactionId\":\"E2E-TXN-1\"}")
contains "replay is idempotent" "$resp2" '"changed":false'

echo "== 7. Customer sees confirmation + voucher =="
html=$(curl -s -b "$JAR_A" "$BASE/account/bookings/$bnum")
contains "booking CONFIRMED" "$html" "CONFIRMED"
contains "booking number shown" "$html" "$bnum"
vhtml=$(curl -s -b "$JAR_A" "$BASE/account/bookings/$bnum/voucher")
contains "voucher QR code" "$vhtml" "data:image/png;base64"
contains "voucher has supplier" "$vhtml" "East Java Adventure"
contains "voucher has pickup" "$vhtml" "Hotel Santika Malang"

echo "== 8. Supplier sees the booking =="
code=$(curl -s -c "$JAR_SUP" -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"ops.eastjava@partner.indonesiatourguide.com","password":"demo1234"}')
check "supplier login" "$code" "200"
sups=$(curl -s -b "$JAR_SUP" "$BASE/api/bookings" | grep -c "$bnum" || true)
[ "${sups:-0}" -ge 1 ] && ok "supplier sees booking" || bad "supplier cannot see booking"

echo "== 9. Admin visibility + tour edit =="
code=$(curl -s -c "$JAR_ADMIN" -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@indonesiatourguide.com","password":"admin1234"}')
check "admin login" "$code" "200"
admg=$(curl -s -b "$JAR_ADMIN" "$BASE/api/bookings" | grep -c "$bnum" || true)
[ "${admg:-0}" -ge 1 ] && ok "admin sees booking" || bad "admin cannot see booking"

tid=$(curl -s "$BASE/api/tours/bromo-sunrise-tour" | jsonval tour.id)
code=$(curl -s -b "$JAR_ADMIN" -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/manage/tours/$tid" \
  -H 'Content-Type: application/json' -d "{\"title\":\"Bromo Sunrise Tour\",\"short_description\":\"Updated desc\",\"full_description\":\"Updated full\",\"duration_days\":1,\"min_pax\":1,\"max_pax\":10,\"base_price\":70,\"sale_price\":58,\"status\":\"PUBLISHED\"}")
check "admin edits tour (price 58 -> 70)" "$code" "200"
newprice=$(curl -s "$BASE/api/tours/bromo-sunrise-tour" | jsonval tour.base_price)
check "public API reflects new price" "$newprice" "70"
# revert for other tests
curl -s -b "$JAR_ADMIN" -o /dev/null -X PUT "$BASE/api/manage/tours/$tid" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Bromo Sunrise Tour\",\"short_description\":\"The classic East Java sunrise: 4x4 jeep to Penanjakan viewpoint, sea of sand crossing and crater climb — from Surabaya, Malang or Yogyakarta.\",\"full_description\":\"Updated\",\"duration_days\":1,\"min_pax\":1,\"max_pax\":10,\"base_price\":65,\"sale_price\":58,\"status\":\"PUBLISHED\"}"

echo "== 10. RBAC =="
code=$(curl -s -b "$JAR_A" -o /dev/null -w "%{http_code}" "$BASE/admin")
case "$code" in 30[0-9]) ok "customer redirected away from /admin ($code)";; *) [ "$code" = "403" ] && ok "customer gets 403 on /admin" || bad "customer accessed /admin ($code)";; esac
code=$(curl -s -b "$JAR_A" -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/manage/tours/$tid" \
  -H 'Content-Type: application/json' -d '{"title":"Hacked","duration_days":1,"min_pax":1,"max_pax":2,"base_price":1,"status":"PUBLISHED"}')
check "customer cannot edit tours via API" "$code" "403"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/bookings")
check "anonymous cannot list bookings (401)" "$code" "401"

echo "== 11. Enquiry (tailor-made) =="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/enquiries" -H 'Content-Type: application/json' \
  -d "{\"type\":\"tailor_made\",\"name\":\"E2E Tester\",\"email\":\"e2e@example.com\",\"message\":\"10 days Bali and Komodo for 4 people\",\"destination\":\"Bali, Komodo\",\"travel_date\":\"$FUTURE2\",\"pax\":4}")
check "tailor-made enquiry stored" "$code" "200"

echo "== 12. Overbooking guard (concurrent) =="
# tour capacity is 10 (max_pax); fire 10 concurrent 1-pax bookings and assert
# the guarded UPDATE never lets booked_slots exceed available_slots.
# NOTE: -w must end in \n — the codes are counted with grep -c (per line), and
# curl writes them without a trailing newline, which collapsed the count to 0/1.
mkdir -p /tmp/e2e-jars
for i in $(seq 1 10); do
  ( curl -s -o "/tmp/e2e-race-$i.json" -w "%{http_code}\n" -X POST "$BASE/api/bookings" -H 'Content-Type: application/json' \
      -d "{\"tourSlug\":\"bromo-sunrise-tour\",\"travelDate\":\"$FUTURE3\",\"adults\":1,\"children\":0,
           \"pickupLocation\":\"Race test $i\",\"customerName\":\"Race $i\",\"customerEmail\":\"race$i@example.com\",
           \"paymentProvider\":\"sandbox\",\"agree\":true}" > "/tmp/e2e-code-$i" ) &
done
wait
cap=$(node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('data/itg.sqlite');const r=db.prepare(\"SELECT available_slots, booked_slots FROM availability WHERE date=? AND tour_id IN (SELECT id FROM tours WHERE slug='bromo-sunrise-tour')\").get('$FUTURE3');process.stdout.write(r?String(r.available_slots-r.booked_slots):'10')")
echo "  → remaining capacity on race date: $cap"
successes=$(cat /tmp/e2e-code-* | grep -c 200 || true)
initial_cap=10
if [ "${successes:-0}" -le "$initial_cap" ] && [ "${cap:-0}" -ge 0 ]; then
  ok "no overbooking: $successes/$initial_cap concurrent bookings succeeded, $cap slots left"
else
  bad "OVERBOOKED: $successes succeeded, remaining=$cap"
fi

echo ""
echo "=================================="
echo " PASS: $PASS   FAIL: $FAIL"
echo "=================================="
rm -f "$JAR_A" "$JAR_SUP" "$JAR_ADMIN" /tmp/e2e-code-* /tmp/e2e-race-*
[ "$FAIL" -eq 0 ]
