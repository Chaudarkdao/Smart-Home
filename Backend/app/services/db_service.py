import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DB = BASE_DIR / "database.db"


from datetime import datetime


def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temp REAL,
            humi REAL,
            light INTEGER DEFAULT 0,
            time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

    print("Database initialized!")



def insert_history(temp, humi, light=0):
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("""
        INSERT INTO history (temp, humi, light, time)
        VALUES (?, ?, ?, ?)
    """, (
        float(temp),
        float(humi),
        int(float(light)),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    c.execute("""
        DELETE FROM history
        WHERE time < datetime('now', 'localtime', '-3 days')
    """)

    conn.commit()
    conn.close()

    print("INSERT HISTORY:", temp, humi, light)


def get_history():
    conn = sqlite3.connect(DB)

    print("Reading DB:", DB)

    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT temp, humi, light, time
        FROM history
        ORDER BY id DESC
        LIMIT 20
    """)

    data = c.fetchall()

    conn.close()

    logs = []

    for r in data:

        logs.append({
            "time": r["time"][11:19],
            "temp": r["temp"],
            "humi": r["humi"],
            "light": r["light"]
        })

    return {

        # dùng cho chart
        "temp": [r["temp"] for r in data][::-1],
        "humi": [r["humi"] for r in data][::-1],

        # dùng cho bảng log
        "logs": logs
    }
def get_chart_history():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
         SELECT
            strftime('%Y-%m-%d', time) AS date,
            strftime('%H:%M', time) AS time,
            temp,
            humi,
            light
        FROM history
        WHERE
            time >= datetime('now', 'localtime', '-3 days')

            AND strftime('%M', time) IN (
                '00','05','10','15',
                '20','25','30','35',
                '40','45','50','55'
            )

            AND strftime('%S', time) = '00'
        ORDER BY datetime(time) ASC
    """)

    rows = c.fetchall()
    conn.close()

    return {
        "chart": [
            {   
                "date": row["date"],
                "time": row["time"],
                "temp": row["temp"],
                "humi": row["humi"],
                "light": row["light"]
            }
            for row in rows
        ]
    }