-- AdMe Stage 0: Seed Data (참조 데이터 + 시스템 풀 초기화)
-- 사용자(auth.users)는 Supabase Auth 또는 Admin API로 별도 생성

-- ---------------------------------------------------------------------------
-- 시스템 수익 풀 초기화
-- ---------------------------------------------------------------------------

INSERT INTO public.system_pool_balances (pool_type, balance) VALUES
  ('reward_pool', 0),
  ('adme_hq', 0),
  ('ops_pool', 0),
  ('buffer_pool', 0)
ON CONFLICT (pool_type) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 지역 (시·도 + 샘플 구)
-- ---------------------------------------------------------------------------

INSERT INTO public.regions (code, name, sort_order) VALUES
  ('KR-11', '서울특별시', 1),
  ('KR-26', '부산광역시', 2),
  ('KR-27', '대구광역시', 3),
  ('KR-28', '인천광역시', 4),
  ('KR-29', '광주광역시', 5),
  ('KR-30', '대전광역시', 6),
  ('KR-31', '울산광역시', 7),
  ('KR-41', '경기도', 8),
  ('KR-42', '강원특별자치도', 9),
  ('KR-43', '충청북도', 10),
  ('KR-44', '충청남도', 11),
  ('KR-45', '전북특별자치도', 12),
  ('KR-46', '전라남도', 13),
  ('KR-47', '경상북도', 14),
  ('KR-48', '경상남도', 15),
  ('KR-50', '제주특별자치도', 16)
ON CONFLICT (code) DO NOTHING;

-- 서울 하위 구 샘플
INSERT INTO public.regions (code, name, parent_id, sort_order)
SELECT
  v.code,
  v.name,
  (SELECT id FROM public.regions WHERE code = 'KR-11'),
  v.sort_order
FROM (VALUES
  ('KR-11-JONGNO', '종로구', 1),
  ('KR-11-JUNG', '중구', 2),
  ('KR-11-YONGSAN', '용산구', 3),
  ('KR-11-SEONGDONG', '성동구', 4),
  ('KR-11-GWANGJIN', '광진구', 5),
  ('KR-11-DONGDAEMUN', '동대문구', 6),
  ('KR-11-JUNGNANG', '중랑구', 7),
  ('KR-11-SEONGBUK', '성북구', 8),
  ('KR-11-GANGBUK', '강북구', 9),
  ('KR-11-DOBONG', '도봉구', 10),
  ('KR-11-NOWON', '노원구', 11),
  ('KR-11-EUNPYEONG', '은평구', 12),
  ('KR-11-MAPO', '마포구', 13),
  ('KR-11-YANGCHEON', '양천구', 14),
  ('KR-11-GANGSEO', '강서구', 15),
  ('KR-11-GURO', '구로구', 16),
  ('KR-11-GEUMCHEON', '금천구', 17),
  ('KR-11-YEONGDEUNGPO', '영등포구', 18),
  ('KR-11-DONGJAK', '동작구', 19),
  ('KR-11-GWANAK', '관악구', 20),
  ('KR-11-SECHO', '서초구', 21),
  ('KR-11-GANGNAM', '강남구', 22),
  ('KR-11-SONGPA', '송파구', 23),
  ('KR-11-GANGDONG', '강동구', 24)
) AS v(code, name, sort_order)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 관심/소비 카테고리
-- ---------------------------------------------------------------------------

INSERT INTO public.interest_categories (code, name, sort_order) VALUES
  ('FOOD', '음식·외식', 1),
  ('BEAUTY', '뷰티·화장품', 2),
  ('FASHION', '패션·의류', 3),
  ('ELECTRONICS', '전자·가전', 4),
  ('HOME', '홈·리빙', 5),
  ('HEALTH', '건강·운동', 6),
  ('TRAVEL', '여행·레저', 7),
  ('EDUCATION', '교육·학습', 8),
  ('FINANCE', '금융·보험', 9),
  ('AUTO', '자동차·모빌리티', 10),
  ('PET', '반려동물', 11),
  ('KIDS', '육아·유아', 12),
  ('ENTERTAINMENT', '엔터·문화', 13),
  ('LOCAL', '동네·로컬', 14)
ON CONFLICT (code) DO NOTHING;

-- 음식 하위 카테고리 샘플
INSERT INTO public.interest_categories (code, name, parent_id, sort_order)
SELECT
  v.code,
  v.name,
  (SELECT id FROM public.interest_categories WHERE code = 'FOOD'),
  v.sort_order
FROM (VALUES
  ('FOOD-CAFE', '카페·디저트', 1),
  ('FOOD-KOREAN', '한식', 2),
  ('FOOD-WESTERN', '양식', 3),
  ('FOOD-DELIVERY', '배달·테이크아웃', 4)
) AS v(code, name, sort_order)
ON CONFLICT (code) DO NOTHING;
