/**
 * PattayaCams Affiliate Deep-Link Engine
 * Generates dynamic weekend dates and localized travel affiliate links
 */

const DEFAULT_AGODA_CID = '1894212';
const DEFAULT_12GO_AFFILIATE = 'pattayacams';
const DEFAULT_AIRALO_CODE = 'PATTAYA10';

/**
 * Computes next upcoming Friday (check-in) and Sunday (check-out)
 * If today is Friday, check-in is today.
 * If today is Saturday or Sunday, targets the NEXT upcoming Friday.
 * Returns ISO strings: { checkin: 'YYYY-MM-DD', checkout: 'YYYY-MM-DD', formattedLabel: 'Oct 11 - Oct 13' }
 */
export function getUpcomingWeekendDates(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

  // Calculate days until upcoming Friday
  let daysUntilFriday = (5 - day + 7) % 7;
  if (daysUntilFriday === 0 && d.getHours() >= 18) {
    // If it's already Friday evening, push to next weekend
    daysUntilFriday = 7;
  } else if (day === 6) {
    // Saturday -> next Friday is 6 days away
    daysUntilFriday = 6;
  }

  const checkinDate = new Date(d);
  checkinDate.setDate(d.getDate() + daysUntilFriday);

  const checkoutDate = new Date(checkinDate);
  checkoutDate.setDate(checkinDate.getDate() + 2); // Sunday

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedLabel = `${monthNames[checkinDate.getMonth()]} ${checkinDate.getDate()} - ${monthNames[checkoutDate.getMonth()]} ${checkoutDate.getDate()}`;

  return {
    checkin: formatDate(checkinDate),
    checkout: formatDate(checkoutDate),
    formattedLabel,
  };
}

/**
 * Agoda Partner Search URL with dynamic weekend checkin/checkout
 */
export function buildAgodaHotelUrl(hotelId, cid = DEFAULT_AGODA_CID) {
  const { checkin, checkout } = getUpcomingWeekendDates();
  return `https://www.agoda.com/partners/partnersearch.aspx?cid=${cid}&hotel=${hotelId}&checkin=${checkin}&checkout=${checkout}&pcs=1`;
}

/**
 * General Pattaya Agoda Search URL
 */
export function buildAgodaPattayaSearchUrl(cid = DEFAULT_AGODA_CID) {
  const { checkin, checkout } = getUpcomingWeekendDates();
  return `https://www.agoda.com/partners/partnersearch.aspx?cid=${cid}&city=8584&checkin=${checkin}&checkout=${checkout}`;
}

/**
 * 12Go Private Airport Transfer Link (BKK/DMK to Pattaya Hotel Door)
 * Fixed private sedan rate ~1,200 THB / ~$35 USD
 */
export function build12GoTransferUrl(affiliateId = DEFAULT_12GO_AFFILIATE) {
  return `https://12go.asia/en/travel/suvarnabhumi-airport/pattaya?z=${affiliateId}&sub_id=pc_taxi_card`;
}

/**
 * Airalo Thailand Tourist 5G eSIM Link
 */
export function buildAiraloEsimUrl(promoCode = DEFAULT_AIRALO_CODE) {
  return `https://airalo.tp.st/pattaya?referral=${promoCode}&country=thailand`;
}

/**
 * Flight Search URL pre-filled for Bangkok Suvarnabhumi (BKK)
 */
export function buildFlightSearchUrl(departureCode = '', travelDate = '') {
  const base = 'https://www.aviasales.com/search';
  const destination = 'BKK';
  if (departureCode && travelDate) {
    return `${base}?origin=${departureCode}&destination=${destination}&depart_date=${travelDate}&marker=pattayacams`;
  }
  return `https://www.aviasales.com/?destination=${destination}&marker=pattayacams`;
}

/**
 * Developer Support Link
 */
export function getKofiTipUrl() {
  return 'https://ko-fi.com/pattayacams';
}

/**
 * Official Telegram Group Link (Legal Safe Harbor)
 */
export function getTelegramCommunityUrl() {
  return 'https://t.me/pattayacams_live';
}
