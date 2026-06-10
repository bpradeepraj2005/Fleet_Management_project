import sqlite3
conn = sqlite3.connect('sql_app.db')
conn.execute("UPDATE users SET driver_id = 'DRV_001' WHERE email = 'driver@raj.com'")
conn.execute("UPDATE users SET driver_id = 'DRV_002' WHERE email = 'driver123@example.com'")
conn.commit()
conn.close()
