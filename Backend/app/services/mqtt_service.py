# app/services/mqtt_service.py

from paho.mqtt import client as mqtt_client
from app.services.stats_service import stats
from app.services.db_service import insert_history
import os
USER = os.getenv("AIO_USERNAME")
KEY = os.getenv("AIO_KEY")
GROUP_NAME = "yolohome"

mqtt = None

def on_message(client, userdata, msg):
    try:
        topic_tail = msg.topic.split('/')[-1]
        topic = topic_tail.split('.')[-1]
        payload = msg.payload.decode()

        print(f"[MQTT] {topic} -> {payload}")

        if topic in stats:
            stats[topic] = float(payload)

            if topic in ["temp", "humi"]:
                insert_history(stats["temp"], stats["humi"])

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
    return mqtt


def publish(device, val):
    topic = f"{USER}/feeds/{GROUP_NAME}.{device}"
    mqtt.publish(topic, val)