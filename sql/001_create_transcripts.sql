-- =============================================
-- 001: 建立 transcripts 表（謄本資料）
-- 從 Google Sheets 遷移 13,046 筆
-- =============================================

CREATE TABLE IF NOT EXISTS transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 基本資訊
    community_name TEXT NOT NULL,
    community_address TEXT,
    owner_name TEXT,
    owner_address TEXT,

    -- PDF
    pdf_url TEXT,

    -- 地段
    land_section TEXT,

    -- 面積（坪）
    area_ping NUMERIC(10,2),
    total_ping NUMERIC(10,2),
    building_ping NUMERIC(10,2),
    main_area_ping NUMERIC(10,2),
    accessory_area_ping NUMERIC(10,2),
    public_area_ping NUMERIC(10,2),
    parking_area_ping NUMERIC(10,2),

    -- 統編
    id_prefix TEXT,

    -- 登記資訊
    registration_reason TEXT,
    registration_date TEXT,
    application_date TEXT,

    -- 他項權利
    registration_order TEXT,
    rights_type TEXT,
    mortgage_total NUMERIC(14,2),

    -- 公設
    public_common TEXT,
    public_rights_scope TEXT,
    small_public_area TEXT,
    small_public_rights TEXT,

    -- 車位
    parking_number TEXT,
    parking_rights_scope TEXT,

    -- 擷取日期
    extracted_date DATE,

    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 防重複
    CONSTRAINT unique_transcript UNIQUE (community_name, pdf_url)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_transcripts_community ON transcripts(community_name);
CREATE INDEX IF NOT EXISTS idx_transcripts_address ON transcripts(community_address);
CREATE INDEX IF NOT EXISTS idx_transcripts_owner ON transcripts(owner_name);
CREATE INDEX IF NOT EXISTS idx_transcripts_section ON transcripts(land_section);

-- RLS: 允許 anon 讀取
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON transcripts FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON transcripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update" ON transcripts FOR UPDATE USING (true);
