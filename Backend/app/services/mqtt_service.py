from paho.mqtt import client as mqtt_client
from app.services.stats_service import stats
from app.services.db_service import insert_history

USER = os.getenv("AIO_USERNAME")
KEY = os.getenv("AIO_KEY")
GROUP_NAME = "yolohome" 

mqtt = None

def on_message(client, userdata, msg):
    try:
        if not msg.topic.startswith(f"{USER}/feeds/{GROUP_NAME}."):
            return

        if msg.topic.endswith("/json"):
            return

        topic = msg.topic.split('.')[-1]
        payload = msg.payload.decode().strip()

        payload = payload.replace(",", "")

        val = float(payload)

        key = "pir" if topic == "dist" else topic

        if key in stats:
            stats[key] = val

            if key in ["temp", "humi"]:
                conn = sqlite3.connect('database.db')
                c = conn.cursor()
                c.execute(
                    "INSERT INTO history (temp, humi) VALUES (?, ?)",
                    (stats["temp"], stats["humi"])
                )
                conn.commit()
                conn.close()

        print(f"[MQTT] {key} -> {val}")

    except Exception as e:
        print("MQTT error:", e)


def init_mqtt():
    global mqtt

    mqtt = mqtt_client.Client(
        callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2
    )
    mqtt.username_pw_set(USER, KEY)
    mqtt.on_message = on_message

    mqtt.connect("io.adafruit.com", 1883)
    mqtt.subscribe(f"{USER}/feeds/#")
    mqtt.loop_start()

    print("MQTT connected")


def publish(device, val):
    topic = f"{USER}/feeds/{GROUP_NAME}.{device}"
    mqtt.publish(topic, val)
    print(f"[PUBLISH] {val} -> {topic}")