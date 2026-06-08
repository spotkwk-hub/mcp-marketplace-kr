/** ISMS-P 인증현황 캐시 타입 */

export interface IsmsPRecord {
  certType: string;   // 인증구분 (ISMS | ISMS-P)
  certNo: string;     // 인증번호
  company: string;    // 기업명
  scope: string;      // 인증의 범위
  validFrom: string;  // 인증 시작일 (YYYY-MM-DD)
  validTo: string;    // 인증 만료일 (YYYY-MM-DD)
}

export interface IsmsPCache {
  importedAt: string | null;
  count: number;
  records: IsmsPRecord[];
}
