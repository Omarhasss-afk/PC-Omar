CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,name TEXT,role TEXT NOT NULL CHECK(role IN('admin','tech')),perms TEXT DEFAULT '[]',pass_hash TEXT NOT NULL,salt TEXT NOT NULL,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(k TEXT PRIMARY KEY,n INTEGER DEFAULT 0,until INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS otps(user_id INTEGER PRIMARY KEY,code_hash TEXT,expires INTEGER,tries INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS services(id TEXT PRIMARY KEY,title TEXT,price INTEGER,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(code TEXT PRIMARY KEY,name TEXT,phone TEXT,address TEXT,date TEXT,slot TEXT,device TEXT,services TEXT,total INTEGER,descr TEXT,hardware TEXT,stage TEXT DEFAULT 'Registered',tech_id INTEGER,created INTEGER,ckey TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS uq_slot ON orders(date,slot) WHERE stage!='Cancelled';
CREATE TABLE IF NOT EXISTS feedback(code TEXT PRIMARY KEY,name TEXT,rating INTEGER,comment TEXT,created INTEGER);
INSERT OR IGNORE INTO services(id,title,price) VALUES
('cleaning-paste','تنظيف عميق وتغيير معجون حراري',11100 ),
('bios-update','تحديث وضبط البايوس (BIOS / UEFI)',350),
('windows-drivers','ضبط الويندوز والتعريفات والتراخيص',400),
('full-diagnostic','فحص أداء وحرارة واختبار ضغط شامل',300);
