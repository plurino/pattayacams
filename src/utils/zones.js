/**
 * Pattaya Regional Zones & Navigation Jump Coordinates
 */

export const PATTAYA_ZONES = {
  beach_road: {
    id: 'central_beach',
    name: 'Beach Road & Central',
    name_th: 'ถนนเลียบชายหาด',
    center: [12.9380, 100.8840],
    zoom: 16,
    color: '#00E5FF'
  },
  soi_6: {
    id: 'soi_6',
    name: 'Soi 6',
    name_th: 'ซอย 6',
    center: [12.9430, 100.8885],
    zoom: 17,
    color: '#FF2A6D'
  },
  soi_buakhao: {
    id: 'soi_buakhao',
    name: 'Soi Buakhao',
    name_th: 'ซอยบัวขาว',
    center: [12.9315, 100.8870],
    zoom: 17,
    color: '#EAB308'
  },
  walking_street: {
    id: 'walking_street',
    name: 'Walking Street',
    name_th: 'วอล์คกิ้งสตรีท',
    center: [12.9255, 100.8725],
    zoom: 17,
    color: '#FF2A6D'
  },
  jomtien: {
    id: 'jomtien',
    name: 'Jomtien Beach',
    name_th: 'หาดจอมเทียน',
    center: [12.8950, 100.8750],
    zoom: 15,
    color: '#10B981'
  },
  naklua: {
    id: 'naklua',
    name: 'Naklua & Wong Amat',
    name_th: 'นาเกลือ / วงศ์อมาตย์',
    center: [12.9720, 100.8920],
    zoom: 15,
    color: '#F59E0B'
  },
  pratumnak: {
    id: 'pratumnak',
    name: 'Pratumnak Hill',
    name_th: 'เขาพระตำหนัก',
    center: [12.9220, 100.8630],
    zoom: 15,
    color: '#3B82F6'
  }
};

export const QUICK_JUMP_TARGETS = [
  { label: 'Beach Road', ...PATTAYA_ZONES.beach_road },
  { label: 'Soi 6', ...PATTAYA_ZONES.soi_6 },
  { label: 'Soi Buakhao', ...PATTAYA_ZONES.soi_buakhao },
  { label: 'Walking St', ...PATTAYA_ZONES.walking_street },
  { label: 'Jomtien', ...PATTAYA_ZONES.jomtien },
];
