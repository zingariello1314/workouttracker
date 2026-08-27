/**
 * Tables brutes Momentum V1 — [perf max série, volume / jour] par palier.
 */

import { EXERCISE_GRADE_LADDER } from '../../services/xp/exerciseGradeLadder';

export function rowsFromTuples(tuples) {
  return tuples.map(([performanceRequired, volumePerDay], sortIndex) => ({
    sortIndex,
    gradeId: EXERCISE_GRADE_LADDER[sortIndex]?.id || `tier_${sortIndex}`,
    performanceRequired,
    volumePerDay
  }));
}

// ─── Pompes classiques ───────────────────────────────────────────────────────

export const PUSHUPS_MALE_18_24 = rowsFromTuples([
  [8, 10], [11, 20], [14, 30], [18, 45], [22, 60], [27, 80], [32, 105], [38, 130],
  [44, 160], [51, 195], [59, 235], [67, 280], [77, 320], [88, 360], [100, 400]
]);

export const PUSHUPS_MALE_25_29 = rowsFromTuples([
  [8, 10], [11, 20], [14, 30], [18, 45], [22, 60], [26, 80], [31, 105], [37, 130],
  [43, 160], [50, 195], [58, 235], [66, 280], [76, 320], [87, 360], [100, 400]
]);

export const PUSHUPS_MALE_30_34 = rowsFromTuples([
  [7, 10], [10, 20], [13, 30], [17, 45], [21, 60], [25, 80], [30, 105], [36, 130],
  [42, 160], [49, 195], [57, 235], [65, 280], [75, 320], [86, 360], [100, 400]
]);

export const PUSHUPS_MALE_35_39 = rowsFromTuples([
  [7, 10], [10, 20], [13, 30], [17, 45], [21, 60], [25, 80], [29, 105], [35, 130],
  [41, 160], [48, 195], [56, 235], [64, 280], [74, 320], [85, 360], [100, 400]
]);

export const PUSHUPS_MALE_40_44 = rowsFromTuples([
  [6, 10], [9, 20], [12, 30], [16, 45], [20, 60], [24, 80], [28, 105], [34, 130],
  [40, 160], [47, 195], [55, 235], [63, 280], [73, 320], [84, 360], [100, 400]
]);

export const PUSHUPS_MALE_45_50 = rowsFromTuples([
  [6, 10], [9, 20], [12, 30], [16, 45], [20, 60], [24, 80], [27, 105], [33, 130],
  [39, 160], [46, 195], [54, 235], [62, 280], [72, 320], [83, 360], [100, 400]
]);

export const PUSHUPS_MALE = {
  '18-20': PUSHUPS_MALE_18_24,
  '21-24': PUSHUPS_MALE_18_24,
  '25-29': PUSHUPS_MALE_25_29,
  '30-34': PUSHUPS_MALE_30_34,
  '35-39': PUSHUPS_MALE_35_39,
  '40-44': PUSHUPS_MALE_40_44,
  '45-50': PUSHUPS_MALE_45_50
};

// ─── Tractions pronation ─────────────────────────────────────────────────────

export const PULLUPS_MALE_18_29 = rowsFromTuples([
  [2, 5], [3, 8], [4, 10], [5, 12], [6, 15], [7, 18], [8, 20], [10, 24], [12, 28],
  [14, 32], [16, 38], [18, 44], [21, 50], [25, 55], [30, 60]
]);

export const PULLUPS_MALE_30_34 = rowsFromTuples([
  [2, 5], [3, 8], [4, 10], [5, 12], [6, 15], [7, 18], [8, 20], [10, 24], [12, 28],
  [13, 32], [15, 38], [17, 44], [20, 50], [24, 55], [29, 60]
]);

export const PULLUPS_MALE_35_39 = rowsFromTuples([
  [2, 5], [3, 8], [4, 10], [5, 12], [6, 15], [7, 18], [8, 20], [10, 24], [12, 28],
  [13, 32], [15, 38], [17, 44], [20, 50], [23, 55], [28, 60]
]);

export const PULLUPS_MALE_40_44 = rowsFromTuples([
  [1, 5], [2, 8], [3, 10], [4, 12], [5, 15], [6, 18], [7, 20], [9, 24], [11, 28],
  [12, 32], [14, 38], [16, 44], [19, 50], [22, 55], [27, 60]
]);

export const PULLUPS_MALE_45_50 = rowsFromTuples([
  [1, 5], [2, 8], [3, 10], [4, 12], [5, 15], [6, 18], [7, 20], [9, 24], [11, 28],
  [12, 32], [14, 38], [16, 44], [18, 50], [21, 55], [26, 60]
]);

export const PULLUPS_MALE = {
  '18-20': PULLUPS_MALE_18_29,
  '21-24': PULLUPS_MALE_18_29,
  '25-29': PULLUPS_MALE_18_29,
  '30-34': PULLUPS_MALE_30_34,
  '35-39': PULLUPS_MALE_35_39,
  '40-44': PULLUPS_MALE_40_44,
  '45-50': PULLUPS_MALE_45_50
};

// ─── Dips ────────────────────────────────────────────────────────────────────

export const DIPS_MALE_18_39 = rowsFromTuples([
  [5, 20], [7, 30], [9, 40], [11, 55], [13, 70], [15, 85], [17, 100], [19, 115],
  [21, 130], [23, 145], [25, 160], [27, 175], [29, 185], [31, 195], [33, 200]
]);

export const DIPS_MALE_40_44 = rowsFromTuples([
  [4, 20], [6, 30], [8, 40], [10, 55], [12, 70], [14, 85], [16, 100], [18, 115],
  [20, 130], [22, 145], [24, 160], [26, 175], [28, 185], [30, 195], [32, 200]
]);

export const DIPS_MALE_45_50 = rowsFromTuples([
  [3, 20], [5, 30], [7, 40], [9, 55], [11, 70], [13, 85], [15, 100], [17, 115],
  [19, 130], [21, 145], [23, 160], [25, 175], [27, 185], [29, 195], [31, 200]
]);

export const DIPS_MALE = {
  '18-20': DIPS_MALE_18_39,
  '21-24': DIPS_MALE_18_39,
  '25-29': DIPS_MALE_18_39,
  '30-34': DIPS_MALE_18_39,
  '35-39': DIPS_MALE_18_39,
  '40-44': DIPS_MALE_40_44,
  '45-50': DIPS_MALE_45_50
};

// ─── Pompes tension continue ─────────────────────────────────────────────────

export const PUSHUPS_TENSION_MALE_ALL = rowsFromTuples([
  [8, 15], [14, 25], [20, 35], [26, 50], [32, 65], [38, 80], [44, 100], [50, 125],
  [56, 150], [62, 180], [68, 220], [72, 260], [75, 300], [78, 350], [80, 400]
]);

export const PUSHUPS_TENSION_MALE = {
  '18-20': PUSHUPS_TENSION_MALE_ALL,
  '21-24': PUSHUPS_TENSION_MALE_ALL,
  '25-29': PUSHUPS_TENSION_MALE_ALL,
  '30-34': PUSHUPS_TENSION_MALE_ALL,
  '35-39': PUSHUPS_TENSION_MALE_ALL,
  '40-44': PUSHUPS_TENSION_MALE_ALL,
  '45-50': PUSHUPS_TENSION_MALE_ALL
};

// ─── Pompes inclinées (mains surélevées) ─────────────────────────────────────

export const PUSHUPS_INCLINE_MALE_ALL = rowsFromTuples([
  [15, 15], [25, 25], [35, 35], [45, 50], [55, 65], [65, 80], [75, 100], [85, 125],
  [95, 150], [105, 180], [115, 220], [125, 260], [135, 300], [143, 350], [150, 400]
]);

export const PUSHUPS_INCLINE_MALE = {
  '18-20': PUSHUPS_INCLINE_MALE_ALL,
  '21-24': PUSHUPS_INCLINE_MALE_ALL,
  '25-29': PUSHUPS_INCLINE_MALE_ALL,
  '30-34': PUSHUPS_INCLINE_MALE_ALL,
  '35-39': PUSHUPS_INCLINE_MALE_ALL,
  '40-44': PUSHUPS_INCLINE_MALE_ALL,
  '45-50': PUSHUPS_INCLINE_MALE_ALL
};

// ─── Pompes déclinées ────────────────────────────────────────────────────────

export const PUSHUPS_DECLINE_MALE_ALL = rowsFromTuples([
  [10, 15], [17, 25], [24, 35], [31, 50], [38, 65], [45, 80], [52, 100], [59, 125],
  [66, 150], [73, 180], [80, 220], [87, 260], [92, 300], [96, 350], [100, 400]
]);

export const PUSHUPS_DECLINE_MALE = {
  '18-20': PUSHUPS_DECLINE_MALE_ALL,
  '21-24': PUSHUPS_DECLINE_MALE_ALL,
  '25-29': PUSHUPS_DECLINE_MALE_ALL,
  '30-34': PUSHUPS_DECLINE_MALE_ALL,
  '35-39': PUSHUPS_DECLINE_MALE_ALL,
  '40-44': PUSHUPS_DECLINE_MALE_ALL,
  '45-50': PUSHUPS_DECLINE_MALE_ALL
};

// ─── Tractions supination ────────────────────────────────────────────────────

export const PULLUPS_SUPINATION_MALE_ALL = rowsFromTuples([
  [5, 15], [8, 25], [11, 35], [14, 50], [17, 65], [20, 80], [23, 100], [26, 125],
  [29, 150], [33, 180], [36, 220], [39, 260], [43, 300], [46, 350], [50, 400]
]);

export const PULLUPS_SUPINATION_MALE = {
  '18-20': PULLUPS_SUPINATION_MALE_ALL,
  '21-24': PULLUPS_SUPINATION_MALE_ALL,
  '25-29': PULLUPS_SUPINATION_MALE_ALL,
  '30-34': PULLUPS_SUPINATION_MALE_ALL,
  '35-39': PULLUPS_SUPINATION_MALE_ALL,
  '40-44': PULLUPS_SUPINATION_MALE_ALL,
  '45-50': PULLUPS_SUPINATION_MALE_ALL
};

// ─── Curl haltère (perf = 1RM kg / haltère, vol = kg×reps / jour) ─────────────

const CURL_DB_VOL = [100, 120, 150, 175, 210, 240, 270, 315, 350, 400, 440, 495, 540, 600, 650];

function curlRows(perfs, volumes = CURL_DB_VOL) {
  return rowsFromTuples(perfs.map((p, i) => [p, volumes[i]]));
}

export const CURL_DB_MALE_18_24 = curlRows([5, 7, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45]);
export const CURL_DB_MALE_25_39 = curlRows([5, 7, 10, 13, 16, 19, 21, 24, 27, 30, 33, 36, 39, 42, 45]);
export const CURL_DB_MALE_40_44 = curlRows([5, 7, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 41, 44]);
export const CURL_DB_MALE_45_50 = curlRows([5, 7, 9, 12, 15, 18, 20, 23, 26, 29, 32, 35, 38, 41, 43]);

export const CURL_DUMBBELL_MALE = {
  '18-20': CURL_DB_MALE_18_24,
  '21-24': CURL_DB_MALE_18_24,
  '25-29': CURL_DB_MALE_25_39,
  '30-34': CURL_DB_MALE_25_39,
  '35-39': CURL_DB_MALE_25_39,
  '40-44': CURL_DB_MALE_40_44,
  '45-50': CURL_DB_MALE_45_50
};

export const CURL_HAMMER_MALE_18_24 = CURL_DB_MALE_18_24;
export const CURL_HAMMER_MALE_25_39 = curlRows([5, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 45]);
export const CURL_HAMMER_MALE_40_44 = curlRows([5, 7, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 44]);
export const CURL_HAMMER_MALE_45_50 = curlRows([5, 7, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45]);

export const CURL_HAMMER_MALE = {
  '18-20': CURL_HAMMER_MALE_18_24,
  '21-24': CURL_HAMMER_MALE_18_24,
  '25-29': CURL_HAMMER_MALE_25_39,
  '30-34': CURL_HAMMER_MALE_25_39,
  '35-39': CURL_HAMMER_MALE_25_39,
  '40-44': CURL_HAMMER_MALE_40_44,
  '45-50': CURL_HAMMER_MALE_45_50
};

const CURL_ZOTTMAN_VOL = [80, 100, 125, 150, 180, 210, 240, 280, 315, 360, 400, 450, 495, 550, 600];

export const CURL_ZOTTMAN_MALE_18_24 = curlRows(
  [4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 30, 33, 35, 38, 40],
  CURL_ZOTTMAN_VOL
);
export const CURL_ZOTTMAN_MALE_25_29 = curlRows(
  [4, 6, 8, 10, 13, 15, 18, 21, 24, 27, 30, 33, 35, 38, 40],
  CURL_ZOTTMAN_VOL
);
export const CURL_ZOTTMAN_MALE_30_34 = curlRows(
  [4, 6, 8, 10, 13, 15, 18, 21, 24, 27, 30, 33, 35, 37, 40],
  CURL_ZOTTMAN_VOL
);
export const CURL_ZOTTMAN_MALE_35_39 = curlRows(
  [4, 6, 8, 10, 13, 15, 18, 21, 24, 27, 30, 33, 35, 37, 39],
  CURL_ZOTTMAN_VOL
);
export const CURL_ZOTTMAN_MALE_40_44 = curlRows(
  [4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 30, 33, 35, 37, 39],
  CURL_ZOTTMAN_VOL
);
export const CURL_ZOTTMAN_MALE_45_50 = curlRows(
  [4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 30, 33, 35, 37, 38],
  CURL_ZOTTMAN_VOL
);

export const CURL_ZOTTMAN_MALE = {
  '18-20': CURL_ZOTTMAN_MALE_18_24,
  '21-24': CURL_ZOTTMAN_MALE_18_24,
  '25-29': CURL_ZOTTMAN_MALE_25_29,
  '30-34': CURL_ZOTTMAN_MALE_30_34,
  '35-39': CURL_ZOTTMAN_MALE_35_39,
  '40-44': CURL_ZOTTMAN_MALE_40_44,
  '45-50': CURL_ZOTTMAN_MALE_45_50
};
