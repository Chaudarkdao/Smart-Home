import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DB = BASE_DIR / "database.db"
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temp REAL,
            humi REAL,
            time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

    print("Database initialized!")

def insert_history(temp, humi):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO history (temp, humi) VALUES (?, ?)", (temp, humi))
    conn.commit()
    conn.close()

def get_history():
    conn = sqlite3.connect(DB)
    print("Reading DB:", DB)
    c = conn.cursor()
    c.execute("SELECT temp, humi FROM history ORDER BY id DESC LIMIT 10")
    data = c.fetchall()
    conn.close()

    return {
        "temp": [r[0] for r in data][::-1],
        "humi": [r[1] for r in data][::-1]
    }
