from paho.mqtt import client as mqtt_client
from app.services.stats_service import stats
from app.services.db_service import insert_history
import json
import os

USER = os.getenv("AIO_USERNAME")
KEY = os.getenv("AIO_KEY")
GROUP_NAME = "yolohome" 

mqtt = None

def on_message(client, userdata, msg):
    global last_temp, last_humi

    try:
        topic_tail = msg.topic.split('/')[-1]
        topic_path = topic_tail.split('.')[-1].lower()
        payload = msg.payload.decode().strip()

        if payload.startswith('{'):
            payload = json.loads(payload).get("value", "0")

        payload = str(payload).split(',')[0]

        if topic_path == "dist":
            topic_path = "pir"

        if topic_path not in stats:
            return

        val = float(payload)
        stats[topic_path] = val

        print(f"MQTT Inbox: {topic_path} -> {val}")

        if topic_path == "temp":
            last_temp = val
        elif topic_path == "humi":
            last_humi = val

        if last_temp is not None and last_humi is not None:
            insert_history(last_temp, last_humi)

            last_temp = None
            last_humi = None

    except Exception as e:
        print(f"Error processing message: {e}")



def init_mqtt():
    global mqtt

    mqtt = mqtt_client.Client(
        callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2
    )
    mqtt.username_pw_set(USER, KEY)
    mqtt.on_message = on_message

    mqtt.connect("io.adafruit.com", 1883)
    for key in stats:
        mqtt.subscribe(f"{USER}/feeds/{GROUP_NAME}.{key}")
    mqtt.loop_start()

    print("MQTT connected")


def publish(device, val):
    topic = f"{USER}/feeds/{GROUP_NAME}.{device}"
    mqtt.publish(topic, val)
    print(f"[PUBLISH] {val} -> {topic}")