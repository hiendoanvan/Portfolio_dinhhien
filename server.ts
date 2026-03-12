import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import fs from "fs";
import multer from "multer";

const db = new Database("portfolio.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    title TEXT,
    phone TEXT,
    email TEXT,
    linkedin TEXT,
    location TEXT,
    summary TEXT,
    avatar_url TEXT,
    facebook TEXT,
    tiktok TEXT,
    timezone TEXT,
    stat1_label TEXT,
    stat1_value TEXT,
    stat2_label TEXT,
    stat2_value TEXT,
    stat3_label TEXT,
    stat3_value TEXT,
    stat4_label TEXT,
    stat4_value TEXT
  );

  // Migration: Add columns if not exists
  const tableInfo = db.prepare("PRAGMA table_info(profile)").all() as any[];
  const columns = tableInfo.map(col => col.name);
  if (!columns.includes('timezone')) db.exec("ALTER TABLE profile ADD COLUMN timezone TEXT");
  if (!columns.includes('facebook')) db.exec("ALTER TABLE profile ADD COLUMN facebook TEXT");
  if (!columns.includes('tiktok')) db.exec("ALTER TABLE profile ADD COLUMN tiktok TEXT");

  CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    role TEXT,
    period TEXT,
    description TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    items TEXT
  );
`);

// Seed initial data if empty
const profileCount = db.prepare("SELECT COUNT(*) as count FROM profile").get() as { count: number };
if (profileCount.count === 0) {
  db.prepare(`
    INSERT INTO profile (id, name, title, phone, email, linkedin, location, summary)
    VALUES (1, 'Đoàn Văn Hiển', 'Digital Marketing Lead', '0943304685', 'hiendoanvan25@gmail.com', 'linkedin.com/in/doanvanhien', 'Nam Định | Open to Remote', 'Digital Marketing Lead với 6+ năm kinh nghiệm xây dựng và vận hành hệ thống Marketing đa kênh (Performance, SEO, Social, Website). Quản lý ngân sách 50 triệu/tháng, dẫn dắt đội nhóm 6 nhân sự, thúc đẩy tăng trưởng doanh thu 80–120% cho doanh nghiệp SME.')
  `).run();

  const experiences = [
    {
      company: 'CÔNG TY XÂY DỰNG NHÀ MỚI',
      role: 'Digital Marketing Lead',
      period: '2022 - Nay',
      description: '• Xây dựng và triển khai chiến lược SEO tổng thể, tăng traffic website từ 5.000 lên 12.000 lượt/tháng (+140%).\n• Đưa 60+ từ khóa thương mại vào Top 10 Google trong 12 tháng.\n• Ứng dụng AI sản xuất nội dung, video marketing, giảm 40% thời gian sản xuất.'
    },
    {
      company: 'LỘC PHÁT MEDIA',
      role: 'Trưởng nhóm Marketing',
      period: '2020 - 2022',
      description: '• Quản lý ngân sách quảng cáo lên tới 50 triệu/tháng.\n• Tối ưu chiến dịch nâng ROAS từ 2.1 lên 3.4.\n• Tăng doanh thu từ kênh Digital 120% sau 1 năm.'
    },
    {
      company: 'UNICA | BLUHA | AUTOLIGHT | TẤT ĐẠT',
      role: 'DIGITAL MARKETING (SEO/ADS)',
      period: '2015 - 2020',
      description: '• Triển khai quảng cáo Facebook & Google, duy trì ROAS 2.5–3.0.\n• Quản lý Fanpage trung bình đạt 4.000.000 lượt tiếp cận / tháng.'
    }
  ];

  const insertExp = db.prepare("INSERT INTO experience (company, role, period, description) VALUES (?, ?, ?, ?)");
  experiences.forEach(exp => insertExp.run(exp.company, exp.role, exp.period, exp.description));

  const skills = [
    { category: 'Performance Marketing', items: 'Facebook Ads, TikTok Ads, Tối ưu CPA, ROAS, Conversion' },
    { category: 'SEO & Website Growth', items: 'SEO tổng thể & Technical SEO, Thiết kế & quản trị Website (WordPress)' },
    { category: 'Social Media', items: 'Xây dựng chiến lược nội dung đa kênh, Ứng dụng AI sản xuất & tối ưu nội dung marketing' },
    { category: 'Data & Leadership', items: 'Phân tích dữ liệu (GA, GSC), Quản lý & đào tạo 3–6 nhân sự' }
  ];

  const insertSkill = db.prepare("INSERT INTO skills (category, items) VALUES (?, ?)");
  skills.forEach(skill => insertSkill.run(skill.category, skill.items));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Multer setup for image uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // API Routes
  app.get("/api/portfolio", (req, res) => {
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    const experiences = db.prepare("SELECT * FROM experience ORDER BY id ASC").all();
    const skills = db.prepare("SELECT * FROM skills ORDER BY id ASC").all();
    res.json({ profile, experiences, skills });
  });

  app.post("/api/profile", (req, res) => {
    const { 
      name, title, phone, email, linkedin, facebook, tiktok, timezone, location, summary,
      stat1_label, stat1_value, stat2_label, stat2_value, stat3_label, stat3_value, stat4_label, stat4_value
    } = req.body;
    db.prepare(`
      UPDATE profile SET 
        name = ?, title = ?, phone = ?, email = ?, linkedin = ?, facebook = ?, tiktok = ?, timezone = ?, location = ?, summary = ?,
        stat1_label = ?, stat1_value = ?, stat2_label = ?, stat2_value = ?, stat3_label = ?, stat3_value = ?, stat4_label = ?, stat4_value = ?
      WHERE id = 1
    `).run(
      name, title, phone, email, linkedin, facebook, tiktok, timezone, location, summary,
      stat1_label, stat1_value, stat2_label, stat2_value, stat3_label, stat3_value, stat4_label, stat4_value
    );
    res.json({ success: true });
  });

  app.post("/api/experience", (req, res) => {
    const { company, role, period, description, image_url } = req.body;
    db.prepare("INSERT INTO experience (company, role, period, description, image_url) VALUES (?, ?, ?, ?, ?)").run(company, role, period, description, image_url);
    res.json({ success: true });
  });

  app.put("/api/experience/:id", (req, res) => {
    const { id } = req.params;
    const { company, role, period, description, image_url } = req.body;
    db.prepare("UPDATE experience SET company = ?, role = ?, period = ?, description = ?, image_url = ? WHERE id = ?").run(company, role, period, description, image_url, id);
    res.json({ success: true });
  });

  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, imageUrl });
    } else {
      res.status(400).json({ error: "No file uploaded" });
    }
  });

  app.delete("/api/experience/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM experience WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/upload-avatar", upload.single("avatar"), (req, res) => {
    if (req.file) {
      const avatarUrl = `/uploads/${req.file.filename}`;
      db.prepare("UPDATE profile SET avatar_url = ? WHERE id = 1").run(avatarUrl);
      res.json({ success: true, avatarUrl });
    } else {
      res.status(400).json({ error: "No file uploaded" });
    }
  });

  // Serve static files from public
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
